"""Unit tests for ML phishing detection engine."""

import pytest
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from ml.features import extract_features
from ml.dataset import load_dataset, _generate_synthetic_urls
from ml.predict import predict_url, load_model
from ml.model import PhishingModel


class TestFeatureExtraction:
    """Tests for URL feature extraction."""
    
    def test_extract_features_basic(self):
        """Test basic feature extraction."""
        url = "https://www.google.com/search?q=test"
        features = extract_features(url)
        
        assert isinstance(features, dict)
        assert 'url_length' in features
        assert 'uses_https' in features
        assert 'dot_count' in features
        assert features['uses_https'] == 1.0
        assert features['url_length'] > 0
    
    def test_extract_features_http(self):
        """Test feature extraction for HTTP URL."""
        url = "http://example.com"
        features = extract_features(url)
        
        assert features['uses_https'] == 0.0
    
    def test_extract_features_phishing_indicators(self):
        """Test detection of phishing indicators."""
        url = "http://google-secure.xyz/login.php?token=123&session=abc"
        features = extract_features(url)
        
        assert 'has_suspicious_keyword' in features
        assert features['uses_https'] == 0.0
    
    def test_extract_features_ip_address(self):
        """Test IP address detection."""
        url = "http://192.168.1.1/login"
        features = extract_features(url)
        
        assert features['is_ip_address'] == 1.0
    
    def test_extract_features_special_chars(self):
        """Test special character counting."""
        url = "http://example.com/path?param=value&other=123@test"
        features = extract_features(url)
        
        assert 'special_char_ratio' in features
        assert features['at_count'] == 1.0
    
    def test_extract_features_consistency(self):
        """Test feature extraction is deterministic."""
        url = "https://www.example.com/test"
        features1 = extract_features(url)
        features2 = extract_features(url)
        
        assert features1 == features2


class TestDataset:
    """Tests for dataset loading."""
    
    def test_load_dataset_returns_dataframe(self):
        """Test dataset loading returns DataFrame."""
        df = load_dataset()
        
        import pandas as pd
        assert isinstance(df, pd.DataFrame)
        assert 'url' in df.columns
        assert 'label' in df.columns
    
    def test_dataset_has_both_classes(self):
        """Test dataset contains both safe and phishing URLs."""
        df = load_dataset()
        
        assert 0 in df['label'].values
        assert 1 in df['label'].values
    
    def test_generate_synthetic_urls(self):
        """Test synthetic URL generation."""
        df = _generate_synthetic_urls(n_samples=100, random_state=42)
        
        assert len(df) == 100
        assert df['label'].sum() == 50  # Half phishing
        assert (df['label'] == 0).sum() == 50  # Half safe
    
    def test_dataset_urls_valid(self):
        """Test all URLs start with http."""
        df = load_dataset()
        
        for url in df['url'].head(100):
            assert str(url).startswith('http')


class TestModel:
    """Tests for model training and prediction."""
    
    @pytest.fixture(scope='class')
    def trained_model(self):
        """Train a model for testing."""
        from ml.train import train_and_evaluate
        
        # Train a small model for speed
        model, feature_names, metrics = train_and_evaluate(test_size=0.2, random_state=42)
        
        phishing_model = PhishingModel()
        phishing_model.model = model
        phishing_model.feature_names = feature_names
        
        return phishing_model, metrics
    
    def test_model_predict_safe_url(self, trained_model):
        """Test prediction for safe URL."""
        model, _ = trained_model
        result = model.predict('https://www.google.com')
        
        assert result['classification'] in ['safe', 'malicious']
        assert 0.0 <= result['model_probability'] <= 1.0
    
    def test_model_predict_phishing_url(self, trained_model):
        """Test prediction for obvious phishing URL."""
        model, _ = trained_model
        result = model.predict('http://google-secure.xyz/login?token=123')
        
        assert result['classification'] in ['safe', 'malicious']
        assert 0.0 <= result['model_probability'] <= 1.0
    
    def test_model_save_load(self, trained_model, tmp_path):
        """Test model save and load."""
        model, _ = trained_model
        model_path = tmp_path / "test_model.joblib"
        
        # Save
        model.save(str(model_path))
        assert model_path.exists()
        
        # Load
        loaded_model = PhishingModel.load(str(model_path))
        assert loaded_model.model is not None
        assert loaded_model.feature_names is not None
        
        # Predictions should match
        url = 'https://www.github.com'
        res1 = model.predict(url)
        res2 = loaded_model.predict(url)
        
        assert res1['classification'] == res2['classification']
        assert res1['risk_score'] == res2['risk_score']
    
    def test_model_accuracy_reasonable(self, trained_model):
        """Test model achieves reasonable accuracy."""
        _, metrics = trained_model
        
        assert metrics['accuracy'] > 0.7
        assert metrics['precision'] > 0.5
        assert metrics['recall'] > 0.5


class TestPredictModule:
    """Tests for predict module."""

    @pytest.fixture(scope='class')
    def trained_model_fixture(self):
        """Train a model for testing."""
        from ml.train import train_and_evaluate
        model, feature_names, metrics = train_and_evaluate(test_size=0.2, random_state=42)
        phishing_model = PhishingModel()
        phishing_model.model = model
        phishing_model.feature_names = feature_names
        return phishing_model, metrics

    @pytest.fixture(autouse=True)
    def setup_model(self, tmp_path, trained_model_fixture):
        """Create a test model file."""
        model, _ = trained_model_fixture
        self.model_path = tmp_path / "test_model.joblib"
        model.save(str(self.model_path))
        return model
    
    def test_load_model(self):
        """Test model loading."""
        model = load_model(str(self.model_path))
        
        assert model is not None
    
    def test_predict_url_returns_dict(self):
        """Test predict_url returns proper dict."""
        result = predict_url('https://www.google.com', str(self.model_path))
        
        assert isinstance(result, dict)
        assert 'url' in result
        assert 'classification' in result
        assert 'risk_score' in result
        assert 'probabilities' in result
        assert 'features' in result
    
    def test_predict_url_label_valid(self):
        """Test prediction label is valid."""
        result = predict_url('https://www.google.com', str(self.model_path))
        
        assert result['classification'] in ['safe', 'malicious']
        assert 0.0 <= result['model_probability'] <= 1.0
    
    def test_predict_batch(self):
        """Test batch prediction."""
        urls = [
            'https://www.google.com',
            'http://phishing-site.xyz/login',
            'https://www.github.com'
        ]
        results = predict_url(urls[0], str(self.model_path))
        
        assert results['url'] == urls[0]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
