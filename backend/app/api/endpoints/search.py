from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
import pyarrow.parquet as pq

from app.core.config import settings
from app.services.parquet import resolve_location_from_filters
from app.services.filters import aplicar_filtros_padrao, filtrar_bairros_df
from app.dependencies import CommonFilters, LocationFilters

router = APIRouter()

@router.get("/search")
async def search_empresas(
    loc_filters: LocationFilters = Depends(),
    filters: CommonFilters = Depends(),
    bairros: Optional[str] = Query(None, description="Lista de bairros separados por vírgula (pós-filtro)"),
    limit: int = Query(100, ge=1, le=1000, description="Limite de resultados")
):
    """
    Busca empresas com filtros avançados de CNAE
    NOVO: Suporta seleção de múltiplas cidades, múltiplos estados ou Brasil inteiro.
    """
    DADOS_PATH = settings.PARQUET_DATA_PATH
    if not DADOS_PATH.exists():
        raise HTTPException(status_code=500, detail="Pasta de dados não encontrada")
    
    # 1. Resolver Arquivos
    arquivos, escopo_descricao = resolve_location_from_filters(loc_filters)
    
    if not arquivos:
        raise HTTPException(status_code=404, detail="Nenhum arquivo .parquet encontrado com os parâmetros informados")

    # Inicializar estado_upper se não foi definido no bloco de estado único
    estado_upper = loc_filters.estado.upper() if loc_filters.estado else None

    try:
        resultados = []
        total_lidos = 0
        
        for arquivo in arquivos:
            # Ler arquivo
            table = pq.read_table(arquivo)
            df = table.to_pandas()
            total_lidos += len(df)
            
            # Aplicar filtros padrao
            df = aplicar_filtros_padrao(df, filters)
            
            # Pós-filtro de bairros
            if bairros:
                lista_bairros = [b.strip() for b in bairros.split(',') if b.strip()]
                if lista_bairros:
                    df = filtrar_bairros_df(df, lista_bairros)
            
            # Adicionar aos resultados
            if len(df) > 0:
                resultados.extend(df.to_dict('records'))
            
            # Parar se já atingiu o limite
            if len(resultados) >= limit:
                break
        
        # Limitar resultados
        resultados = resultados[:limit]
        
        # Construir resposta
        return {
            "total_encontrado": len(resultados),
            "total_lidos": total_lidos,
            "filtros": {
                "brasil_inteiro": loc_filters.brasil_inteiro,
                "estados": loc_filters.estados,
                "cidades": loc_filters.cidades,
                "estado_param": loc_filters.estado,
                "estado": estado_upper,
                "cidade": loc_filters.cidade,
                **filters.__dict__
            },
            "resultados": resultados
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar dados: {str(e)}")

@router.get("/count")
async def count_empresas(
    loc_filters: LocationFilters = Depends(),
    filters: CommonFilters = Depends(),
    bairros: Optional[str] = Query(None, description="Lista de bairros separados por vírgula (pós-filtro)"),
):
    """
    Conta o total de empresas que correspondem aos filtros (sem limite)
    """
    DADOS_PATH = settings.PARQUET_DATA_PATH
    if not DADOS_PATH.exists():
        raise HTTPException(status_code=500, detail="Pasta de dados não encontrada")
    
    # 1. Resolver Arquivos
    arquivos, escopo_descricao = resolve_location_from_filters(loc_filters)
    
    if not arquivos:
        raise HTTPException(status_code=404, detail="Nenhum arquivo encontrado")

    estado_upper = loc_filters.estado.upper() if loc_filters.estado else None

    try:
        total_filtrado = 0
        total_lidos = 0
        
        for arquivo in arquivos:
            table = pq.read_table(arquivo)
            df = table.to_pandas()
            total_lidos += len(df)
            
            # Aplicar filtros padrao
            df = aplicar_filtros_padrao(df, filters)
            
            # Pós-filtro de bairros
            if bairros:
                lista_bairros = [b.strip() for b in bairros.split(',') if b.strip()]
                if lista_bairros:
                    df = filtrar_bairros_df(df, lista_bairros)
            
            total_filtrado += len(df)
        
        return {
            "total_encontrado": total_filtrado,
            "total_lidos": total_lidos,
            "filtros": {
                "brasil_inteiro": loc_filters.brasil_inteiro,
                "estados": loc_filters.estados,
                "cidades": loc_filters.cidades,
                "estado_param": loc_filters.estado,
                "estado": estado_upper,
                "cidade": loc_filters.cidade,
                **filters.__dict__
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar dados: {str(e)}")
