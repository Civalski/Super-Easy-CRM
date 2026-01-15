---
description: Como iniciar o servidor de desenvolvimento do projeto
---
# Iniciar o Projeto

// turbo-all

## Passos:

1. Ativar o ambiente virtual Python (para o backend):
```powershell
& "d:/Projetos/Arker CRM/.venv/Scripts/Activate.ps1"
```

2. Iniciar o servidor de desenvolvimento (frontend + backend):
```powershell
npm run dev
```

O comando `npm run dev` inicia simultaneamente:
- Next.js frontend na porta 3000
- Backend Python FastAPI na porta 8000

## URLs:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Documentação API: http://localhost:8000/docs
