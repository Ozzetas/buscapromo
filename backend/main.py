from contextlib import asynccontextmanager
from typing import Callable, Awaitable

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from core.config import settings
from core.logger import logger
from db.database import connect_to_mongo, close_mongo_connection

# Importo los enrutadores de las entidades del sistema
from api.supermarket_router import router as supermarket_router
from api.promotion_router import router as promotion_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiono el ciclo de vida de la aplicación: inicio el pool de conexiones a MongoDB 
    al arrancar el servidor y lo cierro de forma segura al detener el servicio.
    """
    logger.info(
        "Iniciando servicio", 
        environment=settings.ENVIRONMENT, 
        version=settings.VERSION
    )
    await connect_to_mongo()
    
    yield
    
    logger.info("Iniciando secuencia de apagado del servicio")
    await close_mongo_connection()

def create_app() -> FastAPI:
    """
    Aplico el patrón Factory para construir e inicializar la aplicación FastAPI.
    Facilita las pruebas automatizadas y desacopla la configuración global.
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="API RESTful para la plataforma geolocalizada de ofertas Buscapromo",
        lifespan=lifespan
    )

    @app.middleware("http")
    async def log_requests(
        request: Request, 
        call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """
        Middleware de observabilidad: registra cada petición HTTP entrante y su código de respuesta.
        """
        logger.info("Petición recibida", method=request.method, url=str(request.url))
        try:
            response: Response = await call_next(request)
            logger.info("Petición procesada", status_code=response.status_code)
            return response
        except Exception as exc:
            logger.error("Excepción no controlada atrapada en el middleware", exc_info=exc)
            return JSONResponse(
                status_code=500,
                content={"detail": "Error interno del servidor."}
            )

    # Registro los módulos de rutas bajo el versionado /api/v1
    app.include_router(supermarket_router, prefix="/api/v1")
    app.include_router(promotion_router, prefix="/api/v1")

    @app.get("/health", tags=["Health"])
    async def health_check() -> dict[str, str]:
        """Endpoint de diagnóstico para monitoreo de disponibilidad del servidor."""
        return {"status": "ok", "environment": settings.ENVIRONMENT}

    return app

app = create_app()