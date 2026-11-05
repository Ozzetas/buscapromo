from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status

from schemas import SupermarketCreate, SupermarketResponse
from repositories import SupermarketRepository
from core.logger import logger

router = APIRouter(prefix="/supermarkets", tags=["Supermarkets"])

def get_supermarket_repo() -> SupermarketRepository:
    """Inyecto la instancia del repositorio de supermercados."""
    return SupermarketRepository()

@router.post(
    "/", 
    response_model=SupermarketResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo supermercado"
)
async def create_supermarket(
    supermarket_in: SupermarketCreate,
    repo: SupermarketRepository = Depends(get_supermarket_repo)
) -> SupermarketResponse:
    """
    Da de alta una sucursal validando sus coordenadas geográficas.
    """
    try:
        return await repo.create(supermarket_in)
    except RuntimeError as exc:
        logger.error("Fallo al crear supermercado vía API", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar el alta del supermercado."
        )

@router.get(
    "/nearby",
    response_model=List[SupermarketResponse],
    summary="Buscar supermercados dentro de un radio en kilómetros"
)
async def list_nearby_supermarkets(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitud actual del usuario (ej. -31.4167 en Córdoba)"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitud actual del usuario (ej. -64.1833 en Córdoba)"),
    radius_km: float = Query(default=1.5, gt=0.1, le=20.0, description="Radio de búsqueda en kilómetros (por defecto 1.5 km)"),
    repo: SupermarketRepository = Depends(get_supermarket_repo)
) -> List[SupermarketResponse]:
    """
    Retorna los supermercados ubicados dentro del radio solicitado, ordenados por cercanía
    e incluyendo el cálculo exacto en el campo 'distance_km'.
    """
    try:
        return await repo.get_nearby(user_lat=latitude, user_lon=longitude, radius_km=radius_km)
    except RuntimeError as exc:
        logger.error("Fallo al buscar supermercados cercanos vía API", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar la búsqueda geoespacial."
        )

@router.get(
    "/{supermarket_id}", 
    response_model=SupermarketResponse,
    summary="Obtener un supermercado por ID"
)
async def get_supermarket(
    supermarket_id: str,
    repo: SupermarketRepository = Depends(get_supermarket_repo)
) -> SupermarketResponse:
    """
    Busca una sucursal específica por su identificador único.
    """
    try:
        supermarket = await repo.get_by_id(supermarket_id)
        if not supermarket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supermercado con ID {supermarket_id} no encontrado."
            )
        return supermarket
    except RuntimeError as exc:
        logger.error(f"Fallo al consultar supermercado {supermarket_id} vía API", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al consultar la base de datos."
        )

@router.get(
    "/", 
    response_model=List[SupermarketResponse],
    summary="Listar todos los supermercados"
)
async def list_supermarkets(
    repo: SupermarketRepository = Depends(get_supermarket_repo)
) -> List[SupermarketResponse]:
    """
    Retorna el catálogo completo de supermercados registrados.
    """
    try:
        return await repo.get_all()
    except RuntimeError as exc:
        logger.error("Fallo al listar supermercados vía API", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al extraer el catálogo de supermercados."
        )