"""Prediction module for loading trained phishing detection model."""

import joblib
from pathlib import Path
from typing import Tuple, Dict
import pandas as pd

from .features import extract_features


def load_model(model_path: str = None):
    """Load trained model from joblib file."""
    if model_path is None:
        model_path = Path(__file__).parent / 'phishing_model.joblib'
    
    model_path = Path(model_path)
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found at {model_path}")
    
    model_data = joblib.load(model_path)
    
    # Support both old and new format
    if isinstance(model_data, dict):
        model = model_data['model']
        feature_names = model_data['feature_names']
    else:
        model = model_data
        feature_names = None
    
    return model, feature_names


def predict_url(url: str, model_path: str = None) -> Dict:
    """
    Predict if a URL is phishing or safe.
    
    Returns dict with label, confidence, and features.
    """
    model, feature_names = load_model(model_path)
    
    # Extract features
    features = extract_features(url)
    
    # Create dataframe
    X = pd.DataFrame([features])
    
    # Ensure correct feature order
    if feature_names:
        # Add missing features with 0
        for name in feature_names:
            if name not in X.columns:
                X[name] = 0
        X = X[feature_names]
    
    # Predict
    prediction = model.predict(X)[0]
    probabilities = model.predict_proba(X)[0]
    
    label = 'phishing' if prediction == 1 else 'safe'
    confidence = float(max(probabilities))
    
    return {
        'url': url,
        'label': label,
        'prediction': int(prediction),
        'confidence': confidence,
        'probabilities': {
            'safe': float(probabilities[0]),
            'phishing': float(probabilities[1])
        },
        'features': features
    }


def predict_batch(urls: list, model_path: str = None) -> list:
    """Predict for a batch of URLs."""
    return [predict_url(url, model_path) for url in urls]


if __name__ == '__main__':
    # Quick test
    test_urls = [
        'https://www.google.com',
        'http://paypa1.com-login.com',
        'https://www.facebook.com/login',
        'http://secure-apple-id-verify.xyz/reset-password'
    ]
    
    print("Loading model...")
    try:
        for url in test_urls:
            result = predict_url(url)
            print(f"\n{url}")
            print(f"  Label: {result['label']}")
            print(f"  Confidence: {result['confidence']:.2%}")
            print(f"  Probabilities: safe={result['probabilities']['safe']:.2%}, phishing={result['probabilities']['phishing']:.2%}")
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("Train the model first by running: python -m backend.ml.train")
