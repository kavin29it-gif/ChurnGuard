from pathlib import Path
import json
from typing import Dict, Any

_REFERENCE_STATS: Dict[str, Dict[str, float]] = {}

def load_reference_stats(artifact_dir: Path) -> Dict[str, Dict[str, float]]:
    global _REFERENCE_STATS
    path = artifact_dir / "reference_stats.json"
    if not path.exists():
        raise FileNotFoundError(f"reference_stats.json not found at {path}")
    with open(path, "r", encoding="utf-8") as f:
        _REFERENCE_STATS = json.load(f)
    return _REFERENCE_STATS

def get_reference_stats() -> Dict[str, Dict[str, float]]:
    return _REFERENCE_STATS
