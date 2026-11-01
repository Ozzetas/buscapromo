import sys
from typing import Any, Optional, cast
from motor.motor_asyncio import AsyncIOMotorClient

from core.config import settings
from core.logger import logger

class Database:
    """
    Patrón Singleton para mantener la instancia del cliente de MongoDB.
    Garantiza el reciclaje de conexiones para no saturar el pool.
    """
    client: Optional[Any] = None

db = Database()

async def connect_to_mongo() -> None:
    """
    Inicializa el pool de conexiones a MongoDB Atlas.
    Implementa Fail-Fast: si la red falla, el proceso muere limpiamente.
    """
    try:
        logger.info("Iniciando conexión a MongoDB Atlas...")
        
        # Type Casting: Envolvemos la instanciación con cast(Any, ...) 
        # Esto obliga a Pylance a descartar la inferencia parcial de 'AgnosticClient[Unknown]'
        # y resolver la expresión estáticamente como 'Any', eliminando el falso positivo.
        db.client = cast(Any, AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000
        ))
        
        assert db.client is not None, "Fallo crítico en la instanciación del cliente de MongoDB"
        
        # Validación activa de conectividad
        await db.client.admin.command('ping')
        logger.info("Conexión a MongoDB establecida exitosamente.")
        
    except Exception as exc:
        logger.error(
            "Error de tiempo de ejecución al conectar con MongoDB. Verifica la IP y credenciales.", 
            exc_info=exc
        )
        sys.exit(1)

async def close_mongo_connection() -> None:
    """
    Cierra limpiamente el pool de conexiones en el evento shutdown de la API.
    """
    if db.client is not None:
        logger.info("Cerrando conexión a MongoDB...")
        db.client.close()
        logger.info("Conexión a MongoDB cerrada limpiamente.")

def get_database() -> Any:
    """
    Inyección de Dependencias para la capa de Repositorios.
    """
    if db.client is None:
        raise ConnectionError("Intento de acceso a la base de datos antes de su inicialización.")
    
    return db.client[settings.DATABASE_NAME]