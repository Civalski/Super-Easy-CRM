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

    def generate_csv():
        """Generator que produz CSV linha por linha para streaming"""
        header_written = False
        
        for arquivo in arquivos:
            try:
                table = pq.read_table(arquivo)
                df = table.to_pandas()
                
                # Filters
                df = aplicar_filtros_padrao(df, filters)
                
                # Bairros
                if bairros:
                    lista_bairros = [b.strip() for b in bairros.split(',') if b.strip()]
                    if lista_bairros:
                        df = filtrar_bairros_df(df, lista_bairros)
                
                if len(df) == 0:
                    continue
                
                # Tratar dados
                df = tratar_dataframe_para_exportacao(df)
                
                # Escrever header apenas uma vez
                if not header_written:
                    output = io.StringIO()
                    df.head(0).to_csv(output, index=False)
                    yield output.getvalue().encode('utf-8-sig')  # BOM para Excel
                    header_written = True
                
                # Escrever dados em chunks
                chunk_size = 1000
                for i in range(0, len(df), chunk_size):
                    chunk = df.iloc[i:i+chunk_size]
                    output = io.StringIO()
                    chunk.to_csv(output, index=False, header=False)
                    yield output.getvalue().encode('utf-8')
                    
            except Exception as e:
                print(f"Erro ao processar {arquivo}: {e}")
                continue
    
    # Gerar nome do arquivo
    filename_parts = [f"leads_{escopo_descricao}"]
    if filters.cnaes_principais:
        filename_parts.append("cnaes_multiplos")
    filename_parts.append(pd.Timestamp.now().strftime("%Y%m%d_%H%M%S"))
    filename = "_".join(filename_parts) + ".csv"

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
