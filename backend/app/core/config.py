import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Any

class Settings(BaseSettings):
    PROJECT_NAME: str = "Arker CRM - API"
    VERSION: str = "1.0.0"
    
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    CORS_ORIGINS: List[str] | str = [
        "http://localhost:3000",
        "http://localhost:5000",
        "*",  # Permitir todos os origins
    ]

    @field_validator("CORS_ORIGINS")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            if v.startswith("["):
                import json
                return json.loads(v)
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        raise ValueError(v)

    PORT: int = 5000

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
