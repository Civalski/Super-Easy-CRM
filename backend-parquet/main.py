"""
Backend FastAPI para filtrar dados de empresas dos arquivos .parquet
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import pyarrow.parquet as pq
import pandas as pd
from pathlib import Path
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

app = FastAPI(
    title="Arker CRM - Parquet API",
    description="API para filtrar dados de empresas dos arquivos .parquet",
    version="1.0.0"
)

# Configurar CORS para Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração de caminhos
DADOS_PATH = Path(__file__).parent / os.getenv("PARQUET_DATA_PATH", "../Dados")

@app.get("/")
async def root():
    """Endpoint de status da API"""
    return {
        "status": "online",
        "service": "Arker CRM Parquet API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Verifica se a API e os dados estão acessíveis"""
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

@app.get("/estados")
async def list_estados():
    """Lista todos os estados disponíveis"""
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

@app.get("/cidades/{estado}")
async def list_cidades(estado: str):
    """Lista todas as cidades de um estado"""
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

@app.get("/search")
async def search_empresas(
    estado: Optional[str] = Query(None, description="Sigla do estado (ex: SP)"),
    cidade: Optional[str] = Query(None, description="Nome da cidade"),
    cnae_principal: Optional[str] = Query(None, description="Código CNAE principal"),
    cnaes_secundarios: Optional[str] = Query(None, description="Lista de códigos CNAE secundários separados por vírgula"),
    exigir_todos_secundarios: bool = Query(False, description="Exigir TODOS os CNAEs secundários (True) ou QUALQUER UM (False)"),
    situacao: Optional[str] = Query(None, description="Situação cadastral (ex: ATIVA)"),
    porte: Optional[str] = Query(None, description="Porte da empresa"),
    limit: int = Query(100, ge=1, le=1000, description="Limite de resultados")
):
    """
    Busca empresas com filtros avançados de CNAE
    
    Exemplos:
    - /search?estado=SP&cidade=ADAMANTINA
    - /search?estado=SP&cnae_principal=4399103
    - /search?estado=SP&cnae_principal=4399103&cnae_secundario=4322301
    - /search?estado=SP&cnae_principal=4399103&exigir_secundario=true&qualquer_secundario=true
    - /search?estado=SP&cnae_secundario=4322301
    """
    
    if not DADOS_PATH.exists():
        raise HTTPException(status_code=500, detail="Pasta de dados não encontrada")
    
    # Validar que pelo menos estado foi fornecido
    if not estado:
        raise HTTPException(
            status_code=400, 
            detail="Parâmetro 'estado' é obrigatório"
        )
    
    estado_upper = estado.upper()
    estado_path = DADOS_PATH / estado_upper
    
    if not estado_path.exists():
        raise HTTPException(status_code=404, detail=f"Estado {estado} não encontrado")
    
    # Determinar quais arquivos ler
    if cidade:
        # Ler apenas arquivo da cidade específica
        cidade_file = estado_path / f"{estado_upper} - {cidade.upper()}.parquet"
        if not cidade_file.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Cidade {cidade} não encontrada no estado {estado}"
            )
        arquivos = [cidade_file]
    else:
        # Ler todas as cidades do estado (ATENÇÃO: pode ser lento)
        arquivos = list(estado_path.glob("*.parquet"))
        if not arquivos:
            raise HTTPException(
                status_code=404, 
                detail=f"Nenhum arquivo .parquet encontrado para o estado {estado}"
            )
    
    # Ler e filtrar dados
    try:
        resultados = []
        total_lidos = 0
        
        for arquivo in arquivos:
            # Ler arquivo
            table = pq.read_table(arquivo)
            df = table.to_pandas()
            total_lidos += len(df)
            
            # Aplicar filtros de CNAE
            if cnae_principal:
                # Filtro por CNAE principal
                df = df[df['COD ATIVIDADE PRINCIPAL'] == str(cnae_principal)]
            
            # Filtro de CNAEs Secundários
            if cnaes_secundarios:
                # Parse da lista de CNAEs (vem como string separada por vírgula)
                lista_cnaes = [cnae.strip() for cnae in cnaes_secundarios.split(',') if cnae.strip()]
                
                if lista_cnaes:  # Se há CNAEs selecionados
                    if exigir_todos_secundarios:
                        # TODOS os CNAEs devem estar presentes (AND lógico)
                        for cnae in lista_cnaes:
                            df = df[df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.contains(str(cnae), regex=False)]
                    else:
                        # QUALQUER UM dos CNAEs deve estar presente (OR lógico)
                        mask = pd.Series([False] * len(df), index=df.index)
                        for cnae in lista_cnaes:
                            mask |= df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.contains(str(cnae), regex=False)
                        df = df[mask]
            # Se não há CNAEs secundários selecionados, aceita todos (sem filtro)
            
            if situacao:
                df = df[df['SITUAÇÃO CADASTRAL'] == situacao.upper()]
            
            if porte:
                df = df[df['PORTE DA EMPRESA'] == porte.upper()]
            
            # Adicionar aos resultados
            if len(df) > 0:
                resultados.extend(df.to_dict('records'))
            
            # Parar se já atingiu o limite
            if len(resultados) >= limit:
                break
        
        # Limitar resultados
        resultados = resultados[:limit]
        
        return {
            "total_encontrado": len(resultados),
            "total_lidos": total_lidos,
            "filtros": {
                "estado": estado_upper,
                "cidade": cidade,
                "cnae_principal": cnae_principal,
                "cnaes_secundarios": cnaes_secundarios,
                "exigir_todos_secundarios": exigir_todos_secundarios,
                "situacao": situacao,
                "porte": porte
            },
            "resultados": resultados
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao processar dados: {str(e)}"
        )

