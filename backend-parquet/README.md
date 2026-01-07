# Backend Parquet API

API FastAPI para processar e filtrar dados de empresas dos arquivos .parquet.

## 🚀 Instalação

```bash
# 1. Criar ambiente virtual (recomendado)
python -m venv venv

# 2. Ativar ambiente virtual
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Configurar .env (copie do .env.example)
copy .env.example .env
```

## 🧪 Testar Instalação

```bash
# Testar leitura de .parquet
python test_parquet.py
```

## ▶️ Executar API

```bash
# Modo desenvolvimento
python main.py

# Ou com uvicorn diretamente
uvicorn main:app --reload --port 5000
```

A API estará disponível em `http://localhost:5000`

## 📚 Endpoints

### Status
- `GET /` - Status da API
- `GET /health` - Health check

### Dados
- `GET /estados` - Lista todos os estados disponíveis
- `GET /cidades/{estado}` - Lista cidades de um estado
- `GET /search` - Busca empresas com filtros

### Exemplos de Busca

```bash
# Buscar empresas em SP - ADAMANTINA
curl "http://localhost:5000/search?estado=SP&cidade=ADAMANTINA&limit=10"

# Buscar por CNAE em SP
curl "http://localhost:5000/search?estado=SP&cnae=4399103&limit=50"

# Buscar micro empresas ativas
curl "http://localhost:5000/search?estado=SP&cidade=ADAMANTINA&porte=MICRO%20EMPRESA&situacao=ATIVA"
```

## 🔗 Documentação Interativa

Acesse `http://localhost:5000/docs` para a documentação Swagger automática.

## 📊 Estrutura

```
backend-parquet/
├── main.py              # API FastAPI
├── test_parquet.py      # Script de teste
├── requirements.txt     # Dependências Python
├── .env                # Configuração (não commitado)
└── README.md           # Este arquivo
```

## 🛠️ Próximos Passos

1. ✅ Teste básico de leitura
2. ✅ API FastAPI inicial
3. ⏳ Cache em PostgreSQL (opcional)
4. ⏳ Integração com Next.js
