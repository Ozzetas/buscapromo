from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId

from core.logger import logger
from db.database import get_database
from schemas.supermarket import SupermarketCreate, SupermarketResponse

class SupermarketRepository:
    """
    Repositorio para la entidad Supermercado.
    Encapsula toda la interacción directa con la colección 'supermarkets' de MongoDB.
    """
    def __init__(self) -> None:
        # Inyección de la base de datos al instanciar el repositorio
        self.db = get_database()
        self.collection = self.db.get_collection("supermarkets")

    async def create(self, supermarket: SupermarketCreate) -> SupermarketResponse:
        """
        Inserta un nuevo supermercado en la base de datos.
        """
        try:
            # Convertimos el esquema Pydantic a un diccionario nativo de Python
            document = supermarket.model_dump()
            result = await self.collection.insert_one(document)
            
            # Recuperamos el documento recién creado para asegurar consistencia
            created_doc = await self.collection.find_one({"_id": result.inserted_id})
            assert created_doc is not None, "Error de consistencia: No se encontró el documento tras la inserción."
            
            return SupermarketResponse(**created_doc)
        except Exception as exc:
            logger.error("Error crítico al persistir el supermercado", exc_info=exc)
            raise RuntimeError("Fallo en la capa de persistencia de datos.") from exc

    async def get_by_id(self, supermarket_id: str) -> Optional[SupermarketResponse]:
        """
        Busca un supermercado específico por su ID.
        Retorna None si no existe o si el formato del ID es inválido.
        """
        try:
            # Validación estricta del formato ObjectId antes de golpear la base de datos
            obj_id = ObjectId(supermarket_id)
        except InvalidId:
            logger.warning("Intento de búsqueda con ObjectId inválido", supermarket_id=supermarket_id)
            return None

        try:
            document = await self.collection.find_one({"_id": obj_id})
            if document:
                return SupermarketResponse(**document)
            return None
        except Exception as exc:
            logger.error("Error al consultar el supermercado por ID", supermarket_id=supermarket_id, exc_info=exc)
            raise RuntimeError("Fallo en la capa de lectura de datos.") from exc

    async def get_all(self) -> List[SupermarketResponse]:
        """
        Recupera el listado completo de supermercados.
        """
        try:
            # En producción real, este método debe implementar paginación (skip/limit).
            # Para esta fase inicial, extraemos todos los documentos.
            cursor = self.collection.find({})
            supermarkets: List[SupermarketResponse] = []
            
            async for document in cursor:
                supermarkets.append(SupermarketResponse(**document))
                
            return supermarkets
        except Exception as exc:
            logger.error("Error al extraer el listado de supermercados", exc_info=exc)
            raise RuntimeError("Fallo en la capa de lectura masiva de datos.") from exc