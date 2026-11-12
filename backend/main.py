from contextlib import asynccontextmanager
from typing import Callable, Awaitable

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.logger import logger
from db.database import connect_to_mongo, close_mongo_connection

from api.auth_router import router as auth_router
from api.supermarket_router import router as supermarket_router
from api.promotion_router import router as promotion_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestión del ciclo de vida de la aplicación.
    Garantiza la inicialización y el cierre seguro del pool de conexiones a MongoDB.
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
    Patrón Factory para inicializar la aplicación.
    Aísla la configuración y facilita la inyección de dependencias para testing.
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="API RESTful para la plataforma geolocalizada de ofertas Buscapromo",
        lifespan=lifespan
    )

    # Configuración estricta de CORS (Cross-Origin Resource Sharing)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
    )

    @app.middleware("http")
    async def log_requests(
        request: Request, 
        call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """
        Middleware de observabilidad estructurada.
        Registra cada petición HTTP y atrapa excepciones no controladas globalmente.
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
                content={"detail": "Error interno del servidor. El equipo técnico ha sido notificado."}
            )

    # Rutas de Experiencia de Desarrollo (DX) y Mantenimiento
    @app.get("/", include_in_schema=False)
    async def root_redirect() -> RedirectResponse:
        """
        Redirige automáticamente el tráfico de la raíz hacia la documentación Swagger.
        Evita el error 404 cuando un desarrollador o evaluador accede al host base.
        """
        return RedirectResponse(url="/docs")

    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon_handler() -> Response:
        """
        Intercepta la petición automática del navegador para el icono y devuelve 204 No Content.
        Mantiene los logs limpios de errores 404 irrelevantes.
        """
        return Response(status_code=204)

    @app.get("/health", tags=["Health"])
    async def health_check() -> dict[str, str]:
        """Endpoint de diagnóstico para monitoreo de disponibilidad del servidor."""
        return {"status": "ok", "environment": settings.ENVIRONMENT}

    # Registro de submódulos de rutas (Enrutamiento modular)
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(supermarket_router, prefix="/api/v1")
    app.include_router(promotion_router, prefix="/api/v1")

    return app

app = create_app()
