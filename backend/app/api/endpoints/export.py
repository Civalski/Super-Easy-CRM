from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
import pyarrow.parquet as pq
import pandas as pd
import io
import os
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.utils import get_column_letter


from app.core.config import settings
from app.services.parquet import resolve_location_from_filters
from app.services.filters import aplicar_filtros_padrao, filtrar_bairros_df
from app.dependencies import CommonFilters, LocationFilters

router = APIRouter()

def tratar_dataframe_para_exportacao(df: pd.DataFrame) -> pd.DataFrame:
    """
    Trata o DataFrame para exportação (CSV/Excel)
    - Cria coluna CNPJ unificando BASICO + ORDEM + DV
    - Remove colunas indesejadas (FAX, PAIS, etc)
    """
    df = df.copy()
    
    # 1. Construir CNPJ completo
    cols_cnpj = ['CNPJ BASICO', 'CNPJ ORDEM', 'CNPJ DV']
    if all(col in df.columns for col in cols_cnpj):
        # Helper interno para limpar e formatar
        def clean_col(series, width):
            return (
                series.astype(str)
                .str.replace(r'\.0$', '', regex=True)  # Remove .0 de floats
                .str.strip()
                .str.replace('nan', '0', regex=False)
                .str.replace('None', '0', regex=False)
                .str.zfill(width)
            )

        c_basico = clean_col(df['CNPJ BASICO'], 8)
        c_ordem = clean_col(df['CNPJ ORDEM'], 4)
        c_dv = clean_col(df['CNPJ DV'], 2)
        
        df['CNPJ'] = c_basico + c_ordem + c_dv
    
    # 2. Remover colunas indesejadas
    cols_remover = [
        'FAX', 'PAIS', 'CIDADE NO EXTERIOR', 
        'CNPJ BASICO', 'CNPJ ORDEM', 'CNPJ DV'
    ]
    cols_para_drop = [c for c in cols_remover if c in df.columns]
    if cols_para_drop:
        df = df.drop(columns=cols_para_drop)
        
    return df

