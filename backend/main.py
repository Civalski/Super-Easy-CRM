import uvicorn
import os

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    # Rodar servidor uvicorn apontando para app.main:app
    # reload=True habilita hot-reload durante desenvolvimento
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
