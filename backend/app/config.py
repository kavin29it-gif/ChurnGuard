from pathlib import Path
import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Artifact directory: check env var, then fallback to backend/artifacts or ./artifacts
env_artifact_dir = os.getenv("ARTIFACT_DIR", "./artifacts")
candidate_path = Path(env_artifact_dir)
if candidate_path.is_absolute() and candidate_path.exists():
    ARTIFACT_DIR = candidate_path
elif (BASE_DIR / env_artifact_dir).exists():
    ARTIFACT_DIR = (BASE_DIR / env_artifact_dir).resolve()
elif Path(env_artifact_dir).exists():
    ARTIFACT_DIR = Path(env_artifact_dir).resolve()
else:
    ARTIFACT_DIR = (BASE_DIR / "artifacts").resolve()

# Allowed origins
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS: List[str] = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

PORT: int = int(os.getenv("PORT", "8000"))