@router.get("/export")
async def export_empresas(
    loc_filters: LocationFilters = Depends(),
    filters: CommonFilters = Depends(),
    bairros: Optional[str] = Query(None, description="Lista de bairros separados por vírgula (pós-filtro)"),
):
    """
    Exporta TODOS os leads que correspondem aos filtros em formato CSV
    Usa streaming para suportar milhões de registros
    """
    DADOS_PATH = settings.PARQUET_DATA_PATH
    if not DADOS_PATH.exists():
        raise HTTPException(status_code=500, detail="Pasta de dados não encontrada")
    
    arquivos, escopo_descricao = resolve_location_from_filters(loc_filters)
    
    if not arquivos:
        raise HTTPException(status_code=404, detail="Nenhum arquivo encontrado")

    # Gerar nome do arquivo
    filename_parts = [f"leads_{escopo_descricao}"]
    if filters.cnaes_principais:
        filename_parts.append("cnaes_multiplos")
    filename_parts.append(pd.Timestamp.now().strftime("%Y%m%d_%H%M%S"))
    filename = "_".join(filename_parts) + ".csv"

    def generate_csv():
        from app.services.sql_filters import construir_filtro_sql
        from app.services.duckdb_client import duckdb_client
        
        where_clause = construir_filtro_sql(filters, bairros)
        arquivos_str = [f"'{str(a).replace("'", "''")}'" for a in arquivos]
        files_list = ", ".join(arquivos_str)
        
        # Query base para ler parquet
        base_query = f"FROM read_parquet([{files_list}], union_by_name=True)"
        if where_clause:
            base_query += f" WHERE {where_clause}"
            
        # Select customizado para formatar CNPJ e selecionar colunas
        # CNPJ: concatenar lpad(BASICO,8,'0') || lpad(ORDEM,4,'0') || lpad(DV,2,'0')
        # Precisamos listar todas as colunas que queremos, exceto as removidas
        # Para simplificar, vamos selecionar tudo e calcular CNPJ
        
        # Montagem do CNPJ no DuckDB
        cnpj_expr = """
            lpad(CAST("CNPJ BASICO" AS VARCHAR), 8, '0') || 
            lpad(CAST("CNPJ ORDEM" AS VARCHAR), 4, '0') || 
            lpad(CAST("CNPJ DV" AS VARCHAR), 2, '0') AS CNPJ
        """
        
        # Colunas para remover da seleção final (no SELECT * EXCLUDE)
        exclude_cols = "EXCLUDE (\"CNPJ BASICO\", \"CNPJ ORDEM\", \"CNPJ DV\", FAX, PAIS, \"CIDADE NO EXTERIOR\")"
        
        full_query = f"SELECT *, {cnpj_expr} {base_query}"
        # Nota: DuckDB suporta SELECT * EXCLUDE ..., mas para simplificar e garantir compatibilidade
        # com a logica anterior que removia depois, podemos fazer isso.
        # Mas vamos fazer melhor: SELECT * EXCEPT(...) no DuckDB
        
        full_query = f"""
            SELECT * EXCLUDE ("CNPJ BASICO", "CNPJ ORDEM", "CNPJ DV", FAX, PAIS, "CIDADE NO EXTERIOR"),
            {cnpj_expr}
            {base_query}
        """
        
        try:
            # Executar query e obter cursor
            conn = duckdb_client.conn
            cursor = conn.execute(full_query)
            
            # Header
            header_written = False
            
            # Fetch em chunks para streaming
            CHUNK_SIZE = 5000
            
            while True:
                # Usar df() no chunk para aproveitar to_csv do pandas que lida bem com CSV quoting
                # fetch_df_chunk() nao existe direto, mas podemos usar fetchmany() e criar DF
                chunk_rows = cursor.fetchmany(CHUNK_SIZE)
                if not chunk_rows:
                    break
                    
                # Converter para DataFrame para usar to_csv robusto
                cols = [desc[0] for desc in cursor.description]
                chunk_df = pd.DataFrame(chunk_rows, columns=cols)
                
                # Tratar nulos como string vazia (equivalente ao tratamento anterior)
                chunk_df = chunk_df.fillna('')
                
                output = io.StringIO()
                if not header_written:
                    # Header + BOM para Excel
                    chunk_df.head(0).to_csv(output, index=False)
                    yield output.getvalue().encode('utf-8-sig')
                    header_written = True
                    # Reset buffer for data
                    output = io.StringIO()
                
                chunk_df.to_csv(output, index=False, header=False)
                yield output.getvalue().encode('utf-8')
                
        except Exception as e:
            print(f"Erro no streaming DuckDB: {e}")
            # Em streaming http, lançar erro aqui corta a conexão, o que é o comportamento esperado
            raise e

    return StreamingResponse(
        generate_csv(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        }
    )

@router.get("/export-xlsx")
async def export_empresas_xlsx(
    loc_filters: LocationFilters = Depends(),
    filters: CommonFilters = Depends(),
    bairros: Optional[str] = Query(None, description="Lista de bairros separados por vírgula (pós-filtro)"),
):
    """
    Exporta TODOS os leads que correspondem aos filtros em formato Excel (.xlsx)
    ATENÇÃO: Limitado a 50.000 linhas para garantir performance. Para maiores volumes, use CSV.
    """
    DADOS_PATH = settings.PARQUET_DATA_PATH
    if not DADOS_PATH.exists():
        raise HTTPException(status_code=500, detail="Pasta de dados não encontrada")
    
    arquivos, escopo_descricao = resolve_location_from_filters(loc_filters)
    
    if not arquivos:
        raise HTTPException(status_code=404, detail="Nenhum arquivo encontrado")

    try:
        # Limite de segurança para exportação Excel em tempo real
        EXCEL_MAX_ROWS = 50000
        
        # Coletar todos os dataframes filtrados
        all_dfs = []
        total_rows = 0
        
        for arquivo in arquivos:
            try:
                table = pq.read_table(arquivo)
                df = table.to_pandas()
                
                # Filtros
                df = aplicar_filtros_padrao(df, filters)
                
                # Bairros
                if bairros:
                    lista_bairros = [b.strip() for b in bairros.split(',') if b.strip()]
                    if lista_bairros:
                        df = filtrar_bairros_df(df, lista_bairros)
                
                count = len(df)
                if count > 0:
                    total_rows += count
                    if total_rows > EXCEL_MAX_ROWS:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"O resultado excede o limite de {EXCEL_MAX_ROWS} registros para Excel. O processo foi interrompido para evitar travamentos. Por favor, refine seus filtros ou utilize a exportação em CSV (que suporta milhões de registros)."
                        )
                    all_dfs.append(df)
                    
            except HTTPException:
                raise
            except Exception as e:
                print(f"Erro ao processar {arquivo}: {e}")
                continue
        
        # Concatenar todos os resultados
        if not all_dfs:
            raise HTTPException(status_code=404, detail="Nenhum registro encontrado com os filtros aplicados")
        
        final_df = pd.concat(all_dfs, ignore_index=True)

        # Tratar dados
        final_df = tratar_dataframe_para_exportacao(final_df)
        
        # Gerar Excel em memória
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            final_df.to_excel(writer, index=False, sheet_name='Leads')
            
            # Ajuste básico de largura fixa para performance máxima
            worksheet = writer.sheets['Leads']
            worksheet.sheet_format.defaultColWidth = 18

            # Tabela Zebra (Impacto irrelevante na performance, visual muito melhor)
            max_row = len(final_df) + 1
            max_col = len(final_df.columns)
            ref = f"A1:{get_column_letter(max_col)}{max_row}"
            
            tab = Table(displayName="TabelaLeads", ref=ref)
            style = TableStyleInfo(
                name="TableStyleMedium2", 
                showFirstColumn=False,
                showLastColumn=False, 
                showRowStripes=True, 
                showColumnStripes=False
            )
            tab.tableStyleInfo = style
            worksheet.add_table(tab)

        output.seek(0)
        
        # Gerar nome do arquivo
        filename_parts = [f"leads_{escopo_descricao}"]
        if filters.cnaes_principais:
            filename_parts.append("cnaes_multiplos")
        filename_parts.append(pd.Timestamp.now().strftime("%Y%m%d_%H%M%S"))
        filename = "_".join(filename_parts) + ".xlsx"
        
        return StreamingResponse(
            io.BytesIO(output.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Cache-Control": "no-cache",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar arquivo Excel: {str(e)}")
