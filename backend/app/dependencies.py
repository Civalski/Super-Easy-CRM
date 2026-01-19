from fastapi import Query
from typing import Optional

class CommonFilters:
    def __init__(
        self,
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
    ):
        self.cnaes_principais = cnaes_principais
        self.cnaes_secundarios = cnaes_secundarios
        self.exigir_todos_secundarios = exigir_todos_secundarios
        self.situacao = situacao
        self.porte = porte
        self.filtrar_telefones_invalidos = filtrar_telefones_invalidos
        self.adicionar_nono_digito = adicionar_nono_digito
        self.apenas_celular = apenas_celular
        self.capital_min = capital_min
        self.capital_max = capital_max
        self.ano_inicio_min = ano_inicio_min
        self.ano_inicio_max = ano_inicio_max
        self.mes_inicio = mes_inicio

class LocationFilters:
    def __init__(
        self,
        estado: Optional[str] = Query(None, description="Sigla do estado (ex: SP) - retrocompatível"),
        estados: Optional[str] = Query(None, description="Lista de siglas de estados separadas por vírgula (ex: SP,RJ,MG)"),
        cidade: Optional[str] = Query(None, description="Nome da cidade - retrocompatível"),
        cidades: Optional[str] = Query(None, description="Lista de cidades no formato ESTADO:CIDADE separadas por vírgula"),
        brasil_inteiro: bool = Query(False, description="Se True, busca em todos os estados do Brasil"),
    ):
        self.estado = estado
        self.estados = estados
        self.cidade = cidade
        self.cidades = cidades
        self.brasil_inteiro = brasil_inteiro
