import pandas as pd
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.dependencies import CommonFilters

from .validators import (
    is_telefone_valido, 
    corrigir_nono_digito, 
    is_celular, 
    parse_capital_social, 
    parse_data_inicio
)

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

def aplicar_nono_digito_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aplica a correção do 9º dígito em todas as colunas de telefone do DataFrame.
    """
    df = df.copy()
    df['TELEFONE 1'] = df['TELEFONE 1'].apply(corrigir_nono_digito)
    df['TELEFONE 2'] = df['TELEFONE 2'].apply(corrigir_nono_digito)
    return df

def filtrar_apenas_celular_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Mantém apenas registros onde pelo menos um dos telefones é celular.
    """
    mask_tel1 = df['TELEFONE 1'].apply(is_celular)
    mask_tel2 = df['TELEFONE 2'].apply(is_celular)
    return df[mask_tel1 | mask_tel2]

def filtrar_capital_social_df(df: pd.DataFrame, capital_min: float = None, capital_max: float = None) -> pd.DataFrame:
    """
    Filtra o DataFrame por faixa de capital social.
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

def filtrar_data_inicio_df(df: pd.DataFrame, ano_min: int = None, ano_max: int = None, mes: int = None) -> pd.DataFrame:
    """
    Filtra o DataFrame por ano/mês de início de atividade.
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

def aplicar_filtros_padrao(df: pd.DataFrame, filters: 'CommonFilters') -> pd.DataFrame:
    """
    Aplica todos os filtros comuns definidos na dependência CommonFilters.
    """
    # CNAE Principal
    if filters.cnaes_principais:
        lista_cnaes_principais = [cnae.strip() for cnae in filters.cnaes_principais.split(',') if cnae.strip()]
        if lista_cnaes_principais:
            mask = pd.Series([False] * len(df), index=df.index)
            for cnae in lista_cnaes_principais:
                mask |= df['COD ATIVIDADE PRINCIPAL'] == str(cnae)
            df = df[mask]
    
    # CNAE Secundário
    if filters.cnaes_secundarios:
        lista_cnaes = [cnae.strip() for cnae in filters.cnaes_secundarios.split(',') if cnae.strip()]
        if lista_cnaes:
            if filters.exigir_todos_secundarios:
                for cnae in lista_cnaes:
                    df = df[df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.contains(str(cnae), regex=False)]
            else:
                mask = pd.Series([False] * len(df), index=df.index)
                for cnae in lista_cnaes:
                    mask |= df['COD ATIVIDADES SECUNDARIAS'].fillna('').str.contains(str(cnae), regex=False)
                df = df[mask]
    
    # Situação e Porte
    if filters.situacao:
        df = df[df['SITUAÇÃO CADASTRAL'] == filters.situacao.upper()]
    
    if filters.porte:
        df = df[df['PORTE DA EMPRESA'] == filters.porte.upper()]
    
    # Validações de telefone
    if filters.filtrar_telefones_invalidos:
        df = filtrar_telefones_invalidos_df(df)
    
    if filters.adicionar_nono_digito:
        df = aplicar_nono_digito_df(df)
        
    if filters.apenas_celular:
        df = filtrar_apenas_celular_df(df)
        
    # Capital Social
    if filters.capital_min is not None or filters.capital_max is not None:
        df = filtrar_capital_social_df(df, filters.capital_min, filters.capital_max)
        
    # Data de Início
    if filters.ano_inicio_min is not None or filters.ano_inicio_max is not None or filters.mes_inicio is not None:
        df = filtrar_data_inicio_df(df, filters.ano_inicio_min, filters.ano_inicio_max, filters.mes_inicio)
        
    return df
