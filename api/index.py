import sys
import os
from fastapi import FastAPI

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "backend"))

from backend.main import app as original_app

app = FastAPI()
app.mount("/api", original_app)
