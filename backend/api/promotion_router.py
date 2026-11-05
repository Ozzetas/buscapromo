from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path, status

from schemas import PromotionCreate, PromotionResponse
from repositories import PromotionRepository, SupermarketRepository
from core.logger import logger

router = APIRouter(prefix="/promotions", tags=["Promotions"])

def get_promotion_repo() -> PromotionRepository:
    """Proveo la instancia del repositorio de promociones mediante Inyección de Dependencias."""
    return PromotionRepository()

def get_supermarket_repo() -> SupermarketRepository:
    """Proveo el repositorio de supermercados para validar integridad referencial antes de crear ofertas."""
    return SupermarketRepository()

@router.post(
    "/",
    response_model=PromotionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una nueva promoción"
)
async def create_promotion(
    promotion_in: PromotionCreate,
    promo_repo: PromotionRepository = Depends(get_promotion_repo),
    super_repo: SupermarketRepository = Depends(get_supermarket_repo)
) -> PromotionResponse:
    """
    Valida que el supermercado exista en la base de datos antes de registrar la promoción.
    Garantiza integridad referencial a nivel de aplicación en un entorno NoSQL.
    """
    try:
        # Verifico que el supermercado asociado exista realmente
        supermarket = await super_repo.get_by_id(str(promotion_in.supermarket_id))
        if not supermarket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No existe un supermercado registrado con el ID {promotion_in.supermarket_id}."
            )
            
        return await promo_repo.create(promotion_in)
        
    except RuntimeError as exc:
        logger.error("Error procesando alta de promoción en el controlador", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al intentar registrar la promoción."
        )

@router.get(
    "/supermarket/{supermarket_id}",
    response_model=List[PromotionResponse],
    summary="Listar promociones activas de un supermercado"
)
async def list_promotions_by_supermarket(
    supermarket_id: str,
    promo_repo: PromotionRepository = Depends(get_promotion_repo)
) -> List[PromotionResponse]:
    """
    Devuelve todas las promociones activas asociadas a una sucursal específica.
    """
    try:
        return await promo_repo.get_active_by_supermarket(supermarket_id)
    except RuntimeError as exc:
        logger.error("Error al listar promociones por supermercado", supermarket_id=supermarket_id, exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al recuperar las promociones de la sucursal."
        )

@router.get(
    "/day/{day_of_week}",
    response_model=List[PromotionResponse],
    summary="Filtrar promociones activas por día de la semana"
)
async def list_promotions_by_day(
    day_of_week: int = Path(..., ge=0, le=6, description="Día de la semana: 0 (Lunes) a 6 (Domingo)"),
    promo_repo: PromotionRepository = Depends(get_promotion_repo)
) -> List[PromotionResponse]:
    """
    Endpoint principal para el consumidor final: permite obtener los descuentos vigentes 
    según el día seleccionado.
    """
    try:
        return await promo_repo.get_active_by_day(day_of_week)
    except RuntimeError as exc:
        logger.error("Error al listar promociones por día", day_of_week=day_of_week, exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al filtrar promociones por día."
        )

@router.patch(
    "/{promotion_id}/deactivate",
    status_code=status.HTTP_200_OK,
    summary="Dar de baja lógica una promoción"
)
async def deactivate_promotion(
    promotion_id: str,
    promo_repo: PromotionRepository = Depends(get_promotion_repo)
) -> dict[str, str]:
    """
    Desactiva una promoción vigente sin borrar el documento físico de la colección.
    """
    try:
        deactivated = await promo_repo.deactivate_promotion(promotion_id)
        if not deactivated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Promoción {promotion_id} no encontrada o ya se encontraba inactiva."
            )
        return {"status": "ok", "message": "Promoción desactivada correctamente."}
    except RuntimeError as exc:
        logger.error("Error al dar de baja la promoción", promotion_id=promotion_id, exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al intentar desactivar la promoción."
        )