# Backend Parquet API (Opcional)

Este backend e **opcional** e nao e usado pelo web app por padrao.
Use apenas se for reativar o fluxo com arquivos .parquet/duckdb.

Status atual:
- BACKEND_ENABLED=false (padrao)
- Somente "/" e "/health" ficam ativos

---

## Uso rapido

```bash
# 1. Criar ambiente virtual (recomendado)
python -m venv venv

# 2. Ativar ambiente virtual
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar .env
copy .env.example .env
```

## Executar API

```bash
python main.py
```

A API estara disponivel em http://localhost:5000

---

## Endpoints

- `GET /` - Status da API
- `GET /health` - Health check

Se quiser habilitar endpoints extras (uso interno):
- Defina `BACKEND_ENABLED=true` no `.env`
- Endpoints extras ficam em `/system/*`

---

## Observacoes

- Este backend nao e usado pelo Next.js por padrao.
- Quando for reativar, ajuste CORS e caminhos de dados.
