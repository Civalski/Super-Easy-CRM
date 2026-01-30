import duckdb
from typing import List, Any
import pandas as pd

class DuckDBClient:
    def __init__(self):
        # Conexão em memória por padrão, mas pode ser configurada
        self.conn = duckdb.connect(database=':memory:', read_only=False)
        
        # Instalar e carregar extensão parquet se necessário
        # Em versões recentes do pip package, parquet já vem embutido ou pre-carregado
        # Vamos tentar sem INSTALL explícito para evitar erro de download/disco
        try:
            self.conn.execute("LOAD parquet;") 
        except:
            pass # Pode já estar carregado

    def query_files(self, file_paths: List[str], where_clause: str = None, limit: int = None, offset: int = None) -> pd.DataFrame:
        """
        Executa uma query SQL em uma lista de arquivos Parquet
        
        Args:
            file_paths: Lista de caminhos completos para arquivos .parquet
            where_clause: Cláusula WHERE SQL (ex: "porte = 'MICRO EMPRESA'")
            limit: Limite de registros
            offset: Offset de registros
            
        Returns:
            DataFrame com os resultados
        """
        if not file_paths:
            return pd.DataFrame()
            
        # Converter caminhos para string e escapar aspas simples
        paths_str = [f"'{str(p).replace("'", "''")}'" for p in file_paths]
        files_list = ", ".join(paths_str)
        
        query = f"SELECT * FROM read_parquet([{files_list}], union_by_name=True)"
        
        if where_clause:
            query += f" WHERE {where_clause}"
            
        if limit is not None:
            query += f" LIMIT {limit}"
            
        if offset is not None:
            query += f" OFFSET {offset}"
            
        try:
            # DEBUG: Mostrar query completa
            print("DuckDB Query:", flush=True)
            print(query, flush=True)
            print("-" * 80, flush=True)
            
            result = self.conn.execute(query).df()
            
            print(f"DuckDB retornou {len(result)} linhas", flush=True)
            
            return result
        except Exception as e:
            print(f"ERRO na query DuckDB: {e}", flush=True)
            print(f"Query que falhou: {query}", flush=True)
            raise

    def count_files(self, file_paths: List[str], where_clause: str = None) -> int:
        """
        Conta registros em arquivos Parquet
        """
        if not file_paths:
            return 0
            
        paths_str = [f"'{str(p).replace("'", "''")}'" for p in file_paths]
        files_list = ", ".join(paths_str)
        
        query = f"SELECT count(*) FROM read_parquet([{files_list}], union_by_name=True)"
        
        if where_clause:
            query += f" WHERE {where_clause}"
            
        try:
            return self.conn.execute(query).fetchone()[0]
        except Exception as e:
            print(f"Erro no count DuckDB: {e}")
            raise

    def export_csv_stream(self, file_paths: List[str], where_clause: str = None) -> Any:
        # Para streaming, DuckDB pode ser mais complexo. 
        # Podemos retornar um cursor ou iterar em chunks.
        # Por enquanto vamos simplificar usando o método padrão de query e depois iterando.
        pass

# Instância global (ou pode ser injetada como dependência)
duckdb_client = DuckDBClient()