@app.get("/count")
async def count_empresas(
    estado: Optional[str] = Query(None, description="Sigla do estado (ex: SP)"),
    cidade: Optional[str] = Query(None, description="Nome da cidade"),
    cnae_principal: Optional[str] = Query(None, description="Código CNAE principal"),
    cnaes_secundarios: Optional[str] = Query(None, description="Lista de códigos CNAE secundários separados por vírgula"),
    exigir_todos_secundarios: bool = Query(False, description="Exigir TODOS os CNAEs secundários (True) ou QUALQUER UM (False)"),
    situacao: Optional[str] = Query(None, description="Situação cadastral (ex: ATIVA)"),
    porte: Optional[str] = Query(None, description="Porte da empresa"),
):
    """
    Conta o total de empresas que correspondem aos filtros (sem limite)
    Útil para saber o tamanho real do resultado antes de exportar
    """
    
    if not DADOS_PATH.exists():
        raise HTTPException(status_code=500, detail="Pasta de dados não encontrada")
    
    if not estado:
        raise HTTPException(
            status_code=400, 
            detail="Parâmetro 'estado' é obrigatório"
        )
    
    estado_upper = estado.upper()
    estado_path = DADOS_PATH / estado_upper
    
    if not estado_path.exists():
        raise HTTPException(status_code=404, detail=f"Estado {estado} não encontrado")
    
    # Determinar quais arquivos ler
    if cidade:
        cidade_file = estado_path / f"{estado_upper} - {cidade.upper()}.parquet"
        if not cidade_file.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Cidade {cidade} não encontrada no estado {estado}"
            )
        arquivos = [cidade_file]
    else:
        arquivos = list(estado_path.glob("*.parquet"))
        if not arquivos:
            raise HTTPException(
                status_code=404, 
                detail=f"Nenhum arquivo .parquet encontrado para o estado {estado}"
            )
    
    try:
        total_filtrado = 0
        total_lidos = 0
        
        for arquivo in arquivos:
            table = pq.read_table(arquivo)
            df = table.to_pandas()
            total_lidos += len(df)
            
            # Aplicar filtros
            if cnae_principal:
                df = df[df['COD ATIVIDADE PRINCIPAL'] == str(cnae_principal)]
            
            if cnaes_secundarios:
                lista_cnaes = [cnae.strip() for cnae in cnaes_secundarios.split(',') if cnae.strip()]
                if lista_cnaes:
                    if exigir_todos_secundarios:
                        for cnae in lista_cnaes:
                            df = df[df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.contains(str(cnae), regex=False)]
                    else:
                        mask = pd.Series([False] * len(df), index=df.index)
                        for cnae in lista_cnaes:
                            mask |= df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.contains(str(cnae), regex=False)
                        df = df[mask]
            
            if situacao:
                df = df[df['SITUAÇÃO CADASTRAL'] == situacao.upper()]
            
            if porte:
                df = df[df['PORTE DA EMPRESA'] == porte.upper()]
            
            total_filtrado += len(df)
        
        return {
            "total_encontrado": total_filtrado,
            "total_lidos": total_lidos,
            "filtros": {
                "estado": estado_upper,
                "cidade": cidade,
                "cnae_principal": cnae_principal,
                "cnaes_secundarios": cnaes_secundarios,
                "exigir_todos_secundarios": exigir_todos_secundarios,
                "situacao": situacao,
                "porte": porte
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao processar dados: {str(e)}"
        )


from fastapi.responses import StreamingResponse
import io

@app.get("/export")
async def export_empresas(
    estado: Optional[str] = Query(None, description="Sigla do estado (ex: SP)"),
    cidade: Optional[str] = Query(None, description="Nome da cidade"),
    cnae_principal: Optional[str] = Query(None, description="Código CNAE principal"),
    cnaes_secundarios: Optional[str] = Query(None, description="Lista de códigos CNAE secundários separados por vírgula"),
    exigir_todos_secundarios: bool = Query(False, description="Exigir TODOS os CNAEs secundários (True) ou QUALQUER UM (False)"),
    situacao: Optional[str] = Query(None, description="Situação cadastral (ex: ATIVA)"),
    porte: Optional[str] = Query(None, description="Porte da empresa"),
):
    """
    Exporta TODOS os leads que correspondem aos filtros em formato CSV
    Usa streaming para suportar milhões de registros
    """
    
    if not DADOS_PATH.exists():
        raise HTTPException(status_code=500, detail="Pasta de dados não encontrada")
    
    if not estado:
        raise HTTPException(
            status_code=400, 
            detail="Parâmetro 'estado' é obrigatório"
        )
    
    estado_upper = estado.upper()
    estado_path = DADOS_PATH / estado_upper
    
    if not estado_path.exists():
        raise HTTPException(status_code=404, detail=f"Estado {estado} não encontrado")
    
    # Determinar quais arquivos ler
    if cidade:
        cidade_file = estado_path / f"{estado_upper} - {cidade.upper()}.parquet"
        if not cidade_file.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Cidade {cidade} não encontrada no estado {estado}"
            )
        arquivos = [cidade_file]
    else:
        arquivos = list(estado_path.glob("*.parquet"))
        if not arquivos:
            raise HTTPException(
                status_code=404, 
                detail=f"Nenhum arquivo .parquet encontrado para o estado {estado}"
            )

    def generate_csv():
        """Generator que produz CSV linha por linha para streaming"""
        header_written = False
        
        for arquivo in arquivos:
            try:
                table = pq.read_table(arquivo)
                df = table.to_pandas()
                
                # Aplicar filtros
                if cnae_principal:
                    df = df[df['COD ATIVIDADE PRINCIPAL'] == str(cnae_principal)]
                
                if cnaes_secundarios:
                    lista_cnaes = [cnae.strip() for cnae in cnaes_secundarios.split(',') if cnae.strip()]
                    if lista_cnaes:
                        if exigir_todos_secundarios:
                            for cnae in lista_cnaes:
                                df = df[df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.contains(str(cnae), regex=False)]
                        else:
                            mask = pd.Series([False] * len(df), index=df.index)
                            for cnae in lista_cnaes:
                                mask |= df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.contains(str(cnae), regex=False)
                            df = df[mask]
                
                if situacao:
                    df = df[df['SITUAÇÃO CADASTRAL'] == situacao.upper()]
                
                if porte:
                    df = df[df['PORTE DA EMPRESA'] == porte.upper()]
                
                if len(df) == 0:
                    continue
                
                # Escrever header apenas uma vez
                if not header_written:
                    output = io.StringIO()
                    df.head(0).to_csv(output, index=False)
                    yield output.getvalue().encode('utf-8-sig')  # BOM para Excel
                    header_written = True
                
                # Escrever dados em chunks para evitar uso excessivo de memória
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
    filename_parts = [f"leads_{estado_upper}"]
    if cidade:
        filename_parts.append(cidade.upper().replace(' ', '_'))
    if cnae_principal:
        filename_parts.append(f"cnae_{cnae_principal}")
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


