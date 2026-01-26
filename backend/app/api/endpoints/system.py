from fastapi import APIRouter, HTTPException
from app.core.config import settings
import os
import subprocess
import platform

router = APIRouter()

@router.get("/data-status")
def get_data_status():
    """
    Verifica o status da pasta de dados e lista os arquivos encontrados.
    """
    path = settings.PARQUET_DATA_PATH
    exists = path.exists()
    files = []
    
    if exists:
        # Listar arquivos .parquet para identificar estados/módulos instalados
        try:
            files = [f.name for f in path.glob("*.parquet")]
        except Exception as e:
            print(f"Erro ao listar arquivos: {e}")

    return {
        "path": str(path),
        "exists": exists,
        "files_count": len(files),
        "files": files,
        "message": "Dados encontrados" if exists and len(files) > 0 else "Nenhum dado encontrado"
    }

@router.post("/open-data-folder")
def open_data_folder():
    """
    Abre a pasta de dados no explorador de arquivos do sistema operacional.
    """
    path = settings.PARQUET_DATA_PATH
    
    # Criar pasta se não existir
    if not path.exists():
        try:
            path.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao criar pasta: {str(e)}")

    try:
        if platform.system() == "Windows":
            os.startfile(path)
        elif platform.system() == "Darwin":  # macOS
            subprocess.Popen(["open", str(path)])
        else:  # Linux
            subprocess.Popen(["xdg-open", str(path)])
        return {"success": True, "message": "Pasta aberta com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao abrir pasta: {str(e)}")
