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
import re
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

# ====== Funções auxiliares para validação de telefone ======

def is_telefone_valido(telefone: str) -> bool:
    """
    Verifica se um telefone é válido (não é ruído).
    
    Telefones inválidos:
    - Vazios ou None
    - Apenas dígitos repetidos (00000000, 11111111, 99999999, etc.)
    - Muito curtos (menos de 8 dígitos)
    - Sequências óbvias (12345678, 87654321)
    - Começam com muitos zeros (0000xxxx)
    """
    if not telefone or pd.isna(telefone):
        return False
    
    # Converter para string e limpar
    tel = str(telefone).strip()
    
    # Remover caracteres não numéricos para análise
    apenas_digitos = re.sub(r'\D', '', tel)
    
    # Vazio após limpeza
    if not apenas_digitos:
        return False
    
    # Muito curto (menos de 8 dígitos)
    if len(apenas_digitos) < 8:
        return False
    
    # Todos os dígitos são iguais (00000000, 11111111, 99999999, etc.)
    if len(set(apenas_digitos)) == 1:
        return False
    
    # Padrões inválidos comuns
    padroes_invalidos = [
        '12345678', '87654321',  # Sequências
        '00000000', '11111111', '22222222', '33333333', '44444444',
        '55555555', '66666666', '77777777', '88888888', '99999999',
        '123456789', '987654321',
        '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
        '5555555555', '6666666666', '7777777777', '8888888888', '9999999999',
    ]
    
    if apenas_digitos in padroes_invalidos:
        return False
    
    # Começa com muitos zeros (mais de 4)
    if apenas_digitos.startswith('00000'):
        return False
    
    # Padrão de apenas 2 dígitos alternados (ex: 12121212, 98989898)
    if len(apenas_digitos) >= 8:
        primeiro = apenas_digitos[0]
        segundo = apenas_digitos[1] if len(apenas_digitos) > 1 else primeiro
        padrao_alternado = (primeiro + segundo) * (len(apenas_digitos) // 2)
        if apenas_digitos.startswith(padrao_alternado[:len(apenas_digitos)]):
            return False
    
    return True

def filtrar_telefones_invalidos_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Filtra um DataFrame para manter apenas registros com pelo menos um telefone válido.
    Considera TELEFONE 1 e TELEFONE 2.
    """
    # Verificar se pelo menos um telefone é válido
    mask_tel1 = df['TELEFONE 1'].apply(is_telefone_valido)
    mask_tel2 = df['TELEFONE 2'].apply(is_telefone_valido)
    
    # Manter registros onde pelo menos um telefone é válido
    return df[mask_tel1 | mask_tel2]

def corrigir_nono_digito(telefone: str) -> str:
    """
    Adiciona o 9º dígito em números de celular que estão no formato antigo.
    
    Regras de telefonia brasileira:
    - Celulares: após o DDD, começam com 6, 7, 8 ou 9
    - Fixos: após o DDD, começam com 2, 3, 4 ou 5
    
    Formatos esperados:
    - Com DDD (10 dígitos): XX XXXX-XXXX (antigo celular ou fixo)
    - Com DDD (11 dígitos): XX 9XXXX-XXXX (celular atual)
    - Sem DDD (8 dígitos): XXXX-XXXX (antigo celular ou fixo)
    - Sem DDD (9 dígitos): 9XXXX-XXXX (celular atual)
    """
    if not telefone or pd.isna(telefone):
        return telefone
    
    # Converter para string e extrair apenas dígitos
    tel_str = str(telefone).strip()
    apenas_digitos = re.sub(r'\D', '', tel_str)
    
    if not apenas_digitos:
        return telefone
    
    tamanho = len(apenas_digitos)
    
    # Caso 1: Número com DDD (10 dígitos) - pode ser celular antigo
    if tamanho == 10:
        ddd = apenas_digitos[:2]
        numero = apenas_digitos[2:]  # 8 dígitos
        primeiro_digito = numero[0]
        
        # Se começa com 6, 7, 8 ou 9, é celular e precisa do 9
        if primeiro_digito in ['6', '7', '8', '9']:
            return f"{ddd}9{numero}"
        # Se começa com 2, 3, 4, 5 é fixo, não mexe
        return apenas_digitos
    
    # Caso 2: Número sem DDD (8 dígitos) - pode ser celular antigo
    if tamanho == 8:
        primeiro_digito = apenas_digitos[0]
        
        # Se começa com 6, 7, 8 ou 9, é celular e precisa do 9
        if primeiro_digito in ['6', '7', '8', '9']:
            return f"9{apenas_digitos}"
        # Se começa com 2, 3, 4, 5 é fixo, não mexe
        return apenas_digitos
    
    # Outros casos (já tem 11 dígitos ou formato não reconhecido): não mexe
    return apenas_digitos

def aplicar_nono_digito_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aplica a correção do 9º dígito em todas as colunas de telefone do DataFrame.
    """
    df = df.copy()
    df['TELEFONE 1'] = df['TELEFONE 1'].apply(corrigir_nono_digito)
    df['TELEFONE 2'] = df['TELEFONE 2'].apply(corrigir_nono_digito)
    return df

def is_celular(telefone: str) -> bool:
    """
    Verifica se um número é celular (começa com 6, 7, 8 ou 9).
    Aceita com ou sem DDD, com 8, 9, 10 ou 11 dígitos.
    """
    if not telefone or pd.isna(telefone):
        return False
        
    tel_str = str(telefone).strip()
    apenas_digitos = re.sub(r'\D', '', tel_str)
    
    if not apenas_digitos:
        return False
        
    tamanho = len(apenas_digitos)
    
    # Com DDD (10 ou 11 dígitos)
    if tamanho in [10, 11]:
        # Pula os 2 do DDD e pega o primeiro do número
        primeiro_digito = apenas_digitos[2]
        return primeiro_digito in ['6', '7', '8', '9']
        
    # Sem DDD (8 ou 9 dígitos)
    if tamanho in [8, 9]:
        primeiro_digito = apenas_digitos[0]
        return primeiro_digito in ['6', '7', '8', '9']
        
    return False

def filtrar_apenas_celular_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Mantém apenas registros onde pelo menos um dos telefones é celular.
    """
    mask_tel1 = df['TELEFONE 1'].apply(is_celular)
    mask_tel2 = df['TELEFONE 2'].apply(is_celular)
    return df[mask_tel1 | mask_tel2]

def parse_capital_social(valor: str) -> float:
    """
    Converte valor de capital social de string para float.
    Formatos aceitos: "17000,00", "17000.00", "17000", etc.
    """
    if not valor or pd.isna(valor):
        return 0.0
    
    try:
        # Converter para string e limpar
        valor_str = str(valor).strip()
        
        if not valor_str:
            return 0.0
        
        # Remover pontos de milhar e substituir vírgula por ponto
        # Formato brasileiro: 1.000.000,00 -> 1000000.00
        valor_str = valor_str.replace('.', '').replace(',', '.')
        
        return float(valor_str)
    except (ValueError, TypeError):
        return 0.0

def filtrar_capital_social_df(df: pd.DataFrame, capital_min: float = None, capital_max: float = None) -> pd.DataFrame:
    """
    Filtra o DataFrame por faixa de capital social.
    
    Args:
        df: DataFrame com a coluna 'CAPITAL SOCIAL'
        capital_min: Valor mínimo de capital (inclusive)
        capital_max: Valor máximo de capital (inclusive)
    
    Returns:
        DataFrame filtrado
    """
    if capital_min is None and capital_max is None:
        return df
    
    # Converter coluna CAPITAL SOCIAL para valores numéricos
    df = df.copy()
    capital_numerico = df['CAPITAL SOCIAL'].apply(parse_capital_social)
    
    mask = pd.Series([True] * len(df), index=df.index)
    
    if capital_min is not None:
        mask &= capital_numerico >= capital_min
    
    if capital_max is not None:
        mask &= capital_numerico <= capital_max
    
    return df[mask]

def parse_data_inicio(valor: str) -> tuple:
    """
    Extrai ano e mês de uma data no formato YYYYMMDD.
    Retorna (ano, mes) ou (None, None) se inválido.
    """
    if not valor or pd.isna(valor):
        return (None, None)
    
    try:
        valor_str = str(valor).strip()
        
        if len(valor_str) < 6:
            return (None, None)
        
        # Formato: YYYYMMDD (ex: 20180820)
        ano = int(valor_str[:4])
        mes = int(valor_str[4:6])
        
        # Validação básica
        if ano < 1900 or ano > 2100 or mes < 1 or mes > 12:
            return (None, None)
        
        return (ano, mes)
    except (ValueError, TypeError):
        return (None, None)

def filtrar_data_inicio_df(df: pd.DataFrame, ano_min: int = None, ano_max: int = None, mes: int = None) -> pd.DataFrame:
    """
    Filtra o DataFrame por ano/mês de início de atividade.
    
    Args:
        df: DataFrame com a coluna 'DATA DE INÍCIO DE ATIVIDADE'
        ano_min: Ano mínimo (inclusive)
        ano_max: Ano máximo (inclusive)
        mes: Mês específico (1-12, opcional)
    
    Returns:
        DataFrame filtrado
    """
    if ano_min is None and ano_max is None and mes is None:
        return df
    
    df = df.copy()
    
    # Extrair ano e mês de cada registro
    datas_parsed = df['DATA DE INÍCIO DE ATIVIDADE'].apply(parse_data_inicio)
    anos = datas_parsed.apply(lambda x: x[0] if x else None)
    meses = datas_parsed.apply(lambda x: x[1] if x else None)
    
    mask = pd.Series([True] * len(df), index=df.index)
    
    if ano_min is not None:
        mask &= anos.notna() & (anos >= ano_min)
    
    if ano_max is not None:
        mask &= anos.notna() & (anos <= ano_max)
    
    if mes is not None:
        mask &= meses.notna() & (meses == mes)
    
    return df[mask]

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

def filtrar_bairros_df(df: pd.DataFrame, bairros: list) -> pd.DataFrame:
    """
    Filtra DataFrame para manter apenas registros dos bairros selecionados.
    """
    if not bairros:
        return df
    
    # Normalizar bairros (uppercase e strip)
    bairros_normalizados = [b.upper().strip() for b in bairros if b]
    
    if not bairros_normalizados:
        return df
    
    # Aplicar filtro - bairro deve estar na lista selecionada
    mask = df['BAIRRO'].fillna('').str.upper().str.strip().isin(bairros_normalizados)
    return df[mask]

@app.get("/bairros")
async def list_bairros(
    estado: str = Query(..., description="Sigla do estado (ex: SP)"),
    cidade: Optional[str] = Query(None, description="Nome da cidade"),
    cnaes_principais: Optional[str] = Query(None, description="Lista de códigos CNAE principais"),
    cnaes_secundarios: Optional[str] = Query(None, description="Lista de códigos CNAE secundários"),
    exigir_todos_secundarios: bool = Query(False, description="Exigir TODOS os CNAEs secundários"),
    situacao: Optional[str] = Query(None, description="Situação cadastral"),
    porte: Optional[str] = Query(None, description="Porte da empresa"),
    filtrar_telefones_invalidos: bool = Query(False, description="Remover telefones inválidos"),
    apenas_celular: bool = Query(False, description="Apenas empresas com celular"),
    capital_min: Optional[float] = Query(None, description="Capital social mínimo"),
    capital_max: Optional[float] = Query(None, description="Capital social máximo"),
    ano_inicio_min: Optional[int] = Query(None, description="Ano mínimo de início"),
    ano_inicio_max: Optional[int] = Query(None, description="Ano máximo de início"),
    mes_inicio: Optional[int] = Query(None, ge=1, le=12, description="Mês de início"),
):
    """
    Lista os bairros únicos disponíveis após aplicação dos filtros base.
    Útil para pós-filtro de bairros.
    """
    
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
            
            # Aplicar filtros base (mesma lógica do /search)
            if cnaes_principais:
                lista_cnaes = [c.strip() for c in cnaes_principais.split(',') if c.strip()]
                if lista_cnaes:
                    mask = pd.Series([False] * len(df), index=df.index)
                    for cnae in lista_cnaes:
                        mask |= df['COD ATIVIDADE PRINCIPAL'] == str(cnae)
                    df = df[mask]
            
            if cnaes_secundarios:
                lista_cnaes = [c.strip() for c in cnaes_secundarios.split(',') if c.strip()]
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
            
            if filtrar_telefones_invalidos:
                df = filtrar_telefones_invalidos_df(df)
            
            if apenas_celular:
                df = filtrar_apenas_celular_df(df)
            
            if capital_min is not None or capital_max is not None:
                df = filtrar_capital_social_df(df, capital_min, capital_max)
            
            if ano_inicio_min is not None or ano_inicio_max is not None or mes_inicio is not None:
                df = filtrar_data_inicio_df(df, ano_inicio_min, ano_inicio_max, mes_inicio)
            
            total_registros += len(df)
            
            # Extrair bairros únicos
            bairros_coluna = df['BAIRRO'].fillna('').str.upper().str.strip()
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

@app.get("/search")
async def search_empresas(
    estado: Optional[str] = Query(None, description="Sigla do estado (ex: SP)"),
    cidade: Optional[str] = Query(None, description="Nome da cidade"),
    cnaes_principais: Optional[str] = Query(None, description="Lista de códigos CNAE principais separados por vírgula (OR lógico)"),
    cnaes_secundarios: Optional[str] = Query(None, description="Lista de códigos CNAE secundários separados por vírgula"),
    exigir_todos_secundarios: bool = Query(False, description="Exigir TODOS os CNAEs secundários (True) ou QUALQUER UM (False)"),
    situacao: Optional[str] = Query(None, description="Situação cadastral (ex: ATIVA)"),
    porte: Optional[str] = Query(None, description="Porte da empresa"),
    filtrar_telefones_invalidos: bool = Query(False, description="Remover empresas com telefones inválidos (00000000, 99999999, etc.)"),
    adicionar_nono_digito: bool = Query(False, description="Adicionar 9º dígito em celulares no formato antigo"),
    apenas_celular: bool = Query(False, description="Retornar apenas empresas que possuem telefone celular"),
    capital_min: Optional[float] = Query(None, description="Capital social mínimo (em reais)"),
    capital_max: Optional[float] = Query(None, description="Capital social máximo (em reais)"),
    ano_inicio_min: Optional[int] = Query(None, description="Ano mínimo de início de atividade (ex: 2018)"),
    ano_inicio_max: Optional[int] = Query(None, description="Ano máximo de início de atividade (ex: 2023)"),
    mes_inicio: Optional[int] = Query(None, ge=1, le=12, description="Mês de início de atividade (1-12)"),
    bairros: Optional[str] = Query(None, description="Lista de bairros separados por vírgula (pós-filtro)"),
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
            
            # Aplicar filtros de CNAE Principal (OR lógico - qualquer um dos CNAEs selecionados)
            if cnaes_principais:
                lista_cnaes_principais = [cnae.strip() for cnae in cnaes_principais.split(',') if cnae.strip()]
                if lista_cnaes_principais:
                    mask = pd.Series([False] * len(df), index=df.index)
                    for cnae in lista_cnaes_principais:
                        mask |= df['COD ATIVIDADE PRINCIPAL'] == str(cnae)
                    df = df[mask]
            
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
            
            # Filtrar telefones inválidos
            if filtrar_telefones_invalidos:
                df = filtrar_telefones_invalidos_df(df)
            
            # Adicionar 9º dígito em celulares
            if adicionar_nono_digito:
                df = aplicar_nono_digito_df(df)
            
            # Filtro apenas celular
            if apenas_celular:
                df = filtrar_apenas_celular_df(df)
            
            # Filtro de capital social
            if capital_min is not None or capital_max is not None:
                df = filtrar_capital_social_df(df, capital_min, capital_max)
            
            # Filtro de data de início de atividade
            if ano_inicio_min is not None or ano_inicio_max is not None or mes_inicio is not None:
                df = filtrar_data_inicio_df(df, ano_inicio_min, ano_inicio_max, mes_inicio)
            
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
        
        return {
            "total_encontrado": len(resultados),
            "total_lidos": total_lidos,
            "filtros": {
                "estado": estado_upper,
                "cidade": cidade,
                "cnaes_principais": cnaes_principais,
                "cnaes_secundarios": cnaes_secundarios,
                "exigir_todos_secundarios": exigir_todos_secundarios,
                "situacao": situacao,
                "porte": porte,
                "filtrar_telefones_invalidos": filtrar_telefones_invalidos,
                "adicionar_nono_digito": adicionar_nono_digito,
                "apenas_celular": apenas_celular,
                "capital_min": capital_min,
                "capital_max": capital_max
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
    cnaes_principais: Optional[str] = Query(None, description="Lista de códigos CNAE principais separados por vírgula (OR lógico)"),
    cnaes_secundarios: Optional[str] = Query(None, description="Lista de códigos CNAE secundários separados por vírgula"),
    exigir_todos_secundarios: bool = Query(False, description="Exigir TODOS os CNAEs secundários (True) ou QUALQUER UM (False)"),
    situacao: Optional[str] = Query(None, description="Situação cadastral (ex: ATIVA)"),
    porte: Optional[str] = Query(None, description="Porte da empresa"),
    filtrar_telefones_invalidos: bool = Query(False, description="Remover empresas com telefones inválidos"),
    adicionar_nono_digito: bool = Query(False, description="Adicionar 9º dígito em celulares no formato antigo"),
    apenas_celular: bool = Query(False, description="Retornar apenas empresas que possuem telefone celular"),
    capital_min: Optional[float] = Query(None, description="Capital social mínimo (em reais)"),
    capital_max: Optional[float] = Query(None, description="Capital social máximo (em reais)"),
    ano_inicio_min: Optional[int] = Query(None, description="Ano mínimo de início de atividade (ex: 2018)"),
    ano_inicio_max: Optional[int] = Query(None, description="Ano máximo de início de atividade (ex: 2023)"),
    mes_inicio: Optional[int] = Query(None, ge=1, le=12, description="Mês de início de atividade (1-12)"),
    bairros: Optional[str] = Query(None, description="Lista de bairros separados por vírgula (pós-filtro)"),
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
            
            # Aplicar filtros de CNAE Principal (OR lógico)
            if cnaes_principais:
                lista_cnaes_principais = [cnae.strip() for cnae in cnaes_principais.split(',') if cnae.strip()]
                if lista_cnaes_principais:
                    mask = pd.Series([False] * len(df), index=df.index)
                    for cnae in lista_cnaes_principais:
                        mask |= df['COD ATIVIDADE PRINCIPAL'] == str(cnae)
                    df = df[mask]
            
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
            
            # Filtrar telefones inválidos
            if filtrar_telefones_invalidos:
                df = filtrar_telefones_invalidos_df(df)
            
            # Filtro apenas celular (NOTA: como é contagem, não precisa CORRIGIR o 9º dígito antes de filtrar, 
            # pois is_celular sabe lidar com ambos formatos, a menos que o usuário queira EXPORTAR)
            # Mas vamos manter a lógica consistente: se pediu pra contar, conta os que batem no critério.
            if apenas_celular:
                df = filtrar_apenas_celular_df(df)
            
            # Filtro de capital social
            if capital_min is not None or capital_max is not None:
                df = filtrar_capital_social_df(df, capital_min, capital_max)
            
            # Filtro de data de início de atividade
            if ano_inicio_min is not None or ano_inicio_max is not None or mes_inicio is not None:
                df = filtrar_data_inicio_df(df, ano_inicio_min, ano_inicio_max, mes_inicio)
            
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
                "estado": estado_upper,
                "cidade": cidade,
                "cnaes_principais": cnaes_principais,
                "cnaes_secundarios": cnaes_secundarios,
                "exigir_todos_secundarios": exigir_todos_secundarios,
                "situacao": situacao,
                "porte": porte,
                "filtrar_telefones_invalidos": filtrar_telefones_invalidos,
                "adicionar_nono_digito": adicionar_nono_digito,
                "apenas_celular": apenas_celular,
                "capital_min": capital_min,
                "capital_max": capital_max
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
    cnaes_principais: Optional[str] = Query(None, description="Lista de códigos CNAE principais separados por vírgula (OR lógico)"),
    cnaes_secundarios: Optional[str] = Query(None, description="Lista de códigos CNAE secundários separados por vírgula"),
    exigir_todos_secundarios: bool = Query(False, description="Exigir TODOS os CNAEs secundários (True) ou QUALQUER UM (False)"),
    situacao: Optional[str] = Query(None, description="Situação cadastral (ex: ATIVA)"),
    porte: Optional[str] = Query(None, description="Porte da empresa"),
    filtrar_telefones_invalidos: bool = Query(False, description="Remover empresas com telefones inválidos"),
    adicionar_nono_digito: bool = Query(False, description="Adicionar 9º dígito em celulares no formato antigo"),
    apenas_celular: bool = Query(False, description="Retornar apenas empresas que possuem telefone celular"),
    capital_min: Optional[float] = Query(None, description="Capital social mínimo (em reais)"),
    capital_max: Optional[float] = Query(None, description="Capital social máximo (em reais)"),
    ano_inicio_min: Optional[int] = Query(None, description="Ano mínimo de início de atividade (ex: 2018)"),
    ano_inicio_max: Optional[int] = Query(None, description="Ano máximo de início de atividade (ex: 2023)"),
    mes_inicio: Optional[int] = Query(None, ge=1, le=12, description="Mês de início de atividade (1-12)"),
    bairros: Optional[str] = Query(None, description="Lista de bairros separados por vírgula (pós-filtro)"),
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
                
                # Aplicar filtros de CNAE Principal (OR lógico)
                if cnaes_principais:
                    lista_cnaes_principais = [cnae.strip() for cnae in cnaes_principais.split(',') if cnae.strip()]
                    if lista_cnaes_principais:
                        mask = pd.Series([False] * len(df), index=df.index)
                        for cnae in lista_cnaes_principais:
                            mask |= df['COD ATIVIDADE PRINCIPAL'] == str(cnae)
                        df = df[mask]
                
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
                
                # Filtrar telefones inválidos
                if filtrar_telefones_invalidos:
                    df = filtrar_telefones_invalidos_df(df)
                
                # Adicionar 9º dígito em celulares
                if adicionar_nono_digito:
                    df = aplicar_nono_digito_df(df)
                
                # Filtro apenas celular
                if apenas_celular:
                    df = filtrar_apenas_celular_df(df)
                
                # Filtro de capital social
                if capital_min is not None or capital_max is not None:
                    df = filtrar_capital_social_df(df, capital_min, capital_max)
                
                # Filtro de data de início de atividade
                if ano_inicio_min is not None or ano_inicio_max is not None or mes_inicio is not None:
                    df = filtrar_data_inicio_df(df, ano_inicio_min, ano_inicio_max, mes_inicio)
                
                # Pós-filtro de bairros
                if bairros:
                    lista_bairros = [b.strip() for b in bairros.split(',') if b.strip()]
                    if lista_bairros:
                        df = filtrar_bairros_df(df, lista_bairros)
                
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
    if cnaes_principais:
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


@app.get("/export-xlsx")
async def export_empresas_xlsx(
    estado: Optional[str] = Query(None, description="Sigla do estado (ex: SP)"),
    cidade: Optional[str] = Query(None, description="Nome da cidade"),
    cnaes_principais: Optional[str] = Query(None, description="Lista de códigos CNAE principais separados por vírgula (OR lógico)"),
    cnaes_secundarios: Optional[str] = Query(None, description="Lista de códigos CNAE secundários separados por vírgula"),
    exigir_todos_secundarios: bool = Query(False, description="Exigir TODOS os CNAEs secundários (True) ou QUALQUER UM (False)"),
    situacao: Optional[str] = Query(None, description="Situação cadastral (ex: ATIVA)"),
    porte: Optional[str] = Query(None, description="Porte da empresa"),
    filtrar_telefones_invalidos: bool = Query(False, description="Remover empresas com telefones inválidos"),
    adicionar_nono_digito: bool = Query(False, description="Adicionar 9º dígito em celulares no formato antigo"),
    apenas_celular: bool = Query(False, description="Retornar apenas empresas que possuem telefone celular"),
    capital_min: Optional[float] = Query(None, description="Capital social mínimo (em reais)"),
    capital_max: Optional[float] = Query(None, description="Capital social máximo (em reais)"),
    ano_inicio_min: Optional[int] = Query(None, description="Ano mínimo de início de atividade (ex: 2018)"),
    ano_inicio_max: Optional[int] = Query(None, description="Ano máximo de início de atividade (ex: 2023)"),
    mes_inicio: Optional[int] = Query(None, ge=1, le=12, description="Mês de início de atividade (1-12)"),
    bairros: Optional[str] = Query(None, description="Lista de bairros separados por vírgula (pós-filtro)"),
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
                
                # Aplicar filtros de CNAE Principal (OR lógico)
                if cnaes_principais:
                    lista_cnaes_principais = [cnae.strip() for cnae in cnaes_principais.split(',') if cnae.strip()]
                    if lista_cnaes_principais:
                        mask = pd.Series([False] * len(df), index=df.index)
                        for cnae in lista_cnaes_principais:
                            mask |= df['COD ATIVIDADE PRINCIPAL'] == str(cnae)
                        df = df[mask]
                
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
                
                # Filtrar telefones inválidos
                if filtrar_telefones_invalidos:
                    df = filtrar_telefones_invalidos_df(df)
                
                # Adicionar 9º dígito em celulares
                if adicionar_nono_digito:
                    df = aplicar_nono_digito_df(df)
                
                # Filtro apenas celular
                if apenas_celular:
                    df = filtrar_apenas_celular_df(df)
                
                # Filtro de capital social
                if capital_min is not None or capital_max is not None:
                    df = filtrar_capital_social_df(df, capital_min, capital_max)
                
                # Filtro de data de início de atividade
                if ano_inicio_min is not None or ano_inicio_max is not None or mes_inicio is not None:
                    df = filtrar_data_inicio_df(df, ano_inicio_min, ano_inicio_max, mes_inicio)
                
                # Pós-filtro de bairros
                if bairros:
                    lista_bairros = [b.strip() for b in bairros.split(',') if b.strip()]
                    if lista_bairros:
                        df = filtrar_bairros_df(df, lista_bairros)
                
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
        if cnaes_principais:
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
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao gerar arquivo Excel: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
