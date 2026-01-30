from app.dependencies import CommonFilters
from typing import Optional

def construir_filtro_sql(filters: CommonFilters, bairros: Optional[str] = None) -> str:
    """
    Traduz os filtros da API para uma cláusula WHERE SQL compatível com DuckDB
    """
    conditions = []
    
    # 1. CNAE Principal
    if filters.cnaes_principais:
        cnaes = [c.strip() for c in filters.cnaes_principais.split(',') if c.strip()]
        if cnaes:
            # DuckDB usa aspas simples para strings. Ex: "COD ATIVIDADE PRINCIPAL" IN ('123', '456')
            cnaes_str = ", ".join([f"'{c}'" for c in cnaes])
            conditions.append(f"\"COD ATIVIDADE PRINCIPAL\" IN ({cnaes_str})")

    # 2. CNAE Secundário 
    if filters.cnaes_secundarios:
        cnaes = [c.strip() for c in filters.cnaes_secundarios.split(',') if c.strip()]
        if cnaes:
            if filters.exigir_todos_secundarios:
                # AND para todos: column LIKE '%123%' AND column LIKE '%456%'
                sub_conditions = [f"\"COD ATIVIDADES SECUNDARIAS\" LIKE '%{c}%'" for c in cnaes]
                conditions.append(f"({' AND '.join(sub_conditions)})")
            else:
                # OR (pelo menos um): column LIKE '%123%' OR column LIKE '%456%'
                sub_conditions = [f"\"COD ATIVIDADES SECUNDARIAS\" LIKE '%{c}%'" for c in cnaes]
                conditions.append(f"({' OR '.join(sub_conditions)})")

    # 3. Situação Cadastral
    if filters.situacao:
        conditions.append(f"\"SITUAÇÃO CADASTRAL\" = '{filters.situacao.upper()}'")

    # 4. Porte
    if filters.porte:
        conditions.append(f"\"PORTE DA EMPRESA\" = '{filters.porte.upper()}'")

    # 5. Capital Social
    # O campo CAPITAL SOCIAL geralmente é texto com vírgula (ex: "10000,00"). 
    # Precisamos converter para DOUBLE no DuckDB: CAST(REPLACE(REPLACE("CAPITAL SOCIAL", '.', ''), ',', '.') AS DOUBLE)
    if filters.capital_min is not None or filters.capital_max is not None:
        col_capital = "TRY_CAST(REPLACE(REPLACE(\"CAPITAL SOCIAL\", '.', ''), ',', '.') AS DOUBLE)"
        
        if filters.capital_min is not None:
             conditions.append(f"{col_capital} >= {filters.capital_min}")
             
        if filters.capital_max is not None:
             conditions.append(f"{col_capital} <= {filters.capital_max}")

    # 6. Data Início Atividade (Formato AAAAMMDD como string ou inteiro)
    # Vamos assumir que é stored as string 'YYYYMMDD' or int YYYYMMDD based on previous pandas code
    if filters.ano_inicio_min is not None or filters.ano_inicio_max is not None or filters.mes_inicio is not None:
        # Extrair ano: LEFT("DATA DE INÍCIO DE ATIVIDADE", 4)
        col_ano = "TRY_CAST(LEFT(\"DATA DE INÍCIO DE ATIVIDADE\", 4) AS INTEGER)"
        col_mes = "TRY_CAST(SUBSTR(\"DATA DE INÍCIO DE ATIVIDADE\", 5, 2) AS INTEGER)"
        
        if filters.ano_inicio_min is not None:
            conditions.append(f"{col_ano} >= {filters.ano_inicio_min}")
            
        if filters.ano_inicio_max is not None:
            conditions.append(f"{col_ano} <= {filters.ano_inicio_max}")
            
        if filters.mes_inicio is not None:
            conditions.append(f"{col_mes} = {filters.mes_inicio}")

    # 7. Bairros
    if bairros:
        lista_bairros = [b.strip().upper() for b in bairros.split(',') if b.strip()]
        if lista_bairros:
            bairros_str = ", ".join([f"'{b}'" for b in lista_bairros])
            conditions.append(f"UPPER(TRIM(BAIRRO)) IN ({bairros_str})")

    # 8. Filtros Especiais (Telefone, Celular)
    # Esses são mais complexos de fazer em SQL puro regex, mas DuckDB suporta regexp_matches
    
    # TEMPORARIAMENTE DESABILITADO PARA DEBUG
    # if filters.apenas_celular:
    #     # Celular brasileiro: tem o dígito 9 após o DDD
    #     # Padrão mais flexível: qualquer coisa com 9 seguido de 8 dígitos
    #     # Exemplos: (11) 91234-5678, 11 91234567, (11)912345678, 11912345678
    #     # Regex simplificado que funciona no DuckDB: contém sequência de 9 + 8 dígitos
    #     conditions.append("(\"TELEFONE 1\" ~ '9[0-9]{8}' OR \"TELEFONE 2\" ~ '9[0-9]{8}')")

    if filters.filtrar_telefones_invalidos:
        # Telefone válido: não é nulo e não está vazio
        # Vamos verificar se tem conteúdo relevante (pelo menos alguns dígitos)
        conditions.append("((\"TELEFONE 1\" IS NOT NULL AND \"TELEFONE 1\" != '') OR (\"TELEFONE 2\" IS NOT NULL AND \"TELEFONE 2\" != ''))")

    # Juntar todas as condições
    if not conditions:
        return None
        
    return " AND ".join(conditions)
