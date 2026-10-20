"""Training script for phishing detection model."""

import pandas as pd
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

from .dataset import load_dataset
from .features import extract_features
from .model import PhishingModel


def train_and_evaluate(test_size: float = 0.2, random_state: int = 42):
    """Train model and print evaluation metrics."""
    print("Loading dataset...")
    df = load_dataset()
    
    print(f"Dataset shape: {df.shape}")
    print(f"Class distribution: {df['label'].value_counts().to_dict()}")
    
    # Extract features
    print("\nExtracting features...")
    feature_rows = [extract_features(url) for url in df['url'].tolist()]
    X = pd.DataFrame(feature_rows)
    y = df['label']
    
    print(f"Feature matrix shape: {X.shape}")
    print(f"Features: {list(X.columns)}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    # Train model
    print("\nTraining Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        random_state=random_state,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    print(f"\n=== Evaluation Metrics ===")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Safe', 'Phishing']))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    return model, X.columns.tolist(), {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }


def main():
    """Main training pipeline."""
    model, feature_names, metrics = train_and_evaluate()
    
    # Save model using PhishingModel wrapper
    model_dir = Path(__file__).parent
    model_path = model_dir / 'phishing_model.joblib'
    
    phishing_model = PhishingModel()
    phishing_model.model = model
    phishing_model.feature_names = feature_names
    phishing_model.save(str(model_path))
    
    print(f"\nModel saved to {model_path}")
    
    # Test predictions
    print("\n=== Test Predictions ===")
    test_urls = [
        'https://www.google.com',
        'http://paypal-verify.info/login.php?secure=1',
        'https://www.amazon.com/product/123',
        'http://bankofamerica-secure.net/update-info?token=abc123',
        'https://github.com/user/repo',
    ]
    
    for url in test_urls:
        label, confidence = phishing_model.predict(url)
        print(f"{url[:60]:60s} -> {label:8s} ({confidence:.2%})")
    
    return metrics


if __name__ == '__main__':
    main()