@app.get("/export-xlsx")
async def export_empresas_xlsx(
    estado: Optional[str] = Query(None, description="Sigla do estado (ex: SP)"),
    cidade: Optional[str] = Query(None, description="Nome da cidade"),
    cnae_principal: Optional[str] = Query(None, description="Código CNAE principal"),
    cnaes_secundarios: Optional[str] = Query(None, description="Lista de códigos CNAE secundários separados por vírgula"),
    exigir_todos_secundarios: bool = Query(False, description="Exigir TODOS os CNAEs secundários (True) ou QUALQUER UM (False)"),
    situacao: Optional[str] = Query(None, description="Situação cadastral (ex: ATIVA)"),
    porte: Optional[str] = Query(None, description="Porte da empresa"),
):
    """
    Exporta TODOS os leads que correspondem aos filtros em formato Excel (.xlsx)
    """
    
    if not DADOS_PATH.exists():
        raise HTTPException(status_code=500, detail="Pasta de dados não encontrada")
    
    if not estado:
        raise HTTPException(
            status_code=400, 
            detail="Parâmetro 'estado' é obrigatório"
        )
    
    estado_upper = estado.upper()
    estado_path = DADOS_PATH / estado_upper
    
    if not estado_path.exists():
        raise HTTPException(status_code=404, detail=f"Estado {estado} não encontrado")
    
    # Determinar quais arquivos ler
    if cidade:
        cidade_file = estado_path / f"{estado_upper} - {cidade.upper()}.parquet"
        if not cidade_file.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Cidade {cidade} não encontrada no estado {estado}"
            )
        arquivos = [cidade_file]
    else:
        arquivos = list(estado_path.glob("*.parquet"))
        if not arquivos:
            raise HTTPException(
                status_code=404, 
                detail=f"Nenhum arquivo .parquet encontrado para o estado {estado}"
            )

    try:
        # Coletar todos os dataframes filtrados
        all_dfs = []
        
        for arquivo in arquivos:
            try:
                table = pq.read_table(arquivo)
                df = table.to_pandas()
                
                # Aplicar filtros
                if cnae_principal:
                    df = df[df['COD ATIVIDADE PRINCIPAL'] == str(cnae_principal)]
                
                if cnaes_secundarios:
                    lista_cnaes = [cnae.strip() for cnae in cnaes_secundarios.split(',') if cnae.strip()]
                    if lista_cnaes:
                        if exigir_todos_secundarios:
                            for cnae in lista_cnaes:
                                df = df[df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.contains(str(cnae), regex=False)]
                        else:
                            mask = pd.Series([False] * len(df), index=df.index)
                            for cnae in lista_cnaes:
                                mask |= df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.contains(str(cnae), regex=False)
                            df = df[mask]
                
                if situacao:
                    df = df[df['SITUAÇÃO CADASTRAL'] == situacao.upper()]
                
                if porte:
                    df = df[df['PORTE DA EMPRESA'] == porte.upper()]
                
                if len(df) > 0:
                    all_dfs.append(df)
                    
            except Exception as e:
                print(f"Erro ao processar {arquivo}: {e}")
                continue
        
        # Concatenar todos os resultados
        if not all_dfs:
            raise HTTPException(status_code=404, detail="Nenhum registro encontrado com os filtros aplicados")
        
        final_df = pd.concat(all_dfs, ignore_index=True)
        
        # Gerar Excel em memória
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            final_df.to_excel(writer, index=False, sheet_name='Leads')
        output.seek(0)
        
        # Gerar nome do arquivo
        filename_parts = [f"leads_{estado_upper}"]
        if cidade:
            filename_parts.append(cidade.upper().replace(' ', '_'))
        if cnae_principal:
            filename_parts.append(f"cnae_{cnae_principal}")
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
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao gerar arquivo Excel: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
