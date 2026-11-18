import sys
import os
from fastapi import FastAPI

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "backend"))

try:
    from backend.main import app as original_app
    app = FastAPI()
    app.mount("/api", original_app)
except Exception as e:
    app = FastAPI()
    @app.get("/api/{path:path}")
    def fallback_error(path: str):
        return {"error": "Backend failed to load", "details": str(e)}
