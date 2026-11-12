import asyncio
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List
from bson import ObjectId
from pymongo.errors import PyMongoError

from core.logger import logger
from core.security import hash_password
from db.database import connect_to_mongo, close_mongo_connection, get_database
from schemas.supermarket import SupermarketCreate
from schemas.promotion import PromotionCreate
from schemas.user import UserCreate, UserRole

SUPERMARKETS_SEED: List[Dict[str, Any]] = [
    {
        "name": "Carrefour Express Colón",
        "address": "Av. Colón 350, Barrio Centro",
        "city": "Córdoba",
        "latitude": -31.4128,
        "longitude": -64.1872
    },
    {
        "name": "Super Mami Dino Alto Verde",
        "address": "Rodríguez del Busto 4086, Alto Verde",
        "city": "Córdoba",
        "latitude": -31.3694,
        "longitude": -64.2185
    },
    {
        "name": "Cordiez San Juan",
        "address": "Blvd. San Juan 450, Nueva Córdoba",
        "city": "Córdoba",
        "latitude": -31.4215,
        "longitude": -64.1912
    },
    {
        "name": "Disco Chacabuco",
        "address": "Blvd. Chacabuco 547, Nueva Córdoba",
        "city": "Córdoba",
        "latitude": -31.4258,
        "longitude": -64.1838
    },
    {
        "name": "Carrefour Express 24 de Septiembre",
        "address": "Av. 24 de Septiembre 1250, Barrio General Paz",
        "city": "Córdoba",
        "latitude": -31.4142,
        "longitude": -64.1678
    }
]

USERS_SEED: List[Dict[str, Any]] = [
    {
        "email": "admin@buscapromo.com",
        "full_name": "Administrador Buscapromo",
        "password": "AdminPassword2026!",
        "role": UserRole.ADMIN
    },
    {
        "email": "cliente@buscapromo.com",
        "full_name": "Gabriel Roqué",
        "password": "ClientePassword2026!",
        "role": UserRole.USER
    }
]

async def run_seeder() -> None:
    """
    Ejecuto el poblado inicial de la base de datos de forma idempotente:
    purgo colecciones previas e inyecto usuarios (Admin/User), sucursales y promociones.
    """
    await connect_to_mongo()
    db = get_database()
    
    users_col = db.get_collection("users")
    supermarkets_col = db.get_collection("supermarkets")
    promotions_col = db.get_collection("promotions")

    try:
        logger.info("Purgo colecciones existentes para garantizar un estado limpio...")
        await users_col.delete_many({})
        await promotions_col.delete_many({})
        await supermarkets_col.delete_many({})

        # 1. Valido e inserto usuarios de prueba con contraseñas hasheadas con bcrypt
        for user_item in USERS_SEED:
            role: UserRole = user_item["role"]
            validated_user = UserCreate(
                email=user_item["email"],
                full_name=user_item["full_name"],
                password=user_item["password"]
            )
            user_doc: Dict[str, Any] = {
                "email": validated_user.email,
                "full_name": validated_user.full_name,
                "hashed_password": hash_password(validated_user.password),
                "role": role.value,
                "is_active": True,
                "created_at": datetime.now(timezone.utc)
            }
            await users_col.insert_one(user_doc)
            logger.info("Usuario semilla creado", email=validated_user.email, role=role.value)

        inserted_ids: Dict[str, ObjectId] = {}

        # 2. Valido e inserto los supermercados
        for item in SUPERMARKETS_SEED:
            validated_super = SupermarketCreate(**item)
            doc = validated_super.model_dump()
            result = await supermarkets_col.insert_one(doc)
            inserted_ids[validated_super.name] = result.inserted_id
            logger.info(
                "Supermercado insertado", 
                name=validated_super.name, 
                id=str(result.inserted_id)
            )

        # 3. Defino las promociones vinculadas a los ObjectId recién generados
        promotions_seed: List[Dict[str, Any]] = [
            {
                "supermarket_id": str(inserted_ids["Carrefour Express Colón"]),
                "title": "25% de ahorro con Tarjeta Cordobesa (Bancor)",
                "description": "Válido en un pago en toda la tienda. Tope de reintegro $10.000 por resumen.",
                "discount_percentage": 25.0,
                "applicable_days": [2],
                "is_active": True
            },
            {
                "supermarket_id": str(inserted_ids["Carrefour Express Colón"]),
                "title": "15% de descuento con Mi Carrefour",
                "description": "Descuento directo en línea de cajas presentando credencial digital.",
                "discount_percentage": 15.0,
                "applicable_days": [0, 3],
                "is_active": True
            },
            {
                "supermarket_id": str(inserted_ids["Super Mami Dino Alto Verde"]),
                "title": "20% en compras mayoristas y minoristas con Banco Macro",
                "description": "Abonando con MODO y tarjetas de crédito Visa o Mastercard. Tope $12.000.",
                "discount_percentage": 20.0,
                "applicable_days": [3, 4],
                "is_active": True
            },
            {
                "supermarket_id": str(inserted_ids["Cordiez San Juan"]),
                "title": "30% de descuento en Lácteos y Panificados",
                "description": "Pagando con billetera virtual MODO o efectivo en sucursal.",
                "discount_percentage": 30.0,
                "applicable_days": [1, 3],
                "is_active": True
            },
            {
                "supermarket_id": str(inserted_ids["Disco Chacabuco"]),
                "title": "25% de descuento con Cencosud y Santander",
                "description": "Exclusivo clientes adheridos. No acumulable con otras ofertas de góndola.",
                "discount_percentage": 25.0,
                "applicable_days": [0, 2, 4],
                "is_active": True
            },
            {
                "supermarket_id": str(inserted_ids["Carrefour Express 24 de Septiembre"]),
                "title": "20% de reintegro con Cuenta DNI / BNA+",
                "description": "Pagando con código QR desde la aplicación oficial. Tope semanal $6.000.",
                "discount_percentage": 20.0,
                "applicable_days": [1, 5],
                "is_active": True
            }
        ]

        # 4. Valido con Pydantic e inserto las promociones
        for promo_item in promotions_seed:
            validated_promo = PromotionCreate(**promo_item)
            promo_doc = validated_promo.model_dump()
            promo_doc["supermarket_id"] = ObjectId(promo_doc["supermarket_id"])
            promo_doc["created_at"] = datetime.now(timezone.utc)
            
            await promotions_col.insert_one(promo_doc)

        logger.info(
            "Seeder ejecutado exitosamente", 
            users_count=len(USERS_SEED),
            supermarkets_count=len(SUPERMARKETS_SEED), 
            promotions_count=len(promotions_seed)
        )

    except PyMongoError as exc:
        logger.error("Error de base de datos durante la ejecución del Seeder", exc_info=exc)
        sys.exit(1)
    except ValueError as exc:
        logger.error("Error de validación de esquemas Pydantic en los datos semilla", exc_info=exc)
        sys.exit(1)
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(run_seeder())
