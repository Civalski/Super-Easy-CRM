import uvicorn
import os

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    # Determine if reload should be enabled (default false for production)
    reload_flag = os.getenv("UVICORN_RELOAD", "false").lower() == "true"
    # Rodar servidor uvicorn apontando para app.main:app
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=reload_flag)
