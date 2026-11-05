"""
Módulo Schemas: Contiene los modelos de validación de Pydantic (DTOs) 
para sanitizar los datos de entrada y salida de la API.
"""

from .supermarket import SupermarketBase, SupermarketCreate, SupermarketResponse
from .promotion import PromotionBase, PromotionCreate, PromotionResponse

# __all__ define explícitamente qué clases se exportan cuando se usa 'from schemas import *'
__all__ = [
    "SupermarketBase",
    "SupermarketCreate",
    "SupermarketResponse",
    "PromotionBase",
    "PromotionCreate",
    "PromotionResponse"
]