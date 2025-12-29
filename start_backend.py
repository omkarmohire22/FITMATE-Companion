#!/usr/bin/env python3
"""Start the FastAPI backend"""
import subprocess
import sys
import os

os.chdir('C:\\Users\\omkar\\Documents\\FitMate\\backend')

try:
    subprocess.run([sys.executable, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], check=True)
except KeyboardInterrupt:
    print("\nBackend stopped")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
