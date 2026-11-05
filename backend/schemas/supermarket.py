from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from models.pyobjectid import PyObjectId

class SupermarketBase(BaseModel):
    """
    Defino la estructura base de una sucursal de supermercado.
    Exijo coordenadas geográficas válidas para habilitar el cálculo de distancia por radio.
    """
    name: str = Field(..., min_length=2, max_length=100, description="Nombre de la cadena o sucursal")
    address: str = Field(..., min_length=5, max_length=200, description="Dirección física de la sucursal")
    city: str = Field(default="Córdoba", min_length=2, max_length=100, description="Ciudad de ubicación")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitud en grados decimales")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitud en grados decimales")

class SupermarketCreate(SupermarketBase):
    """
    DTO de entrada para el registro de un nuevo supermercado (POST).
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Carrefour Express Centro",
                "address": "Av. Colón 350, Barrio Centro",
                "city": "Córdoba",
                "latitude": -31.4128,
                "longitude": -64.1872
            }
        }
    )

class SupermarketResponse(SupermarketBase):
    """
    DTO de salida para consultas (GET).
    Utilizo validation_alias='_id' para leer el identificador nativo de MongoDB
    y serializarlo limpiamente como 'id' hacia el cliente web.
    """
    id: PyObjectId = Field(..., validation_alias="_id")
    distance_km: Optional[float] = Field(
        default=None, 
        description="Distancia calculada en kilómetros respecto a la ubicación del usuario"
    )

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "6aebfd30323fdeb79130a02b",
                "name": "Carrefour Express Centro",
                "address": "Av. Colón 350, Barrio Centro",
                "city": "Córdoba",
                "latitude": -31.4128,
                "longitude": -64.1872,
                "distance_km": 0.45
            }
        }
    )