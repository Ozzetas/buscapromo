import math
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import PyMongoError

from core.logger import logger
from db.database import get_database
from schemas.supermarket import SupermarketCreate, SupermarketResponse

class SupermarketRepository:
    """
    Encapsulo las operaciones de acceso a datos para la colección 'supermarkets'.
    Incluyo cálculo geoespacial mediante la fórmula de Haversine para filtrar por radio.
    """
    EARTH_RADIUS_KM: float = 6371.0

    def __init__(self) -> None:
        self.db = get_database()
        self.collection = self.db.get_collection("supermarkets")

    @classmethod
    def _calculate_haversine_km(
        cls, lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """
        Calculo la distancia ortodrómica en kilómetros entre dos coordenadas geográficas.
        """
        rad_lat1 = math.radians(lat1)
        rad_lon1 = math.radians(lon1)
        rad_lat2 = math.radians(lat2)
        rad_lon2 = math.radians(lon2)

        delta_lat = rad_lat2 - rad_lat1
        delta_lon = rad_lon2 - rad_lon1

        a = (
            math.sin(delta_lat / 2) ** 2
            + math.cos(rad_lat1) * math.cos(rad_lat2) * math.sin(delta_lon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(cls.EARTH_RADIUS_KM * c, 2)

    async def create(self, supermarket: SupermarketCreate) -> SupermarketResponse:
        """
        Inserta una nueva sucursal en MongoDB y retorna el documento validado.
        """
        try:
            document = supermarket.model_dump()
            result = await self.collection.insert_one(document)
            
            created_doc = await self.collection.find_one({"_id": result.inserted_id})
            if created_doc is None:
                raise RuntimeError("Error de consistencia: No se encontró el supermercado tras la inserción.")
            
            return SupermarketResponse(**created_doc)
        except PyMongoError as exc:
            logger.error("Error de driver MongoDB al persistir el supermercado", exc_info=exc)
            raise RuntimeError("Fallo en la capa de persistencia de datos.") from exc

    async def get_by_id(self, supermarket_id: str) -> Optional[SupermarketResponse]:
        """
        Busca un supermercado específico por su ObjectId.
        """
        try:
            obj_id = ObjectId(supermarket_id)
        except InvalidId:
            logger.warning("Intento de búsqueda con ObjectId inválido", supermarket_id=supermarket_id)
            return None

        try:
            document = await self.collection.find_one({"_id": obj_id})
            if document:
                return SupermarketResponse(**document)
            return None
        except PyMongoError as exc:
            logger.error("Error en MongoDB al consultar supermercado por ID", supermarket_id=supermarket_id, exc_info=exc)
            raise RuntimeError("Fallo en la capa de lectura de datos.") from exc

    async def get_all(self) -> List[SupermarketResponse]:
        """
        Recupera el listado completo de supermercados registrados.
        """
        try:
            cursor = self.collection.find({})
            supermarkets: List[SupermarketResponse] = []
            
            async for document in cursor:
                supermarkets.append(SupermarketResponse(**document))
                
            return supermarkets
        except PyMongoError as exc:
            logger.error("Error en MongoDB al extraer el listado de supermercados", exc_info=exc)
            raise RuntimeError("Fallo en la capa de lectura masiva de datos.") from exc

    async def get_nearby(
        self, user_lat: float, user_lon: float, radius_km: float
    ) -> List[SupermarketResponse]:
        """
        Filtra y ordena de menor a mayor distancia los supermercados dentro del radio especificado.
        """
        try:
            cursor = self.collection.find({})
            nearby_supermarkets: List[SupermarketResponse] = []

            async for document in cursor:
                lat = document.get("latitude")
                lon = document.get("longitude")
                if lat is None or lon is None:
                    continue

                distance = self._calculate_haversine_km(user_lat, user_lon, float(lat), float(lon))
                if distance <= radius_km:
                    document["distance_km"] = distance
                    nearby_supermarkets.append(SupermarketResponse(**document))

            # Ordeno las sucursales priorizando la más cercana al usuario
            nearby_supermarkets.sort(key=lambda s: s.distance_km if s.distance_km is not None else float("inf"))
            return nearby_supermarkets
            
        except PyMongoError as exc:
            logger.error("Error en MongoDB al ejecutar búsqueda geoespacial", exc_info=exc)
            raise RuntimeError("Fallo al calcular supermercados cercanos.") from exc