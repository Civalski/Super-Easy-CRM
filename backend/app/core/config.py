import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Any

class Settings(BaseSettings):
    PROJECT_NAME: str = "Arker CRM - Parquet API"
    VERSION: str = "1.0.0"
    
    # Base paths
    # file is in backend/app/core/config.py -> parent.parent.parent is backend/
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    
    # Data path defaulting to ../data/parquet relative to project root
    # If backend is in d:\Projetos\Arker CRM\backend
    # Then data is in d:\Projetos\Arker CRM\data\parquet
    PARQUET_DATA_PATH: Path = BASE_DIR.parent / "data" / "parquet"

    CORS_ORIGINS: List[str] | str = [
        "http://localhost:3000",
        "http://localhost:5000",
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

    @property
    def check_data_exists(self) -> bool:
        return self.PARQUET_DATA_PATH.exists()

    PORT: int = 5000

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
