"""
Módulo Schemas: Contiene los modelos de validación de Pydantic (DTOs) 
para sanitizar los datos de entrada y salida de la API.
"""

from .supermarket import SupermarketBase, SupermarketCreate, SupermarketResponse
from .promotion import (
    PromotionBase, 
    PromotionCreate, 
    PromotionResponse, 
    PromotionWithSupermarketResponse
)
from .user import (
    UserRole,
    UserBase,
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse
)

__all__ = [
    "SupermarketBase",
    "SupermarketCreate",
    "SupermarketResponse",
    "PromotionBase",
    "PromotionCreate",
    "PromotionResponse",
    "PromotionWithSupermarketResponse",
    "UserRole",
    "UserBase",
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "TokenResponse"
]