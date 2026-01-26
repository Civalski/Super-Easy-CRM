import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Any

class Settings(BaseSettings):
    PROJECT_NAME: str = "Arker CRM - Parquet API"
    VERSION: str = "1.0.0"
    
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    
    # Lógica de caminho dos dados (Prioridade: ENV > APPDATA > LOCAL)
    @property
    def PARQUET_DATA_PATH(self) -> Path:
        # 1. Variável de ambiente explícita
        if os.getenv("ARKER_DATA_PATH"):
            return Path(os.getenv("ARKER_DATA_PATH"))
            
        # 2. Pasta no APPDATA (Produção)
        # Windows: C:/Users/User/AppData/Roaming/ArkerCRM/Dados
        app_data = os.getenv("APPDATA")
        if app_data:
            prod_path = Path(app_data) / "ArkerCRM" / "Dados"
            if prod_path.exists():
                return prod_path

        # 3. Fallback: Desenvolvimento (local)
        return self.BASE_DIR.parent / "data" / "parquet"

    CORS_ORIGINS: List[str] | str = [
        "http://localhost:3000",
        "http://localhost:5000",
        "*", # Permitir acesso do Electron App
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
