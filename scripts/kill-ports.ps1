# Script para limpar portas usadas pelo Next.js no desenvolvimento
# (evita "Another next dev server is already running" quando sobrou um dev em outra porta, ex.: 3010)

$ports = @(3000, 3001, 3010)

Write-Host "Limpando portas do projeto Arker CRM..." -ForegroundColor Yellow

foreach ($port in $ports) {
    Write-Host "Verificando porta $port..." -ForegroundColor Cyan

    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    $pids = @(
        $connections |
        Select-Object -ExpandProperty OwningProcess -Unique |
        Where-Object { $_ -gt 4 }
    )

    if ($pids.Count -eq 0) {
        Write-Host "  Porta $port esta livre" -ForegroundColor Green
    } else {
        foreach ($procId in $pids) {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if (-not $proc) {
                continue
            }

            Write-Host "  Matando processo $($proc.Name) (PID: $($proc.Id)) na porta $port" -ForegroundColor Red
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

Start-Sleep -Milliseconds 800

$stillBusy = @()
foreach ($port in $ports) {
    $remaining = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($remaining) {
        $stillBusy += $port
    }
}

if ($stillBusy.Count -gt 0) {
    Write-Host ("  Aviso: ainda existe processo escutando nas portas: " + ($stillBusy -join ", ")) -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Portas liberadas. Iniciando o Next.js..." -ForegroundColor Green
}
