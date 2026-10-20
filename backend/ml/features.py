"""Feature extraction from URLs for phishing detection - UCI PhiUSIIL compatible.

This module extracts exactly 23 features matching the PhiUSIIL feature schema:
- url_length, hostname_length, is_ip_address, dot_count, hyphen_count, at_count,
- question_mark_count, ampersand_count, equals_count, underscore_count, percent_count,
- digit_count, letter_count, digit_ratio, letter_ratio, special_char_ratio,
- subdomain_count, path_depth, query_length, uses_https, has_punycode,
- has_credentials, has_suspicious_keyword

Label mapping: 1 = phishing, 0 = legitimate
"""

import re
from urllib.parse import urlparse
from typing import Dict, List
import tldextract

# Common phishing indicators
SUSPICIOUS_KEYWORDS = [
    'login', 'verify', 'secure', 'account', 'update', 'confirm',
    'billing', 'payment', 'bank', 'password', 'reset', 'auth',
    'session', 'token', 'code', 'suspended'
]

# Exact feature order matching feature_schema.json
FEATURE_ORDER = [
    'url_length',
    'hostname_length',
    'is_ip_address',
    'dot_count',
    'hyphen_count',
    'at_count',
    'question_mark_count',
    'ampersand_count',
    'equals_count',
    'underscore_count',
    'percent_count',
    'digit_count',
    'letter_count',
    'digit_ratio',
    'letter_ratio',
    'special_char_ratio',
    'subdomain_count',
    'path_depth',
    'query_length',
    'uses_https',
    'has_punycode',
    'has_credentials',
    'has_suspicious_keyword'
]


def extract_features(url: str) -> Dict[str, float]:
    """
    Extract 23 numerical features from a URL for phishing detection.
    Features match UCI PhiUSIIL dataset feature schema exactly.
    """
    features = {}
    url = url or ''
    url_lower = url.lower()
    
    # Basic URL properties
    features['url_length'] = len(url)
    
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
    digit_count = sum(c.isdigit() for c in url)
    letter_count = sum(c.isalpha() for c in url)
    features['digit_count'] = digit_count
    features['letter_count'] = letter_count
    
    # Ratios (use max to avoid division by zero)
    url_len = max(len(url), 1)
    features['digit_ratio'] = digit_count / url_len
    features['letter_ratio'] = letter_count / url_len
    
    # Special characters (same set used in training)
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
    
    # Credentials in URL (user:password@host)
    features['has_credentials'] = 1.0 if '@' in url else 0.0
    
    # Suspicious keywords in URL
    features['has_suspicious_keyword'] = 1.0 if any(kw in url_lower for kw in SUSPICIOUS_KEYWORDS) else 0.0
    
    return features


def extract_features_in_order(url: str) -> List[float]:
    """Extract features and return as ordered list matching training order."""
    features = extract_features(url)
    return [features.get(name, 0.0) for name in FEATURE_ORDER]


def extract_features_batch(urls):
    """Extract features from a list of URLs."""
    return [extract_features(url) for url in urls]


if __name__ == '__main__':
    # Quick verification
    test_url = 'https://www.google.com'
    features = extract_features(test_url)
    print(f"Features extracted for {test_url}:")
    for name in FEATURE_ORDER:
        print(f"  {name}: {features.get(name, 'MISSING')}")
    print(f"Total features: {len(features)}")