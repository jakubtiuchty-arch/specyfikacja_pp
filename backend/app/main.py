from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from .api.routes import router
from .core.config import APP_NAME, DEBUG

# Ścieżki
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title=APP_NAME,
    description="System automatycznej analizy specyfikacji terminali mobilnych dla przetargów",
    version="1.0.0",
    debug=DEBUG
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR / "static")), name="static")

# Templates
templates = Jinja2Templates(directory=str(FRONTEND_DIR / "templates"))

# API routes
app.include_router(router, prefix="/api", tags=["API"])


@app.get("/")
async def root():
    """Strona główna - przekierowanie do interfejsu"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/app")


@app.get("/app")
async def web_app():
    """Interfejs webowy"""
    from fastapi.responses import HTMLResponse

    html_path = FRONTEND_DIR / "templates" / "index.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text(encoding='utf-8'))
    return HTMLResponse(content="<h1>Frontend nie znaleziony</h1>")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "app": APP_NAME}
