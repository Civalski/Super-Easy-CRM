from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
import pyarrow.parquet as pq

from app.core.config import settings
from app.services.parquet import resolver_arquivos_parquet
from app.services.filters import aplicar_filtros_padrao, filtrar_bairros_df
from app.dependencies import CommonFilters

router = APIRouter()

@router.get("/estados")
async def list_estados():
    """Lista todos os estados disponíveis"""
    DADOS_PATH = settings.PARQUET_DATA_PATH
    if not DADOS_PATH.exists():
        raise HTTPException(status_code=500, detail="Pasta de dados não encontrada")
    
    estados = sorted([
        {
            "sigla": d.name,
            "total_cidades": len(list(d.glob("*.parquet")))
        }
        for d in DADOS_PATH.iterdir() 
        if d.is_dir()
    ], key=lambda x: x["sigla"])
    
    return {
        "total": len(estados),
        "estados": estados
    }

@router.get("/cidades/{estado}")
async def list_cidades(estado: str):
    """Lista todas as cidades de um estado"""
    DADOS_PATH = settings.PARQUET_DATA_PATH
    estado_path = DADOS_PATH / estado.upper()
    
    if not estado_path.exists():
        raise HTTPException(status_code=404, detail=f"Estado {estado} não encontrado")
    
    cidades = sorted([
        {
            "nome": f.stem.replace(f"{estado.upper()} - ", ""),
            "arquivo": f.name,
            "tamanho_kb": round(f.stat().st_size / 1024, 2)
        }
        for f in estado_path.glob("*.parquet")
    ], key=lambda x: x["nome"])
    
    return {
        "estado": estado.upper(),
        "total": len(cidades),
        "cidades": cidades
    }

@router.get("/bairros")
async def list_bairros(
    estado: str = Query(..., description="Sigla do estado (ex: SP)"),
    cidade: Optional[str] = Query(None, description="Nome da cidade"),
    filters: CommonFilters = Depends()
):
    """
    Lista os bairros únicos disponíveis após aplicação dos filtros base.
    Útil para pós-filtro de bairros.
    """
    DADOS_PATH = settings.PARQUET_DATA_PATH
    
    if not DADOS_PATH.exists():
        raise HTTPException(status_code=500, detail="Pasta de dados não encontrada")
    
    estado_upper = estado.upper()
    estado_path = DADOS_PATH / estado_upper
    
    if not estado_path.exists():
        raise HTTPException(status_code=404, detail=f"Estado {estado} não encontrado")
    
    # Determinar arquivos
    if cidade:
        cidade_file = estado_path / f"{estado_upper} - {cidade.upper()}.parquet"
        if not cidade_file.exists():
            raise HTTPException(status_code=404, detail=f"Cidade {cidade} não encontrada")
        arquivos = [cidade_file]
    else:
        arquivos = list(estado_path.glob("*.parquet"))
        if not arquivos:
            raise HTTPException(status_code=404, detail="Nenhum arquivo encontrado")
    
    try:
        bairros_set = set()
        total_registros = 0
        
        for arquivo in arquivos:
            table = pq.read_table(arquivo)
            df = table.to_pandas()
            
            # Aplicar filtros base usando o service centralizado
            df = aplicar_filtros_padrao(df, filters)
            
            total_registros += len(df)
            
            # Extrair bairros únicos
            bairros_coluna = df['BAIRRO'].fillna('').str.upper().str.strip()
            # Remover vazios
            bairros_validos = bairros_coluna[bairros_coluna != '']
            bairros_set.update(bairros_validos.unique())
        
        # Ordenar alfabeticamente
        bairros_lista = sorted(list(bairros_set))
        
        return {
            "estado": estado_upper,
            "cidade": cidade,
            "total_bairros": len(bairros_lista),
            "total_registros": total_registros,
            "bairros": bairros_lista
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar bairros: {str(e)}")
