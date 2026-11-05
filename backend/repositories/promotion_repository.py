from typing import List
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import PyMongoError

from core.logger import logger
from db.database import get_database
from schemas.promotion import PromotionCreate, PromotionResponse

class PromotionRepository:
    """
    Implemento el Patrón Repositorio para la entidad Promoción.
    Centralizo las consultas a la colección 'promotions' para mantener 
    desacoplada la lógica de persistencia de las rutas HTTP.
    """
    def __init__(self) -> None:
        self.db = get_database()
        self.collection = self.db.get_collection("promotions")

    async def create(self, promotion: PromotionCreate) -> PromotionResponse:
        """
        Registra una nueva promoción convirtiendo la clave foránea a ObjectId 
        y asignando la marca de tiempo en formato UTC estándar.
        """
        try:
            document = promotion.model_dump()
            # Almaceno supermarket_id como ObjectId nativo para optimizar futuros lookups en MongoDB
            document["supermarket_id"] = ObjectId(document["supermarket_id"])
            document["created_at"] = datetime.now(timezone.utc)

            result = await self.collection.insert_one(document)
            created_doc = await self.collection.find_one({"_id": result.inserted_id})
            
            if created_doc is None:
                raise RuntimeError("Inconsistencia de datos: documento no encontrado tras insert_one.")
            
            return PromotionResponse(**created_doc)
            
        except PyMongoError as exc:
            logger.error("Fallo de driver MongoDB al insertar promoción", exc_info=exc)
            raise RuntimeError("Error en la capa de persistencia al crear la promoción.") from exc

    async def get_active_by_supermarket(self, supermarket_id: str) -> List[PromotionResponse]:
        """
        Consulta todas las promociones vigentes de una sucursal específica.
        """
        try:
            obj_id = ObjectId(supermarket_id)
        except InvalidId:
            logger.warning("ID de supermercado con formato BSON inválido", supermarket_id=supermarket_id)
            return []

        try:
            cursor = self.collection.find({
                "supermarket_id": obj_id,
                "is_active": True
            })
            
            promotions: List[PromotionResponse] = []
            async for document in cursor:
                promotions.append(PromotionResponse(**document))
                
            return promotions
            
        except PyMongoError as exc:
            logger.error(
                "Fallo de lectura en MongoDB al filtrar por supermercado", 
                supermarket_id=supermarket_id, 
                exc_info=exc
            )
            raise RuntimeError("Error al consultar promociones del supermercado.") from exc

    async def get_active_by_day(self, day_of_week: int) -> List[PromotionResponse]:
        """
        Filtra promociones activas según el día de la semana (0=Lunes, 6=Domingo).
        MongoDB busca automáticamente si el entero existe dentro del array 'applicable_days'.
        """
        try:
            cursor = self.collection.find({
                "applicable_days": day_of_week,
                "is_active": True
            })
            
            promotions: List[PromotionResponse] = []
            async for document in cursor:
                promotions.append(PromotionResponse(**document))
                
            return promotions
            
        except PyMongoError as exc:
            logger.error(
                "Fallo de lectura en MongoDB al filtrar promociones por día", 
                day_of_week=day_of_week, 
                exc_info=exc
            )
            raise RuntimeError("Error al consultar promociones por día.") from exc

    async def deactivate_promotion(self, promotion_id: str) -> bool:
        """
        Aplica borrado lógico (Soft Delete) cambiando el estado booleano 'is_active'.
        Permite mantener integridad histórica en la base de datos sin destruir registros.
        """
        try:
            obj_id = ObjectId(promotion_id)
        except InvalidId:
            logger.warning("ID de promoción con formato BSON inválido al desactivar", promotion_id=promotion_id)
            return False

        try:
            result = await self.collection.update_one(
                {"_id": obj_id, "is_active": True},
                {"$set": {"is_active": False}}
            )
            return result.modified_count > 0
            
        except PyMongoError as exc:
            logger.error("Fallo en MongoDB al desactivar promoción", promotion_id=promotion_id, exc_info=exc)
            raise RuntimeError("Error en la capa de datos al dar de baja la promoción.") from exc