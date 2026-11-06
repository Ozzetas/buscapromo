from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Centralizo la gestión de variables de entorno de la aplicación.
    Incluyo parámetros criptográficos para la emisión de tokens JWT.
    """
    PROJECT_NAME: str = "Buscapromo API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    MONGODB_URL: str = ""
    DATABASE_NAME: str = "buscapromo_db"
    
    # Configuración criptográfica JWT (puede sobreescribirse desde el archivo .env)
    JWT_SECRET_KEY: str = "buscapromo_clave_secreta_desarrollo_utn_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    GCP_PROJECT_ID: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()