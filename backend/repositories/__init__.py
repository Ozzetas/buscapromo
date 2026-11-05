"""
Módulo Repositories: Capa de Acceso a Datos (DAL).
Exporto los repositorios para facilitar su inyección en los controladores de la API.
"""

from .supermarket_repository import SupermarketRepository
from .promotion_repository import PromotionRepository

__all__ = [
    "SupermarketRepository",
    "PromotionRepository"
]