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

    # 2. Construir filtro SQL
    from app.services.sql_filters import construir_filtro_sql
    from app.services.duckdb_client import duckdb_client
    
    where_clause = construir_filtro_sql(filters, bairros)
    
    # Lista de arquivos como strings para o DuckDB
    arquivos_str = [str(a) for a in arquivos]
    
    # DEBUG: Logs detalhados
    print("="*80, flush=True)
    print("DEBUG /search endpoint", flush=True)
    print(f"Arquivos selecionados: {len(arquivos_str)}", flush=True)
    print(f"WHERE Clause: {where_clause}", flush=True)
    print(f"Filtros:", flush=True)
    print(f"   - apenas_celular: {filters.apenas_celular}", flush=True)
    print(f"   - filtrar_telefones_invalidos: {filters.filtrar_telefones_invalidos}", flush=True)
    print(f"   - cnaes_principais: {filters.cnaes_principais}", flush=True)
    print(f"   - limit: {limit}", flush=True)
    print("="*80, flush=True)
    
    try:
        # Executar query no DuckDB
        # A query já aplica LIMIT e filtros diretamente no motor SQL
        df_result = duckdb_client.query_files(
            file_paths=arquivos_str,
            where_clause=where_clause,
            limit=limit
        )
        
        print(f"Query executada com sucesso", flush=True)
        print(f"Linhas retornadas: {len(df_result)}", flush=True)
        if len(df_result) > 0:
            print(f"Primeiras colunas: {list(df_result.columns[:5])}", flush=True)
        print("="*80, flush=True)
        
        # Obter contagem total (opcional, pode ser pesado se não for necessário na busca paginada simples)
        # Para performance, na busca simples retornamos apenas o count da página ou fazemos uma query de count separada
        # Mas o frontend espera "total_encontrado". DuckDB é rápido, vamos tentar o count.
        # SE ficar lento, podemos remover e fazer count apenas no endpoint /count
        
        # Transformar em dict records
        resultados = df_result.to_dict('records')
        
        return {
            "total_encontrado": len(resultados), # Na busca paginada, isso é só o tamanho da página. O total real vem do /count.
            "total_lidos": -1, # DuckDB abstrai isso
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
        print(f"Erro detalhado DuckDB: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar dados com DuckDB: {str(e)}")

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

    # 2. Construir filtro SQL
    from app.services.sql_filters import construir_filtro_sql
    from app.services.duckdb_client import duckdb_client
    
    where_clause = construir_filtro_sql(filters, bairros)
    
    # Lista de arquivos como strings para o DuckDB
    arquivos_str = [str(a) for a in arquivos]

    try:
        # Executar count no DuckDB
        total_filtrado = duckdb_client.count_files(
            file_paths=arquivos_str,
            where_clause=where_clause
        )
        
        return {
            "total_encontrado": total_filtrado,
            "total_lidos": -1, 
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
        print(f"Erro detalhado DuckDB Count: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar dados com DuckDB: {str(e)}")
