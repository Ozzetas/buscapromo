from contextlib import asynccontextmanager
from typing import Callable, Awaitable

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from core.config import settings
from core.logger import logger
from db.database import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manejo moderno del ciclo de vida en FastAPI.
    Asegura que la BD se conecte antes de recibir tráfico y se cierre al apagar.
    """
    logger.info(
        "Iniciando servicio", 
        environment=settings.ENVIRONMENT, 
        version=settings.VERSION
    )
    await connect_to_mongo()
    
    yield  # La aplicación atiende peticiones aquí
    
    logger.info("Iniciando secuencia de apagado del servicio")
    await close_mongo_connection()

def create_app() -> FastAPI:
    """
    Factory pattern para la instancia de la aplicación.
    Aísla la configuración para facilitar la inyección de dependencias en los tests.
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="API core para la plataforma Buscapromo",
        lifespan=lifespan
    )

    @app.middleware("http")
    async def log_requests(
        request: Request, 
        call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """
        Middleware con tipado estricto para registrar peticiones y atrapar errores críticos.
        """
        logger.info("Petición recibida", method=request.method, url=str(request.url))
        try:
            response: Response = await call_next(request)
            logger.info("Petición procesada", status_code=response.status_code)
            return response
        except Exception as exc:
            logger.error("Error crítico no controlado en la petición", exc_info=exc)
            return JSONResponse(
                status_code=500,
                content={"detail": "Error interno del servidor. El equipo técnico ha sido notificado."}
            )

    @app.get("/health")
    async def health_check() -> dict[str, str]:
        """Endpoint base para comprobación de estado de los contenedores/servidor."""
        return {"status": "ok", "environment": settings.ENVIRONMENT}

    return app

app = create_app()