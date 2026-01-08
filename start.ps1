# ========================================
#   Arker CRM - Full Stack Starter
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Arker CRM - Iniciando Full Stack" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciando Frontend (Next.js) e Backend (Python)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Frontend: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host "Backend API: " -NoNewline
Write-Host "http://localhost:5000" -ForegroundColor Green
Write-Host "API Docs: " -NoNewline
Write-Host "http://localhost:5000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione Ctrl+C para parar todos os serviços" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar usando npm run dev que agora usa concurrently
npm run dev
