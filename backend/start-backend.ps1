# Script de inicializacao do backend Python
# Usa o Python do venv e inicia o servidor FastAPI

# Garantir que estamos no diretorio correto
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Iniciando Backend FastAPI..." -ForegroundColor Cyan

# Definir caminho do Python no venv
$venvPython = Join-Path $scriptPath "..\\.venv\\Scripts\\python.exe"

# Verificar se o venv existe, senao usar python global
if (Test-Path $venvPython) {
    Write-Host "Usando Python do venv (.venv)" -ForegroundColor Green
    $pythonCmd = $venvPython
}
else {
    Write-Host "venv nao encontrado, usando Python global" -ForegroundColor Yellow
    $pythonCmd = "python"
}

# Verificar/criar arquivo .env
if (!(Test-Path .env)) {
    Write-Host "Criando arquivo .env..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "Arquivo .env criado!" -ForegroundColor Green
}

# Iniciar servidor
Write-Host "Servidor iniciando na porta 5000..." -ForegroundColor Green
& $pythonCmd main.py
