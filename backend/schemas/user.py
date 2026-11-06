import re
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, field_validator
from models.pyobjectid import PyObjectId

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w{2,}$")

class UserRole(str, Enum):
    """
    Defino los roles permitidos en el sistema para el control de acceso (RBAC).
    """
    ADMIN = "admin"
    USER = "user"

class UserBase(BaseModel):
    """
    Atributos comunes de identidad del usuario.
    """
    email: str = Field(..., max_length=120, description="Correo electrónico único del usuario")
    full_name: str = Field(..., min_length=2, max_length=100, description="Nombre y apellido")

    @field_validator("email")
    @classmethod
    def validate_and_normalize_email(cls, value: str) -> str:
        """
        Normalizo el email en minúsculas y valido su estructura sintáctica.
        """
        clean_email = value.strip().lower()
        if not EMAIL_REGEX.match(clean_email):
            raise ValueError("El formato del correo electrónico no es válido.")
        return clean_email

class UserCreate(UserBase):
    """
    DTO para el registro de nuevos usuarios (POST /auth/register).
    """
    password: str = Field(..., min_length=8, max_length=64, description="Contraseña en texto plano (mínimo 8 caracteres)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "cliente@buscapromo.com",
                "full_name": "Gabriel Roqué",
                "password": "PasswordSeguro2026!"
            }
        }
    )

class UserLogin(BaseModel):
    """
    DTO para el inicio de sesión (POST /auth/login).
    """
    email: str = Field(..., description="Correo electrónico registrado")
    password: str = Field(..., description="Contraseña de la cuenta")

    @field_validator("email")
    @classmethod
    def normalize_login_email(cls, value: str) -> str:
        return value.strip().lower()

class UserResponse(UserBase):
    """
    DTO público de usuario. Omite estrictamente el hash de la contraseña por seguridad.
    """
    id: PyObjectId = Field(..., validation_alias="_id")
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)

class TokenResponse(BaseModel):
    """
    Respuesta estándar de autenticación conteniendo el JWT y el perfil del usuario.
    """
    access_token: str
    token_type: str = "bearer"
    user: UserResponse