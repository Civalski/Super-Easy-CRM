# Script para limpar portas usadas pelo projeto
# Mata processos na porta 3000 (Next.js)

Write-Host "🔄 Limpando portas do projeto Arker CRM..." -ForegroundColor Yellow

# Tentar liberar porta 3000 especificamente (Next.js)
Write-Host "Verificando porta 3000..." -ForegroundColor Cyan
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    foreach ($conn in $port3000) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  Matando processo $($proc.Name) (PID: $($proc.Id)) na porta 3000" -ForegroundColor Red
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
} else {
    Write-Host "  Porta 3000 está livre" -ForegroundColor Green
}

# Aguardar um pouco para a porta ser liberada
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ Portas limpas! Agora execute: npm run dev" -ForegroundColor Green

