@echo off
REM Script para iniciar o backend FastAPI

echo ========================================
echo   Arker CRM - Backend Parquet API
echo ========================================
echo.

REM Verificar se o arquivo .env existe
if not exist .env (
    echo Criando arquivo .env...
    copy .env.example .env
    echo.
)

echo Iniciando API FastAPI na porta 5000...
echo.
echo Acesse:
echo   - API: http://localhost:5000
echo   - Docs: http://localhost:5000/docs
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

python main.py
