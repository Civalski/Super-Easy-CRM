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
    cnae_secundario: Optional[str] = Query(None, description="Código CNAE secundário"),
    exigir_secundario: bool = Query(False, description="Exigir que tenha CNAE secundário"),
    qualquer_secundario: bool = Query(False, description="Aceitar qualquer CNAE secundário (não vazio)"),
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
            
            if exigir_secundario:
                if qualquer_secundario:
                    # Exigir que tenha QUALQUER CNAE secundário (não vazio)
                    df = df[df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.len() > 0]
                elif cnae_secundario:
                    # Exigir CNAE secundário específico
                    df = df[df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.contains(str(cnae_secundario), regex=False)]
            elif cnae_secundario:
                # Buscar apenas por CNAE secundário (sem exigir principal)
                df = df[df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.contains(str(cnae_secundario), regex=False)]
            
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
                "cnae_secundario": cnae_secundario,
                "exigir_secundario": exigir_secundario,
                "qualquer_secundario": qualquer_secundario,
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
