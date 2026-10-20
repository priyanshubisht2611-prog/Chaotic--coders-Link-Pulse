from pathlib import Path
from typing import List, Tuple

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

from .features import extract_features
from .dataset import load_dataset


class PhishingModel:
    """Random Forest model for phishing URL detection."""

    def __init__(self):
        self.model = None
        self.feature_names = None

    def train(self, df: pd.DataFrame, test_size: float = 0.2, random_state: int = 42):
        """Train the Random Forest model."""
        X = df.drop(columns=['label'])
        y = df['label']
        
        self.feature_names = X.columns.tolist()
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Model Accuracy: {accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        print("\nConfusion Matrix:")
        print(confusion_matrix(y_test, y_pred))
        
        return accuracy

    def predict(self, url: str) -> Tuple[str, float]:
        """Predict if a URL is phishing or not."""
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        features = extract_features(url)
        X = pd.DataFrame([features])
        
        # Ensure feature order
        X = X[self.feature_names]
        
        proba = self.model.predict_proba(X)[0]
        prediction = self.model.predict(X)[0]
        
        # Convert to labels
        label = 'phishing' if prediction == 1 else 'safe'
        confidence = float(max(proba))
        
        return label, confidence

    def save(self, filepath: str):
        """Save model to file."""
        if self.model is None:
            raise ValueError("No model to save")
        
        model_data = {
            'model': self.model,
            'feature_names': self.feature_names
        }
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")

    @classmethod
    def load(cls, filepath: str) -> 'PhishingModel':
        """Load model from file."""
        model_data = joblib.load(filepath)
        instance = cls()
        instance.model = model_data['model']
        instance.feature_names = model_data['feature_names']
        return instance


def main():
    """Train and save model."""
    print("Loading dataset...")
    df = load_dataset()
    
    print("Preprocessing data...")
    # Extract features from URLs
    urls = df['url'].tolist()
    feature_rows = [extract_features(url) for url in urls]
    X = pd.DataFrame(feature_rows)
    X['label'] = df['label']
    
    print(f"Dataset shape: {X.shape}")
    print(f"Class distribution: {X['label'].value_counts().to_dict()}")
    
    model = PhishingModel()
    print("\nTraining model...")
    accuracy = model.train(X)
    
    print("\nSaving model...")
    model_dir = Path(__file__).parent
    model_path = model_dir / 'phishing_model.joblib'
    model.save(str(model_path))
    
    # Test prediction
    print("\nTesting prediction...")
    test_urls = [
        'https://www.google.com',
        'http://paypa1.com-login.com'
    ]
    
    for url in test_urls:
        label, confidence = model.predict(url)
        print(f"{url}: {label} ({confidence:.2%})")


if __name__ == '__main__':
    main()