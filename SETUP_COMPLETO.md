# ✅ RESOLVIDO - Inicialização Automática do Arker CRM

## 🎉 Tudo Pronto!

O sistema de inicialização automática está **100% funcional**!

---

## 🚀 Como Usar

**Simplesmente execute:**

```bash
npm run dev
```

**Ou use o script PowerShell:**

```powershell
.\start.ps1
```

---

## ✨ O que acontece automaticamente:

1. ✅ **Detecta e usa o venv** (`.venv`) se existir
2. ✅ **Cria arquivo `.env`** no backend se necessário
3. ✅ **Inicia Frontend** Next.js na porta 3000
4. ✅ **Inicia Backend** Python FastAPI na porta 5000
5. ✅ **Logs coloridos** para fácil identificação

---

## 📋 Configuração (já está pronta!)

### Dependências Python
✅ **Já instaladas no venv (.venv)**:
- FastAPI 0.109.0
- Uvicorn 0.27.0
- PyArrow 22.0.0
- Pandas 2.3.3
- Python-dotenv 1.0.0
- Python-multipart 0.0.6

### Dependências Node.js
✅ **Já instaladas**:
- Next.js 14.1.0
- Concurrently 8.2.2
- Todas as outras dependências do frontend

---

## 🌐 URLs Disponíveis

| Serviço | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:5000 |
| **API Docs** | http://localhost:5000/docs |
| **Health Check** | http://localhost:5000/health |

---

## 🔧 Detalhes Técnicos

### Script: `backend-parquet/start-backend.ps1`
- Detecta automaticamente o venv
- Usa `D:\Projetos\Arker CRM\.venv\Scripts\python.exe`
- Cria `.env` se necessário
- Inicia o servidor FastAPI

### Script: `package.json`
```json
{
  "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
  "dev:frontend": "next dev",
  "dev:backend": "cd backend-parquet && powershell -ExecutionPolicy Bypass -File ./start-backend.ps1"
}
```

---

## ⚠️ Problemas Comuns

### "Porta 5000 já em uso"

**Causa:** Outro processo usando a porta 5000

**Solução:**
1. Encontre o processo:
   ```powershell
   netstat -ano | findstr :5000
   ```
2. Mate o processo:
   ```powershell
   taskkill /PID <numero_do_pid> /F
   ```

**Ou altere a porta** em `backend-parquet/.env`:
```
PORT=5001
```

### "Porta 3000 já em uso"

**Solução:** Edite `.env.local`:
```
PORT=3001
```

---

## 🛑 Como Parar

Pressione **`Ctrl+C`** no terminal. O `concurrently` para ambos os processos automaticamente.

---

## 📺 O que você verá no terminal:

```
========================================
   Arker CRM - Iniciando Full Stack
========================================

[NEXT] ▲ Next.js 14.1.0
[NEXT] - Local: http://localhost:3000
[PYTHON] Iniciando Backend FastAPI...
[PYTHON] Usando Python do venv (.venv)
[PYTHON] Servidor iniciando na porta 5000...
[PYTHON] INFO: Uvicorn running on http://0.0.0.0:5000
```

---

## ✅ Tudo Funcionando!

**Agora você pode:**
- ✅ Desenvolver frontend e backend simultaneamente
- ✅ Ver logs de ambos em um único terminal
- ✅ Parar tudo com um único Ctrl+C
- ✅ Ter certeza que o venv está sendo usado

---

**Desenvolvido com ❤️ para o Arker CRM**

🚀 **Happy Coding!**
