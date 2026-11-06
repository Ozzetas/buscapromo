from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from schemas import (
    PromotionCreate, 
    PromotionResponse, 
    PromotionWithSupermarketResponse,
    SupermarketResponse
)
from repositories import PromotionRepository, SupermarketRepository
from core.logger import logger

router = APIRouter(prefix="/promotions", tags=["Promotions"])

def get_promotion_repo() -> PromotionRepository:
    """Proveo la instancia del repositorio de promociones mediante Inyección de Dependencias."""
    return PromotionRepository()

def get_supermarket_repo() -> SupermarketRepository:
    """Proveo el repositorio de supermercados para validar integridad y cercanía geográfica."""
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
    Valido que el supermercado exista en la base de datos antes de registrar la promoción.
    """
    try:
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
    "/search",
    response_model=List[PromotionWithSupermarketResponse],
    summary="Buscar promociones activas por ubicación geográfica y día de la semana"
)
async def search_promotions_nearby(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitud actual del usuario"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitud actual del usuario"),
    radius_km: float = Query(default=1.5, gt=0.1, le=20.0, description="Radio de búsqueda en kilómetros"),
    day_of_week: Optional[int] = Query(default=None, ge=0, le=6, description="Día de la semana opcional (0=Lunes, 6=Domingo)"),
    promo_repo: PromotionRepository = Depends(get_promotion_repo),
    super_repo: SupermarketRepository = Depends(get_supermarket_repo)
) -> List[PromotionWithSupermarketResponse]:
    """
    Endpoint principal de negocio para Buscapromo:
    1. Calculo los supermercados dentro del radio en kilómetros.
    2. Recupero las promociones vigentes para esas sucursales en el día indicado.
    3. Ensamblo y ordeno la respuesta por cercanía y porcentaje de descuento.
    """
    try:
        nearby_supermarkets = await super_repo.get_nearby(
            user_lat=latitude, user_lon=longitude, radius_km=radius_km
        )
        if not nearby_supermarkets:
            return []

        # Creo un diccionario en memoria O(1) para asociar cada supermercado con sus promociones
        supermarket_map: Dict[str, SupermarketResponse] = {
            str(s.id): s for s in nearby_supermarkets
        }

        promotions = await promo_repo.get_active_by_supermarkets_and_day(
            supermarket_ids=list(supermarket_map.keys()),
            day_of_week=day_of_week
        )

        enriched_results: List[PromotionWithSupermarketResponse] = []
        for promo in promotions:
            supermarket_data = supermarket_map.get(str(promo.supermarket_id))
            if supermarket_data is not None:
                # Instancio el DTO compuesto pasando 'id=promo.id' para satisfacer el tipado estricto
                enriched_results.append(
                    PromotionWithSupermarketResponse(
                        id=promo.id,
                        supermarket_id=promo.supermarket_id,
                        title=promo.title,
                        description=promo.description,
                        discount_percentage=promo.discount_percentage,
                        applicable_days=promo.applicable_days,
                        is_active=promo.is_active,
                        created_at=promo.created_at,
                        supermarket=supermarket_data
                    )
                )

        # Ordeno priorizando la menor distancia en km y luego el mayor porcentaje de descuento
        enriched_results.sort(
            key=lambda item: (
                item.supermarket.distance_km if item.supermarket.distance_km is not None else float("inf"),
                -(item.discount_percentage or 0.0)
            )
        )
        return enriched_results

    except RuntimeError as exc:
        logger.error("Error al ejecutar búsqueda combinada de promociones", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al buscar promociones cercanas."
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
    Devuelvo todas las promociones activas asociadas a una sucursal específica.
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
    Permito obtener los descuentos vigentes según el día seleccionado sin filtro geográfico.
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
    Desactivo una promoción vigente sin borrar el documento físico de la colección.
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