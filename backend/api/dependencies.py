"""Model dependency loader for FastAPI."""

from functools import lru_cache
from pathlib import Path
from typing import Tuple

from backend.ml.model import PhishingModel


@lru_cache(maxsize=1)
def load_phishing_model():
    """Load ML model as singleton."""
    model_path = Path(__file__).parent.parent / "ml" / "phishing_model.joblib"
    
    if not model_path.exists():
        raise RuntimeError(f"Model file not found at {model_path}. Train model first.")
    
    print(f"Loading phishing model from {model_path}...")
    model = PhishingModel.load(str(model_path))
    print(f"Model loaded successfully: {len(model.feature_names)} features, {model.model.n_estimators} estimators.")
    return model
