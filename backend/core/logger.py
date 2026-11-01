import logging
import sys
import structlog
from structlog.types import Processor

def setup_logging(log_level: int = logging.INFO) -> structlog.BoundLogger:
    """
    Configura el logging estructurado para la aplicación.
    En producción (GCP), estructurar en JSON facilita la ingesta de logs.
    """
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    processors: list[Processor] = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.dev.ConsoleRenderer(colors=True)
    ]

    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    return structlog.get_logger()

logger = setup_logging()