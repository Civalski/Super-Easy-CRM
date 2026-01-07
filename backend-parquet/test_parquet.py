"""
Script de teste para validar leitura de arquivos .parquet
Execute: python test_parquet.py
"""
import pyarrow.parquet as pq
import pandas as pd
from pathlib import Path
import sys

def test_read_parquet():
    """Testa leitura de um arquivo .parquet de exemplo"""
    
    # Caminho para arquivo de teste (SP - ADAMANTINA)
    dados_path = Path(__file__).parent.parent / "Dados"
    test_file = dados_path / "SP" / "SP - ADAMANTINA.parquet"
    
    if not test_file.exists():
        print(f"❌ Arquivo não encontrado: {test_file}")
        return False
    
    try:
        print(f"📂 Lendo arquivo: {test_file.name}")
        print(f"   Tamanho: {test_file.stat().st_size / 1024:.2f} KB\n")
        
        # Ler com PyArrow (mais eficiente)
        table = pq.read_table(test_file)
        df = table.to_pandas()
        
        print(f"✅ Arquivo lido com sucesso!")
        print(f"   Registros: {len(df)}")
        print(f"   Colunas: {len(df.columns)}\n")
        
        # Mostrar colunas disponíveis
        print("📋 Colunas disponíveis:")
        for col in df.columns:
            print(f"   - {col}")
        
        print(f"\n📊 Primeiras 3 linhas:")
        print(df.head(3).to_string())
        
        # Testar filtros
        print(f"\n🔍 Testando filtros:")
        
        # Filtro por CNAE (exemplo: 4399103 - Obras de alvenaria)
        cnae_filter = df[df['COD ATIVIDADE PRINCIPAL'] == '4399103']
        print(f"   CNAE 4399103: {len(cnae_filter)} empresas")
        
        # Filtro por situação
        ativas = df[df['SITUAÇÃO CADASTRAL'] != 'INAPTA']
        print(f"   Empresas ativas: {len(ativas)}")
        
        # Filtro por porte
        micro = df[df['PORTE DA EMPRESA'] == 'MICRO EMPRESA']
        print(f"   Micro empresas: {len(micro)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao ler arquivo: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def scan_parquet_structure():
    """Escaneia estrutura de pastas dos .parquet"""
    dados_path = Path(__file__).parent.parent / "Dados"
    
    if not dados_path.exists():
        print(f"❌ Pasta Dados não encontrada: {dados_path}")
        return
    
    print(f"📁 Escaneando estrutura em: {dados_path}\n")
    
    estados = sorted([d for d in dados_path.iterdir() if d.is_dir()])
    
    total_files = 0
    for estado in estados[:5]:  # Mostra apenas os 5 primeiros
        parquet_files = list(estado.glob("*.parquet"))
        total_files += len(parquet_files)
        print(f"   {estado.name}: {len(parquet_files)} cidades")
    
    print(f"\n   Total de estados: {len(estados)}")
    print(f"   Arquivos .parquet escaneados (primeiros 5 estados): {total_files}")

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 TESTE DE LEITURA DE ARQUIVOS .PARQUET")
    print("=" * 60 + "\n")
    
    # Verificar se PyArrow está instalado
    try:
        import pyarrow
        print(f"✅ PyArrow versão: {pyarrow.__version__}\n")
    except ImportError:
        print("❌ PyArrow não instalado!")
        print("   Execute: pip install -r requirements.txt\n")
        sys.exit(1)
    
    # Escanear estrutura
    scan_parquet_structure()
    
    print("\n" + "=" * 60)
    print("📖 TESTE DE LEITURA DE ARQUIVO")
    print("=" * 60 + "\n")
    
    # Testar leitura
    success = test_read_parquet()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ TODOS OS TESTES PASSARAM!")
    else:
        print("❌ TESTES FALHARAM")
    print("=" * 60)
