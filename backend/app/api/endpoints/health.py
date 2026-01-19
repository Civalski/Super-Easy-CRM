from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/")
async def root():
    """Endpoint de status da API"""
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@router.get("/health")
async def health_check():
    """Verifica se a API e os dados estão acessíveis"""
    DADOS_PATH = settings.PARQUET_DATA_PATH
    dados_exists = DADOS_PATH.exists()
    
    if not dados_exists:
        return {
            "status": "error",
            "message": f"Pasta de dados não encontrada: {DADOS_PATH}",
            "dados_path": str(DADOS_PATH)
        }
    
    # Contar estados e arquivos
    estados = [d for d in DADOS_PATH.iterdir() if d.is_dir()]
    total_estados = len(estados)
    
    # Contar arquivos .parquet (sample dos primeiros 3 estados para ser rápido)
    sample_files = 0
    for estado in estados[:3]:
        sample_files += len(list(estado.glob("*.parquet")))
    
    return {
        "status": "healthy",
        "dados_path": str(DADOS_PATH),
        "total_estados": total_estados,
        "sample_parquet_files": sample_files
    }
