from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Gestión centralizada de variables de entorno.
    Falla rápido si faltan variables críticas al iniciar el servidor.
    """
    PROJECT_NAME: str = "Buscapromo API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # Asignar un valor por defecto vacío elimina el falso positivo de Pylance.
    # El valor real será inyectado por SettingsConfigDict leyendo el archivo .env.
    MONGODB_URL: str = ""
    DATABASE_NAME: str = "buscapromo_db"
    
    # Google Cloud Platform (GCP) Config
    GCP_PROJECT_ID: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()