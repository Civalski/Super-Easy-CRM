# Arker CRM - Guia de Build e Distribuição

## Pré-requisitos

Antes de gerar o instalador, certifique-se de ter:

1. **Node.js** v18+ instalado
2. **Python 3.11+** com venv configurado em `.venv`
3. **node.exe** standalone na raiz do projeto (para Electron)
   - Baixe de: https://nodejs.org/dist/v20.11.0/win-x64/node.exe

## Estrutura do Instalador

O instalador gerado (~200MB) contém:
- ✅ Frontend Next.js (standalone)
- ✅ Backend Python (compilado)
- ✅ Electron App
- ✅ Schema Prisma (SQLite)
- ❌ Dados Parquet (baixados separadamente do Google Drive)

## Como Gerar o Instalador

### Opção 1: Script Completo (Recomendado)

Execute o script master que faz todo o processo:

```powershell
cd "d:\Projetos\Arker CRM"
.\scripts\build-all.ps1
```

Ou via npm:

```powershell
npm run build:dist
```

### Opção 2: Build Parcial

Se você já tem o backend compilado e quer apenas atualizar o frontend:

```powershell
.\scripts\build-all.ps1 -SkipBackend
```

Se você quer fazer build limpo (remove arquivos antigos):

```powershell
.\scripts\build-all.ps1 -Clean
```

### Opção 3: Build Manual

1. **Compilar Backend Python:**
   ```powershell
   .\scripts\build-backend.ps1
   ```

2. **Build Next.js:**
   ```powershell
   npm run build
   ```

3. **Preparar Standalone:**
   ```powershell
   node scripts/prepare-standalone.js
   ```

4. **Gerar Instalador:**
   ```powershell
   npx electron-builder --win
   ```

## Resultado

Após o build, você encontrará:

```
dist/
├── Arker CRM Setup 0.1.0.exe    ← Instalador para distribuir
├── Arker CRM Setup 0.1.0.exe.blockmap
├── latest.yml
└── win-unpacked/                 ← Versão descompactada
```

## Instalação pelo Usuário Final

1. Execute o instalador `Arker CRM Setup X.X.X.exe`
2. Escolha a pasta de instalação (ou use o padrão)
3. O sistema será instalado com atalhos na área de trabalho e menu iniciar
4. **Importante:** Os dados Parquet devem ser baixados separadamente do Google Drive

## Estrutura de Dados

O sistema espera encontrar os dados Parquet em:

- **Desenvolvimento:** `./data/parquet/`
- **Produção:** `%APPDATA%/ArkerCRM/Dados/`

## Atualizando Versão

Antes de gerar uma nova versão:

1. Atualize a versão no `package.json`
2. Atualize o `version.json` se estiver usando verificação de atualização
3. Execute o build completo

## Troubleshooting

### PyInstaller falha
- Verifique se o venv está ativo
- Instale PyInstaller: `.venv\Scripts\pip.exe install pyinstaller`

### Next.js build falha
- Verifique erros TypeScript: `npm run lint`
- Verifique se `next.config.js` tem `output: 'standalone'`

### Electron Builder falha
- Verifique se `node.exe` existe na raiz
- Verifique se `dist-python/backend-api.exe` existe
- Verifique se `.next/standalone` existe
