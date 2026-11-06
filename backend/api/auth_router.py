from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.logger import logger
from core.security import create_access_token, decode_access_token, hash_password, verify_password
from repositories import UserRepository
from schemas import TokenResponse, UserCreate, UserLogin, UserResponse, UserRole

router = APIRouter(prefix="/auth", tags=["Authentication"])
security_scheme = HTTPBearer(description="Ingresa el token JWT obtenido en /auth/login")

def get_user_repo() -> UserRepository:
    """Inyecto la instancia del repositorio de usuarios."""
    return UserRepository()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    user_repo: UserRepository = Depends(get_user_repo)
) -> UserResponse:
    """
    Dependencia de seguridad: valida el token Bearer y recupera el usuario activo de la base de datos.
    """
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = str(payload.get("sub", ""))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de autenticación inválidas o sesión expirada."
        )

    try:
        user = await user_repo.get_by_id(user_id)
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al verificar la identidad del usuario."
        )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inexistente o cuenta deshabilitada."
        )
    return user

async def require_admin_role(
    current_user: UserResponse = Depends(get_current_user)
) -> UserResponse:
    """
    Guardia RBAC: restringe el acceso exclusivamente a usuarios con rol 'admin'.
    """
    if current_user.role != UserRole.ADMIN:
        logger.warning("Acceso denegado: se requiere rol de administrador", user_email=current_user.email)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes: esta operación requiere privilegios de Administrador."
        )
    return current_user

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo usuario consumidor"
)
async def register_user(
    user_in: UserCreate,
    user_repo: UserRepository = Depends(get_user_repo)
) -> TokenResponse:
    """
    Registra un nuevo usuario con rol 'user' por defecto y devuelve su sesión JWT iniciada.
    """
    try:
        existing_user = await user_repo.get_raw_by_email(user_in.email)
        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ingresado ya se encuentra registrado."
            )

        hashed_pwd = hash_password(user_in.password)
        created_user = await user_repo.create(user_in=user_in, hashed_password=hashed_pwd, role=UserRole.USER)
        token = create_access_token(user_id=str(created_user.id), role=created_user.role.value)
        
        return TokenResponse(access_token=token, user=created_user)
    except RuntimeError as exc:
        logger.error("Error interno durante el registro de usuario", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar el registro."
        )

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesión y obtener token JWT"
)
async def login_user(
    credentials_in: UserLogin,
    user_repo: UserRepository = Depends(get_user_repo)
) -> TokenResponse:
    """
    Autentica correo y contraseña retornando el token JWT firmado junto a los datos del perfil.
    """
    try:
        raw_user = await user_repo.get_raw_by_email(credentials_in.email)
    except RuntimeError as exc:
        logger.error("Error interno durante el login", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar la autenticación."
        )

    if not raw_user or not verify_password(credentials_in.password, str(raw_user.get("hashed_password", ""))):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos."
        )

    if not raw_user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta de usuario se encuentra deshabilitada."
        )

    user_response = UserResponse(**raw_user)
    token = create_access_token(user_id=str(user_response.id), role=user_response.role.value)
    return TokenResponse(access_token=token, user=user_response)

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obtener el perfil del usuario autenticado"
)
async def get_my_profile(
    current_user: UserResponse = Depends(get_current_user)
) -> UserResponse:
    """
    Retorna los datos del usuario asociado al token JWT enviado en la cabecera Authorization.
    """
    return current_user