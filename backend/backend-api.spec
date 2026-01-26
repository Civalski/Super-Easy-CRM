# -*- mode: python ; coding: utf-8 -*-
# ============================================================================
# PyInstaller Spec - Arker CRM Backend API
# ============================================================================
# Compila o backend FastAPI em um executável standalone
# ============================================================================

import sys
from pathlib import Path

# Diretório do backend
backend_dir = Path(SPECPATH)

a = Analysis(
    ['main.py'],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=[
        # Incluir arquivo .env se existir
        ('.env', '.') if (backend_dir / '.env').exists() else ('.env.example', '.'),
    ],
    hiddenimports=[
        # FastAPI e dependências
        'fastapi',
        'fastapi.middleware',
        'fastapi.middleware.cors',
        'starlette',
        'starlette.middleware',
        'starlette.middleware.cors',
        'starlette.responses',
        'starlette.routing',
        'starlette.requests',
        
        # Uvicorn e servidor
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        
        # Pydantic
        'pydantic',
        'pydantic_settings',
        'pydantic.fields',
        'pydantic_core',
        
        # Data processing
        'pandas',
        'pyarrow',
        'pyarrow.parquet',
        'openpyxl',
        
        # Python standard
        'email.mime.text',
        'multipart',
        'python_multipart',
        
        # App modules
        'app',
        'app.main',
        'app.api',
        'app.api.api',
        'app.api.endpoints',
        'app.api.endpoints.leads',
        'app.api.endpoints.system',
        'app.core',
        'app.core.config',
        'app.services',
        'app.services.filters',
        'app.services.parquet_reader',
        'app.dependencies',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'matplotlib',
        'scipy',
        'PIL',
        'IPython',
        'jupyter',
    ],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='backend-api',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # True para ver logs, False para esconder console
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Pode adicionar ícone aqui
)
