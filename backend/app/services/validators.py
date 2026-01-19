import re
import pandas as pd

def is_telefone_valido(telefone: str) -> bool:
    """
    Verifica se um telefone é válido (não é ruído).
    
    Telefones inválidos:
    - Vazios ou None
    - Apenas dígitos repetidos (00000000, 11111111, 33333333, 99999999, etc.)
    - Números com apenas 2 dígitos únicos em padrão repetitivo (ex: 33334444, 22228888)
    - Muito curtos (menos de 8 dígitos)
    - Sequências óbvias crescentes ou decrescentes (12345678, 87654321)
    - Começam com muitos zeros (0000xxxx)
    - Padrões alternados (12121212, 98989898)
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
    
    digitos_unicos = set(apenas_digitos)
    
    # Todos os dígitos são iguais (00000000, 11111111, 33333333, 99999999, etc.)
    # Funciona para qualquer quantidade de dígitos
    if len(digitos_unicos) == 1:
        return False
    
    # Apenas 2 dígitos únicos pode indicar padrão inválido (ex: 33334444, 11112222)
    if len(digitos_unicos) == 2:
        # Verifica se é um padrão de metades repetidas (ex: 33334444)
        metade = len(apenas_digitos) // 2
        primeira_metade = apenas_digitos[:metade]
        segunda_metade = apenas_digitos[metade:metade*2]
        
        # Se cada metade tem apenas um dígito único, é inválido
        if len(set(primeira_metade)) == 1 and len(set(segunda_metade)) == 1:
            return False
        
        # Padrão alternado (12121212, 98989898, etc.)
        if len(apenas_digitos) >= 8:
            primeiro = apenas_digitos[0]
            segundo = apenas_digitos[1]
            if primeiro != segundo:
                padrao_alternado = (primeiro + segundo) * (len(apenas_digitos) // 2)
                if apenas_digitos == padrao_alternado[:len(apenas_digitos)]:
                    return False
    
    # Sequências crescentes ou decrescentes (funciona para qualquer tamanho)
    def is_sequencia(num_str: str) -> bool:
        if len(num_str) < 4:
            return False
        # Verifica se é crescente
        crescente = all(
            int(num_str[i]) == int(num_str[i-1]) + 1 
            for i in range(1, len(num_str))
        )
        # Verifica se é decrescente
        decrescente = all(
            int(num_str[i]) == int(num_str[i-1]) - 1 
            for i in range(1, len(num_str))
        )
        return crescente or decrescente
    
    if is_sequencia(apenas_digitos):
        return False
    
    # Começa com muitos zeros (mais de 4)
    if apenas_digitos.startswith('00000'):
        return False
    
    # Padrão repetitivo de blocos (ex: 12341234, 56785678)
    if len(apenas_digitos) >= 8:
        for tamanho_bloco in [2, 3, 4]:
            if len(apenas_digitos) % tamanho_bloco == 0:
                bloco = apenas_digitos[:tamanho_bloco]
                repeticoes = len(apenas_digitos) // tamanho_bloco
                if apenas_digitos == bloco * repeticoes:
                    return False
    
    return True

def corrigir_nono_digito(telefone: str) -> str:
    """
    Adiciona o 9º dígito em números de celular que estão no formato antigo.
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
        valor_str = valor_str.replace('.', '').replace(',', '.')
        
        return float(valor_str)
    except (ValueError, TypeError):
        return 0.0

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
