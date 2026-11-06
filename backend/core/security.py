from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, cast
import bcrypt
import jwt
from jwt.exceptions import PyJWTError

from core.config import settings
from core.logger import logger

# Defino contratos de función estrictos mediante Callable y cast para evitar que Pylance
# marque como 'Unknown' los tipos de llaves asimétricas opcionales de PyJWT.
_jwt_encode = cast(Callable[..., str], getattr(jwt, "encode"))
_jwt_decode = cast(Callable[..., Dict[str, Any]], getattr(jwt, "decode"))

def hash_password(plain_password: str) -> str:
    """
    Genero un hash irreversible de la contraseña en texto plano utilizando bcrypt con salt aleatorio.
    """
    password_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifico en tiempo constante si la contraseña ingresada coincide con el hash almacenado.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except ValueError as exc:
        logger.error("Formato de hash corrupto al verificar contraseña", exc_info=exc)
        return False

def create_access_token(user_id: str, role: str) -> str:
    """
    Emito un token JWT firmado digitalmente incluyendo el identificador del usuario (sub),
    su rol de acceso y las marcas temporales de emisión (iat) y expiración (exp) en UTC.
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload: Dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": expire
    }
    return _jwt_encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodifico y valido la firma y vigencia temporal del token JWT.
    Lanzo ValueError explícito si el token expiró o fue adulterado.
    """
    try:
        payload: Dict[str, Any] = _jwt_decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except PyJWTError as exc:
        logger.warning("Intento de acceso con token JWT inválido o expirado", exc_info=exc)
        raise ValueError("Token de autenticación inválido o expirado.") from exc