# ============================================================================
# BUILD BACKEND - Script para compilar o backend Python com PyInstaller
# ============================================================================
# Gera: dist-python/backend-api.exe
# ============================================================================

param(
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"

# Cores para output
function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "[!] $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "[X] $msg" -ForegroundColor Red }

# Navegar para raiz do projeto
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "   ARKER CRM - Build Backend Python" -ForegroundColor Magenta  
Write-Host "============================================" -ForegroundColor Magenta

# ------------------------------------------
# 1. Verificar venv Python
# ------------------------------------------
Write-Step "Verificando ambiente Python..."

$venvPath = Join-Path $projectRoot ".venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"
$venvPip = Join-Path $venvPath "Scripts\pip.exe"

if (!(Test-Path $venvPython)) {
    Write-Error "Virtual environment nao encontrado em: $venvPath"
    Write-Host "Execute: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}
Write-Success "venv encontrado"

# ------------------------------------------
# 2. Instalar PyInstaller se necessario
# ------------------------------------------
Write-Step "Verificando PyInstaller..."

$pyinstallerCheck = & $venvPython -c "import PyInstaller; print('ok')" 2>&1
if ($pyinstallerCheck -ne "ok") {
    Write-Warning "PyInstaller nao encontrado, instalando..."
    & $venvPip install pyinstaller
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao instalar PyInstaller"
        exit 1
    }
}
Write-Success "PyInstaller disponivel"

# ------------------------------------------
# 3. Limpar builds anteriores (se -Clean)
# ------------------------------------------
if ($Clean) {
    Write-Step "Limpando builds anteriores..."
    
    $foldersToClean = @(
        (Join-Path $projectRoot "dist-python"),
        (Join-Path $projectRoot "backend\build"),
        (Join-Path $projectRoot "backend\dist")
    )
    
    foreach ($folder in $foldersToClean) {
        if (Test-Path $folder) {
            Remove-Item -Recurse -Force $folder
            Write-Host "  Removido: $folder"
        }
    }
    Write-Success "Limpeza concluida"
}

# ------------------------------------------
# 4. Compilar com PyInstaller
# ------------------------------------------
Write-Step "Compilando backend com PyInstaller..."

$backendDir = Join-Path $projectRoot "backend"
$specFile = Join-Path $backendDir "backend-api.spec"
$pyinstaller = Join-Path $venvPath "Scripts\pyinstaller.exe"

Set-Location $backendDir

# Executar PyInstaller
& $pyinstaller --clean --noconfirm $specFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha na compilacao do PyInstaller"
    exit 1
}

Write-Success "Compilacao concluida"

# ------------------------------------------
# 5. Mover executable para dist-python
# ------------------------------------------
Write-Step "Movendo executavel..."

$sourceExe = Join-Path $backendDir "dist\backend-api.exe"
$destDir = Join-Path $projectRoot "dist-python"
$destExe = Join-Path $destDir "backend-api.exe"

if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

if (Test-Path $sourceExe) {
    Copy-Item $sourceExe $destExe -Force
    Write-Success "Executavel copiado para: $destExe"
    
    # Mostrar tamanho
    $size = (Get-Item $destExe).Length / 1MB
    Write-Host "  Tamanho: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
} else {
    Write-Error "Executavel nao encontrado em: $sourceExe"
    exit 1
}

# ------------------------------------------
# 6. Limpar arquivos temporarios
# ------------------------------------------
Write-Step "Limpando arquivos temporarios..."

$tempFolders = @(
    (Join-Path $backendDir "build"),
    (Join-Path $backendDir "dist")
)

foreach ($folder in $tempFolders) {
    if (Test-Path $folder) {
        Remove-Item -Recurse -Force $folder
    }
}
Write-Success "Limpeza concluida"

# ------------------------------------------
# Finalizado
# ------------------------------------------
Set-Location $projectRoot

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   BUILD BACKEND CONCLUIDO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "Arquivo: dist-python\backend-api.exe" -ForegroundColor White
Write-Host ""
