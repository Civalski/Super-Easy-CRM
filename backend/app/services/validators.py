import re
import pandas as pd

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
