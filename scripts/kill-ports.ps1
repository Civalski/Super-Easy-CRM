# Script para limpar todas as portas usadas pelo projeto
# Mata processos Node.js (porta 3000) e Python (porta 5000)

Write-Host "🔄 Limpando portas do projeto Arker CRM..." -ForegroundColor Yellow

# Matar todos os processos Node.js
Write-Host "Parando processos Node.js..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Matar todos os processos Python
Write-Host "Parando processos Python..." -ForegroundColor Cyan
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process pythonw -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

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

# Tentar liberar porta 5000 especificamente (Python/FastAPI)
Write-Host "Verificando porta 5000..." -ForegroundColor Cyan
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($port5000) {
    foreach ($conn in $port5000) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  Matando processo $($proc.Name) (PID: $($proc.Id)) na porta 5000" -ForegroundColor Red
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
} else {
    Write-Host "  Porta 5000 está livre" -ForegroundColor Green
}

# Aguardar um pouco para as portas serem liberadas
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ Portas limpas! Agora execute: npm run dev" -ForegroundColor Green
