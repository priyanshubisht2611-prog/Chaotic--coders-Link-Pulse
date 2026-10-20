"""Feature extraction from URLs for phishing detection - UCI PhiUSIIL compatible."""

import re
from urllib.parse import urlparse
from typing import Dict
import tldextract

# Common phishing indicators
SUSPICIOUS_KEYWORDS = [
    'login', 'verify', 'secure', 'account', 'update', 'confirm',
    'billing', 'payment', 'bank', 'password', 'reset', 'auth',
    'session', 'token', 'code', 'suspended'
]

def extract_features(url: str) -> Dict[str, float]:
    """
    Extract numerical features from a URL for phishing detection.
    Features match UCI PhiUSIIL dataset feature schema (23 features).
    """
    features = {}
    
    # Basic URL properties
    features['url_length'] = len(url) if url else 0
    
    # Parse URL safely
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or ''
        path = parsed.path or ''
        query = parsed.query or ''
        scheme = parsed.scheme or ''
    except Exception:
        hostname = ''
        path = ''
        query = ''
        scheme = ''
    
    # Hostname features
    features['hostname_length'] = len(hostname)
    features['is_ip_address'] = 1.0 if re.match(r'^\d+\.\d+\.\d+\.\d+$', hostname) else 0.0
    
    # Character counts
    features['dot_count'] = hostname.count('.')
    features['hyphen_count'] = hostname.count('-')
    features['at_count'] = url.count('@')
    features['question_mark_count'] = url.count('?')
    features['ampersand_count'] = url.count('&')
    features['equals_count'] = url.count('=')
    features['underscore_count'] = url.count('_')
    features['percent_count'] = url.count('%')
    
    # Digit and letter counts
    features['digit_count'] = sum(c.isdigit() for c in url)
    features['letter_count'] = sum(c.isalpha() for c in url)
    url_len = max(len(url), 1)
    features['digit_ratio'] = features['digit_count'] / url_len
    features['letter_ratio'] = features['letter_count'] / url_len
    
    # Special characters
    special_chars = set('@#%+$|<>*()[]{}')
    special_count = sum(1 for c in url if c in special_chars)
    features['special_char_ratio'] = special_count / url_len
    
    # Subdomain count
    parts = hostname.split('.')
    features['subdomain_count'] = max(0, len(parts) - 2)
    
    # Path features
    features['path_depth'] = path.count('/') if path else 0
    features['query_length'] = len(query)
    
    # Security features
    features['uses_https'] = 1.0 if scheme.lower() == 'https' else 0.0
    
    # Punycode detection
    try:
        ext = tldextract.extract(url)
        features['has_punycode'] = 1.0 if ext.domain.startswith('xn--') else 0.0
    except Exception:
        features['has_punycode'] = 0.0
    
    # Credentials in URL
    features['has_credentials'] = 1.0 if '@' in url and url.count('@') >= 1 else 0.0
    
    # Suspicious keywords
    url_lower = url.lower()
    features['has_suspicious_keyword'] = 1.0 if any(kw in url_lower for kw in SUSPICIOUS_KEYWORDS) else 0.0
    
    return features


def extract_features_batch(urls):
    """Extract features from a list of URLs."""
    return [extract_features(url) for url in urls]