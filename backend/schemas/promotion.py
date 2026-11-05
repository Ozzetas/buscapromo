from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from models.pyobjectid import PyObjectId

class PromotionBase(BaseModel):
    """
    Esquema base para las promociones.
    Incluyo validaciones de rango numérico y consistencia en los días de aplicación.
    """
    supermarket_id: PyObjectId = Field(..., description="ID del supermercado al que pertenece la oferta")
    title: str = Field(..., min_length=5, max_length=150, description="Título descriptivo de la promoción")
    description: str = Field(..., min_length=5, max_length=500, description="Condiciones y topes de reintegro")
    discount_percentage: Optional[float] = Field(None, ge=1.0, le=100.0, description="Porcentaje de descuento")
    applicable_days: List[int] = Field(
        ..., 
        min_length=1, 
        max_length=7, 
        description="Días de vigencia (0=Lunes, 6=Domingo)"
    )
    is_active: bool = Field(default=True, description="Estado de vigencia de la promoción")

    @field_validator("applicable_days")
    @classmethod
    def validate_days_range(cls, days: List[int]) -> List[int]:
        """
        Verifico que cada día esté estrictamente entre 0 (Lunes) y 6 (Domingo)
        y elimino duplicados ordenando la lista resultante.
        """
        for day in days:
            if day < 0 or day > 6:
                raise ValueError("Los días de la semana deben estar comprendidos entre 0 (Lunes) y 6 (Domingo).")
        return sorted(list(set(days)))

class PromotionCreate(PromotionBase):
    """
    DTO para el alta de una promoción (POST).
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "supermarket_id": "6aebfd30323fdeb79130a02b",
                "title": "25% de descuento en línea de cajas con Bancor",
                "description": "Abonando con tarjetas de crédito Cordobesa. Tope de reintegro $8.000 por cuenta.",
                "discount_percentage": 25.0,
                "applicable_days": [1, 3],
                "is_active": True
            }
        }
    )

class PromotionResponse(PromotionBase):
    """
    DTO de respuesta (GET).
    Mapeo '_id' de BSON a 'id' sin exponer la estructura interna de la base de datos.
    """
    id: PyObjectId = Field(..., validation_alias="_id")
    created_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "6aebfd61323fdeb79130a02c",
                "supermarket_id": "6aebfd30323fdeb79130a02b",
                "title": "25% de descuento en línea de cajas con Bancor",
                "description": "Abonando con tarjetas de crédito Cordobesa. Tope de reintegro $8.000 por cuenta.",
                "discount_percentage": 25.0,
                "applicable_days": [1, 3],
                "is_active": True,
                "created_at": "2026-11-05T03:52:01.741000Z"
            }
        }
    )