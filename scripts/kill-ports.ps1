# Script para limpar porta usada pelo Next.js no desenvolvimento

Write-Host "Limpando portas do projeto Arker CRM..." -ForegroundColor Yellow
Write-Host "Verificando porta 3000..." -ForegroundColor Cyan

# Considera apenas processo escutando na porta (evita conexoes antigas/TIME_WAIT)
$connections = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$pids = @(
    $connections |
    Select-Object -ExpandProperty OwningProcess -Unique |
    Where-Object { $_ -gt 4 }
)

if ($pids.Count -eq 0) {
    Write-Host "  Porta 3000 esta livre" -ForegroundColor Green
} else {
    foreach ($pid in $pids) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if (-not $proc) {
            continue
        }

        Write-Host "  Matando processo $($proc.Name) (PID: $($proc.Id)) na porta 3000" -ForegroundColor Red
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Milliseconds 800

$remaining = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($remaining) {
    Write-Host "  Aviso: ainda existe processo escutando na porta 3000" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Porta 3000 liberada. Iniciando o Next.js..." -ForegroundColor Green
}
