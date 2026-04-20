# Inicia o Next em dev: limpa portas e garante .next no repo (sem junction).
#
# O script ensure-next-cache-junction.ps1 redireciona .next para %LOCALAPPDATA%.
# Isso quebra a resolucao de pacotes nos bundles do servidor:
# - require() pode ser contornado com NODE_PATH, mas import ESM (ex.: pg) nao.
# Em dev, .next precisa ficar sob o repo para o Node achar node_modules.

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $repoRoot

function Test-IsJunction([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    $item = Get-Item -LiteralPath $Path -Force
    return [bool]($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)
}

& (Join-Path $PSScriptRoot 'kill-ports.ps1')

$linkPath = Join-Path $repoRoot '.next'
if (Test-IsJunction $linkPath) {
    Write-Host '[arker] Removendo junction .next -> cache em AppData (dev precisa de .next local).' -ForegroundColor DarkCyan
    cmd.exe /c "rmdir `"$linkPath`""
    if ($LASTEXITCODE -ne 0) {
        Write-Host '[arker] Nao foi possivel remover o junction .next (feche o dev server e tente de novo).' -ForegroundColor Yellow
        exit 1
    }
}

$nodeModules = Join-Path $repoRoot 'node_modules'
if (-not (Test-Path -LiteralPath $nodeModules)) {
    Write-Host '[arker] node_modules nao encontrado. Execute npm install.' -ForegroundColor Red
    exit 1
}

npx next dev --webpack
