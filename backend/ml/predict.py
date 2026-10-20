"""Prediction module for loading trained phishing detection model."""

import json
from pathlib import Path
from typing import Dict, List

import joblib
import pandas as pd

from .features import extract_features, FEATURE_ORDER


def load_model(model_path: str = None):
    """Load trained model from joblib file for external use."""
    if model_path is None:
        model_path = Path(__file__).parent / 'phishing_model.joblib'

    model_path = Path(model_path)
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found at {model_path}")

    model_data = joblib.load(model_path)

    if isinstance(model_data, dict):
        return model_data.get('model')
    return model_data


def load_model_info(model_path: str = None) -> Dict:
    """Load model and return metadata."""
    if model_path is None:
        model_path = Path(__file__).parent / 'phishing_model.joblib'

    model_path = Path(model_path)
    if not model_path.exists():
        return {"error": f"Model file not found at {model_path}"}

    try:
        model_data = joblib.load(model_path)

        if isinstance(model_data, dict):
            model = model_data.get('model')
            feature_names = model_data.get('feature_names', [])
        else:
            model = model_data
            feature_names = list(getattr(model, 'feature_names_in_', FEATURE_ORDER))

        n_features = model.n_features_in_ if hasattr(model, 'n_features_in_') else 'unknown'
        n_estimators = model.n_estimators if hasattr(model, 'n_estimators') else 'unknown'

        return {
            "model_type": type(model).__name__,
            "n_estimators": n_estimators,
            "n_features": n_features,
            "feature_names": feature_names,
            "model_path": str(model_path)
        }
    except Exception as e:
        return {"error": str(e)}


def predict_url(url: str, model_path: str = None) -> Dict:
    """
    Predict if a URL is phishing or safe.

    Returns dict with:
    - classification: 'safe' or 'malicious'
    - risk_score: 0-100
    - model_probability: probability of phishing
    - probabilities: per-class probabilities
    """
    model_info = load_model_info(model_path)
    if "error" in model_info:
        raise FileNotFoundError(model_info["error"])

    model_data = joblib.load(model_info["model_path"])
    model = model_data if not isinstance(model_data, dict) else model_data.get('model')
    feature_names = model_info.get("feature_names")

    # Extract features
    features = extract_features(url or '')
    X = pd.DataFrame([features])

    # Ensure feature order
    if feature_names:
        for name in feature_names:
            if name not in X.columns:
                X[name] = 0
        X = X[feature_names]
    else:
        X = X[FEATURE_ORDER]

    # Predict
    prediction = model.predict(X)[0]
    probabilities = model.predict_proba(X)[0]

    prob_phishing = float(probabilities[1])
    prob_legitimate = float(probabilities[0])

    # Classification: 1 = phishing, 0 = legitimate
    classification = "malicious" if prediction == 1 else "safe"
    risk_score = int(prob_phishing * 100)

    return {
        "url": url,
        "classification": classification,
        "risk_score": risk_score,
        "model_probability": prob_phishing,
        "probabilities": {
            "legitimate": prob_legitimate,
            "phishing": prob_phishing
        },
        "features": features
    }


def predict_batch(urls: list, model_path: str = None) -> list:
    """Predict for a batch of URLs."""
    return [predict_url(url, model_path) for url in urls]


if __name__ == '__main__':
    # Quick test
    model_info = load_model_info()
    print(f"Model info: {json.dumps(model_info, indent=2)}")

    test_urls = [
        'https://www.google.com',
        'http://paypa1-login.com/verify',
        'https://www.facebook.com/login',
        'http://192.168.1.1/admin',
        '',  # Empty URL
        'not-a-url'  # Invalid URL
    ]

    print("\nTest predictions:")
    for url in test_urls:
        try:
            result = predict_url(url)
            print(f"  {url[:50]:50} -> {result['classification']} (risk: {result['risk_score']})")
        except Exception as e:
            print(f"  {url[:50]:50} -> ERROR: {e}")