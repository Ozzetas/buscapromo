from typing import Any
from bson import ObjectId
from pydantic_core import core_schema

class PyObjectId(str):
    """
    Clase adaptadora de nivel de producción.
    Permite que Pydantic v2 valide los ObjectIDs de BSON entrantes y 
    los serialice a Strings convencionales en las respuestas JSON de FastAPI.
    """
    
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: Any
    ) -> core_schema.CoreSchema:
        """
        Define el contrato de validación y serialización estricta.
        """
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                # Acepta instancias nativas de ObjectId
                core_schema.is_instance_schema(ObjectId),
                # O acepta strings que pasen la validación estricta de BSON
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            # Asegura que al salir hacia el frontend, se parsee como String
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, value: Any) -> ObjectId:
        """
        Función de validación estricta (Fail-Fast).
        Si un cliente envía un ID con formato inválido, Pydantic atrapará el ValueError 
        y devolverá automáticamente un error HTTP 422 Unprocessable Entity.
        """
        if not ObjectId.is_valid(value):
            raise ValueError("El ObjectId proporcionado no cumple con el estándar BSON.")
        return ObjectId(value)