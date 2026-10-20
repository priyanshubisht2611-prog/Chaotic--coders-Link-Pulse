"""Feature extraction from URLs for phishing detection."""

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

SUSPICIOUS_TLDS = ['.xyz', '.top', '.club', '.tk', '.ml', '.ga', '.info', '.pw']


def extract_features(url: str) -> Dict[str, float]:
    """
    Extract numerical features from a URL for phishing detection.
    
    Returns a dictionary of numerical features.
    """
    features = {}
    
    # Basic URL properties
    features['url_length'] = len(url)
    
    # Parse URL
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
    
    # HTTPS check
    features['has_https'] = 1.0 if scheme.lower() == 'https' else 0.0
    
    # Domain features
    features['num_dots'] = hostname.count('.')
    features['num_hyphens'] = hostname.count('-')
    features['num_underscores'] = hostname.count('_')
    features['num_digits'] = sum(c.isdigit() for c in hostname)
    
    # Path and query features
    features['path_length'] = len(path)
    features['query_length'] = len(query)
    features['num_slashes'] = url.count('/')
    features['num_question_marks'] = url.count('?')
    features['num_equals'] = url.count('=')
    features['num_ampersands'] = url.count('&')
    
    # Special characters
    special_chars = ['@', '#', '%', '+', '~', '$', '|', '<', '>', '*', '(', ')']
    features['num_special_chars'] = sum(url.count(c) for c in special_chars)
    
    # Count suspicious keywords
    url_lower = url.lower()
    features['suspicious_keywords_count'] = sum(
        1 for kw in SUSPICIOUS_KEYWORDS if kw in url_lower
    )
    
    # Suspicious TLD
    features['suspicious_tld'] = 0.0
    # Check hostname for TLD, not full URL
    hostname_lower = hostname.lower()
    for tld in SUSPICIOUS_TLDS:
        if hostname_lower.endswith(tld) or f".{tld.lstrip('.')}" in hostname_lower:
            features['suspicious_tld'] = 1.0
            break
    
    # Multiple subdomains (potential red flag)
    parts = hostname.split('.')
    features['num_subdomains'] = max(0, len(parts) - 2)
    features['has_ip_address'] = 1.0 if re.match(r'^\d+\.\d+\.\d+\.\d+$', hostname) else 0.0
    
    # Length ratios
    features['hostname_length'] = len(hostname)
    features['path_to_url_ratio'] = features['path_length'] / max(features['url_length'], 1)
    
    # Presence of common phishing patterns
    features['has_at_symbol'] = 1.0 if '@' in url else 0.0
    features['has_multiple_http'] = 1.0 if url.lower().count('http') > 1 else 0.0
    
    # Entropy-like feature: number of unique characters
    features['unique_chars_ratio'] = len(set(url)) / max(len(url), 1)
    
    # Domain extract features
    try:
        ext = tldextract.extract(url)
        features['domain_length'] = len(ext.domain)
        features['suffix_length'] = len(ext.suffix)
    except Exception:
        features['domain_length'] = 0
        features['suffix_length'] = 0
    
    return features


def extract_features_batch(urls):
    """Extract features from a list of URLs."""
    return [extract_features(url) for url in urls]
