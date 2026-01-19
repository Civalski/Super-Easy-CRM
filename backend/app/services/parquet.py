from typing import Optional, List, Tuple
from pathlib import Path
from fastapi import HTTPException
from app.core.config import settings
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.dependencies import LocationFilters

def resolver_arquivos_parquet(
    estados: Optional[str] = None,
    cidades: Optional[str] = None,
    brasil_inteiro: bool = False
) -> Tuple[List[Path], str]:
    """
    Resolve quais arquivos .parquet devem ser lidos baseado nos parâmetros de localização.
    
    Args:
        estados: String com siglas de estados separadas por vírgula (ex: "SP,RJ,MG")
        cidades: String com nomes de cidades no formato "ESTADO:CIDADE" separados por vírgula
                 (ex: "SP:SAO PAULO,SP:CAMPINAS,RJ:RIO DE JANEIRO")
        brasil_inteiro: Se True, lê todos os estados disponíveis
    
    Returns:
        Tupla (lista_de_arquivos, descrição_para_logs)
    """
    # DADOS_PATH from settings
    DADOS_PATH = settings.PARQUET_DATA_PATH
    
    arquivos = []
    
    if brasil_inteiro:
        # Ler TODOS os estados
        for estado_dir in DADOS_PATH.iterdir():
            if estado_dir.is_dir():
                arquivos.extend(list(estado_dir.glob("*.parquet")))
        return arquivos, "BRASIL"
    
    if cidades:
        # Parse de cidades no formato "ESTADO:CIDADE"
        cidades_list = [c.strip() for c in cidades.split(',') if c.strip()]
        for cidade_spec in cidades_list:
            if ':' in cidade_spec:
                estado, cidade = cidade_spec.split(':', 1)
                estado = estado.upper().strip()
                cidade = cidade.upper().strip()
                estado_path = DADOS_PATH / estado
                if estado_path.exists():
                    cidade_file = estado_path / f"{estado} - {cidade}.parquet"
                    if cidade_file.exists():
                        arquivos.append(cidade_file)
            else:
                # Formato antigo: apenas nome da cidade (requer estado, não suportado isoladamente aqui sem contexto)
                pass
        return arquivos, f"CIDADES: {len(cidades_list)}"
    
    if estados:
        # Ler todos os arquivos de múltiplos estados
        estados_list = [e.strip().upper() for e in estados.split(',') if e.strip()]
        for estado in estados_list:
            estado_path = DADOS_PATH / estado
            if estado_path.exists():
                arquivos.extend(list(estado_path.glob("*.parquet")))
        return arquivos, f"ESTADOS: {','.join(estados_list)}"
    
    return [], "NENHUM"

def resolve_location_from_filters(loc_filters: 'LocationFilters') -> Tuple[List[Path], str]:
    """
    Resolve os arquivos Parquet baseado nos filtros de localização.
    Lança HTTPException se não encontrar ou se parâmetros forem inválidos.
    """
    DADOS_PATH = settings.PARQUET_DATA_PATH
    
    if loc_filters.brasil_inteiro:
        return resolver_arquivos_parquet(brasil_inteiro=True)
    elif loc_filters.cidades:
        return resolver_arquivos_parquet(cidades=loc_filters.cidades)
    elif loc_filters.estados:
        return resolver_arquivos_parquet(estados=loc_filters.estados)
    elif loc_filters.estado:
        # Retrocompatibilidade
        estado_upper = loc_filters.estado.upper()
        estado_path = DADOS_PATH / estado_upper
        
        if not estado_path.exists():
            raise HTTPException(status_code=404, detail=f"Estado {loc_filters.estado} não encontrado")
        
        if loc_filters.cidade:
            cidade_file = estado_path / f"{estado_upper} - {loc_filters.cidade.upper()}.parquet"
            if not cidade_file.exists():
                raise HTTPException(
                    status_code=404, 
                    detail=f"Cidade {loc_filters.cidade} não encontrada no estado {loc_filters.estado}"
                )
            return [cidade_file], f"{estado_upper}:{loc_filters.cidade.upper()}"
        else:
            return list(estado_path.glob("*.parquet")), estado_upper
    else:
        raise HTTPException(
            status_code=400, 
            detail="É necessário informar pelo menos: 'estado', 'estados', 'cidades' ou 'brasil_inteiro=true'"
        )
