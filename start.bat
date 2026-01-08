@echo off
REM ========================================
REM   Arker CRM - Full Stack Starter
REM ========================================
echo.
echo ========================================
echo   Arker CRM - Iniciando Full Stack
echo ========================================
echo.
echo Iniciando Frontend (Next.js) e Backend (Python)...
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo API Docs: http://localhost:5000/docs
echo.
echo Pressione Ctrl+C para parar todos os servicos
echo ========================================
echo.

REM Iniciar usando npm run dev que agora usa concurrently
npm run dev
