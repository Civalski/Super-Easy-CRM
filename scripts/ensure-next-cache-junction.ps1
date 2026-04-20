# Redireciona .next do projeto para %LOCALAPPDATA%\ArkerEasyCRM-next-cache (junction).
# Evita o aviso "Slow filesystem" do Next quando o repo esta em disco lento/rede (ex.: D:\Backup).
# Nao use isso com `next dev`: bundles em AppData quebram import ESM (ex.: pg). Dev usa .next local via dev-frontend.ps1.

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$linkPath = Join-Path $repoRoot '.next'
$targetPath = Join-Path $env:LOCALAPPDATA 'ArkerEasyCRM-next-cache'

function Test-IsJunction([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    $item = Get-Item -LiteralPath $Path -Force
    return [bool]($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)
}

if (Test-IsJunction $linkPath) {
    exit 0
}

$renamedBackup = $null
if (Test-Path -LiteralPath $linkPath) {
    $renamedBackup = '.next.arker-relocated-' + (Get-Date -Format 'yyyyMMddHHmmss')
    try {
        Rename-Item -LiteralPath $linkPath -NewName $renamedBackup -ErrorAction Stop
    }
    catch {
        Write-Host ('[arker] Nao foi possivel renomear .next (feche o dev server e tente de novo): ' + $_) -ForegroundColor Yellow
        exit 0
    }
    Write-Host ('[arker] Pasta .next antiga renomeada para ' + $renamedBackup + ' - pode apagar depois de um build ok.') -ForegroundColor DarkCyan
}

if (-not (Test-Path -LiteralPath $targetPath)) {
    New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
}

cmd.exe /c "mklink /J `"$linkPath`" `"$targetPath`"" | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host ('[arker] mklink falhou (codigo ' + $LASTEXITCODE + '). Dev usa .next no projeto.') -ForegroundColor Yellow
    if ($null -ne $renamedBackup) {
        $backupFull = Join-Path $repoRoot $renamedBackup
        if ((Test-Path -LiteralPath $backupFull) -and -not (Test-Path -LiteralPath $linkPath)) {
            Rename-Item -LiteralPath $backupFull -NewName '.next' -ErrorAction SilentlyContinue
        }
    }
}
