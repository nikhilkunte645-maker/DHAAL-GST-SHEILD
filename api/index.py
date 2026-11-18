import sys
import os

# Add root and backend directories to python path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "backend"))

# Directly import the FastAPI app instance from backend.main
from backend.main import app
