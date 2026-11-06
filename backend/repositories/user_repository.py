from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import PyMongoError

from core.logger import logger
from db.database import get_database
from schemas.user import UserCreate, UserResponse, UserRole

class UserRepository:
    """
    Encapsulo las operaciones de persistencia de la colección 'users'.
    Garantizo que las credenciales hasheadas solo se expongan internamente durante el login.
    """
    def __init__(self) -> None:
        self.db = get_database()
        self.collection = self.db.get_collection("users")

    async def get_raw_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Recupero el documento crudo de MongoDB (incluyendo 'hashed_password')
        exclusivamente para verificar credenciales o comprobar duplicados.
        """
        try:
            document: Optional[Dict[str, Any]] = await self.collection.find_one({"email": email.lower()})
            return document
        except PyMongoError as exc:
            logger.error("Error en MongoDB al buscar usuario por email", email=email, exc_info=exc)
            raise RuntimeError("Fallo en la capa de datos al consultar el correo electrónico.") from exc

    async def get_by_id(self, user_id: str) -> Optional[UserResponse]:
        """
        Busco un usuario por su ObjectId y retorno el DTO sanitizado sin contraseña.
        """
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            logger.warning("Intento de consulta de usuario con ObjectId inválido", user_id=user_id)
            return None

        try:
            document = await self.collection.find_one({"_id": obj_id})
            if document:
                return UserResponse(**document)
            return None
        except PyMongoError as exc:
            logger.error("Error en MongoDB al buscar usuario por ID", user_id=user_id, exc_info=exc)
            raise RuntimeError("Fallo en la capa de datos al consultar el perfil de usuario.") from exc

    async def create(
        self, 
        user_in: UserCreate, 
        hashed_password: str, 
        role: UserRole = UserRole.USER
    ) -> UserResponse:
        """
        Inserto un nuevo usuario asignando su rol y marca de tiempo en UTC.
        """
        try:
            document: Dict[str, Any] = {
                "email": user_in.email,
                "full_name": user_in.full_name,
                "hashed_password": hashed_password,
                "role": role.value,
                "is_active": True,
                "created_at": datetime.now(timezone.utc)
            }
            result = await self.collection.insert_one(document)
            created_doc = await self.collection.find_one({"_id": result.inserted_id})
            
            if created_doc is None:
                raise RuntimeError("Inconsistencia de datos: usuario no encontrado tras insert_one.")
                
            return UserResponse(**created_doc)
        except PyMongoError as exc:
            logger.error("Error en MongoDB al registrar nuevo usuario", email=user_in.email, exc_info=exc)
            raise RuntimeError("Fallo en la capa de persistencia al crear el usuario.") from exc