# ============================================================================
# BUILD ALL - Script Master para gerar o instalador do Arker CRM
# ============================================================================
# Este script executa todo o processo de build:
# 1. Compila backend Python -> dist-python/backend-api.exe
# 2. Build Next.js -> .next/standalone
# 3. Prepara standalone (copia public + static)
# 4. Gera instalador NSIS via Electron Builder
# ============================================================================

param(
    [switch]$SkipBackend = $false,
    [switch]$SkipFrontend = $false,
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date

# Cores para output
function Write-Step { param($msg) Write-Host "`n===============================================" -ForegroundColor Cyan; Write-Host "  $msg" -ForegroundColor Cyan; Write-Host "===============================================" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "[!] $msg" -ForegroundColor Yellow }
function Write-ErrorMsg { param($msg) Write-Host "[X] $msg" -ForegroundColor Red }

# Navegar para raiz do projeto
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

Write-Host ""
Write-Host "======================================================" -ForegroundColor Magenta
Write-Host "     ARKER CRM - BUILD COMPLETO DO INSTALADOR" -ForegroundColor Magenta
Write-Host "======================================================" -ForegroundColor Magenta
Write-Host "Diretorio: $projectRoot" -ForegroundColor Gray
Write-Host ""

# ------------------------------------------
# 0. Verificar pre-requisitos
# ------------------------------------------
Write-Step "Verificando pre-requisitos..."

# Node.js
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Node.js nao encontrado. Instale em https://nodejs.org"
    exit 1
}
Write-Success "Node.js: $nodeVersion"

# npm
$npmVersion = npm --version 2>&1
Write-Success "npm: $npmVersion"

# Python venv
$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"
if (!(Test-Path $venvPython)) {
    Write-ErrorMsg "Python venv nao encontrado em .venv"
    Write-Host "Execute: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}
Write-Success "Python venv: OK"

# node.exe standalone (para Electron)
$nodeExe = Join-Path $projectRoot "node.exe"
if (!(Test-Path $nodeExe)) {
    Write-Warning "node.exe nao encontrado na raiz"
    Write-Host "  Baixe de: https://nodejs.org/dist/v20.11.0/win-x64/node.exe" -ForegroundColor Gray
    Write-Host "  E coloque na raiz do projeto" -ForegroundColor Gray
}

# ------------------------------------------
# 1. Build Backend Python
# ------------------------------------------
if (!$SkipBackend) {
    Write-Step "ETAPA 1: Compilando Backend Python..."
    
    $buildBackendScript = Join-Path $projectRoot "scripts\build-backend.ps1"
    
    if ($Clean) {
        & powershell -ExecutionPolicy Bypass -File $buildBackendScript -Clean
    }
    else {
        & powershell -ExecutionPolicy Bypass -File $buildBackendScript
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Falha no build do backend"
        exit 1
    }
    
    # Verificar se executavel foi gerado
    $backendExe = Join-Path $projectRoot "dist-python\backend-api.exe"
    if (!(Test-Path $backendExe)) {
        Write-ErrorMsg "backend-api.exe nao foi gerado"
        exit 1
    }
    Write-Success "Backend compilado: dist-python\backend-api.exe"
}
else {
    Write-Warning "Pulando build do backend (-SkipBackend)"
}

# ------------------------------------------
# 2. Build Frontend Next.js
# ------------------------------------------
if (!$SkipFrontend) {
    Write-Step "ETAPA 2: Build do Next.js..."
    
    # Instalar dependencias se necessario
    if (!(Test-Path (Join-Path $projectRoot "node_modules"))) {
        Write-Host "Instalando dependencias npm..." -ForegroundColor Yellow
        npm install
    }
    
    # Build Next.js
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Falha no build do Next.js"
        exit 1
    }
    
    # Verificar se standalone foi gerado
    $standalonePath = Join-Path $projectRoot ".next\standalone"
    if (!(Test-Path $standalonePath)) {
        Write-ErrorMsg "Standalone nao foi gerado. Verifique next.config.js (output: 'standalone')"
        exit 1
    }
    Write-Success "Next.js build concluido"
}
else {
    Write-Warning "Pulando build do frontend (-SkipFrontend)"
}

# ------------------------------------------
# 3. Preparar Standalone
# ------------------------------------------
Write-Step "ETAPA 3: Preparando Standalone..."

$prepareScript = Join-Path $projectRoot "scripts\prepare-standalone.js"
node $prepareScript

if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Falha ao preparar standalone"
    exit 1
}
Write-Success "Standalone preparado"

# ------------------------------------------
# 4. Gerar Instalador com Electron Builder
# ------------------------------------------
Write-Step "ETAPA 4: Gerando Instalador NSIS..."

# Executar electron-builder
npx electron-builder --win

if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Falha ao gerar instalador"
    exit 1
}

# ------------------------------------------
# 5. Verificar resultado
# ------------------------------------------
Write-Step "Verificando resultado..."

$distDir = Join-Path $projectRoot "dist"
$installers = Get-ChildItem -Path $distDir -Filter "*.exe" | Where-Object { $_.Name -like "*Setup*" }

if ($installers.Count -eq 0) {
    Write-ErrorMsg "Nenhum instalador encontrado em dist/"
    exit 1
}

foreach ($installer in $installers) {
    $sizeMB = [math]::Round($installer.Length / 1MB, 2)
    Write-Success "Instalador gerado: $($installer.Name) ($sizeMB MB)"
}

# ------------------------------------------
# Finalizado
# ------------------------------------------
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "     BUILD CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tempo total: $([math]::Round($duration.TotalMinutes, 1)) minutos" -ForegroundColor White
Write-Host ""
Write-Host "Arquivos gerados:" -ForegroundColor White
Write-Host "  - dist-python\backend-api.exe" -ForegroundColor Gray
Write-Host "  - .next\standalone\" -ForegroundColor Gray

foreach ($installer in $installers) {
    Write-Host "  - dist\$($installer.Name)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "O instalador esta pronto para distribuicao!" -ForegroundColor Yellow
Write-Host ""
