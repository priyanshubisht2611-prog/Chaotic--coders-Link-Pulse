"""Dataset loading and synthetic generation for phishing URLs."""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional
import random

# Try to load real dataset if available
DATASET_PATHS = [
    Path(__file__).parent / "data" / "phishing_dataset.csv",
    Path(__file__).parent.parent.parent / "data" / "phishing_dataset.csv",
]

SYNTHETIC_SIZE = 2000


def _generate_synthetic_urls(n_samples: int = SYNTHETIC_SIZE, random_state: int = 42) -> pd.DataFrame:
    """Generate high-quality synthetic phishing/safe URL dataset."""
    random.seed(random_state)
    np.random.seed(random_state)
    
    domains_safe = [
        "google.com", "facebook.com", "youtube.com", "amazon.com", "twitter.com",
        "linkedin.com", "github.com", "microsoft.com", "apple.com", "netflix.com",
        "reddit.com", "instagram.com", "whatsapp.com", "t.co", "bbc.co.uk",
        "nytimes.com", "washingtonpost.com", "cnn.com", "forbes.com",
    ]
    
    domains_phishing = [
        "google-secure.com", "facebook-login.net", "apple-id-verify.org",
        "amazon-payment.co", "paypal-verify.info", "bankofamerica-secure.net",
        "gmail-login.xyz", "microsoft-account.com", "netflix-billing.io",
        "instagram-verification.tech", "linkedin-security.org",
    ]
    
    tlds_safe = [".com", ".org", ".net", ".edu", ".gov", ".co.uk"]
    tlds_phishing = [".xyz", ".info", ".top", ".club", ".tk", ".ml", ".ga"]
    
    safe_paths = ["/", "/search", "/home", "/dashboard", "/profile", "/api/v1/"]
    phishing_paths = [
        "/login.php?secure=1", "/verify-account.html", "/secure-login/index.html",
        "/update-info?token=", "/confirm?code=", "/reset-password.php?id=",
        "/billing/verify", "/account/suspended.php?reason=",
    ]
    
    urls = []
    labels = []
    
    # Safe URLs
    for _ in range(n_samples // 2):
        domain = random.choice(domains_safe)
        use_https = random.random() > 0.1
        protocol = "https" if use_https else "http"
        
        # Add path
        path = random.choice(safe_paths)
        if random.random() < 0.3:
            path += f"?q={random.randint(1000,9999)}"
        
        url = f"{protocol}://www.{domain}{path}"
        urls.append(url)
        labels.append(0)
    
    # Phishing URLs
    for _ in range(n_samples // 2):
        # Use lookalike domains or suspicious TLDs
        if random.random() < 0.7:
            base = random.choice(["google", "facebook", "paypal", "amazon", "apple", "microsoft", "bankofamerica"])
            typo = random.choice(["", "-", "1", "0", "o"])
            domain = f"{base}{typo}{random.choice(['-secure', '-login', '-verify', '-account'])}"
        else:
            domain = random.choice(domains_phishing)
        
        tld = random.choice(tlds_phishing)
        use_https = random.random() < 0.4  # Phishing often uses http
        
        protocol = "https" if use_https else "http"
        path = random.choice(phishing_paths)
        
        # Add suspicious parameters
        if random.random() < 0.6:
            path += f"&session={random.randint(10000,99999)}&user=admin"
        
        url = f"{protocol}://{domain}{tld}{path}"
        urls.append(url)
        labels.append(1)
    
    df = pd.DataFrame({"url": urls, "label": labels})
    return df


def load_dataset(csv_path: Optional[str] = None) -> pd.DataFrame:
    """
    Load phishing dataset from CSV or generate synthetic dataset.
    
    Expected CSV format: url,label where label=0 for safe, 1 for phishing
    """
    if csv_path:
        path = Path(csv_path)
        if path.exists():
            df = pd.read_csv(path)
            return _validate_dataset(df)
    
    # Try default paths
    for path in DATASET_PATHS:
        if path.exists():
            df = pd.read_csv(path)
            return _validate_dataset(df)
    
    # Generate synthetic dataset
    print("No CSV dataset found, generating synthetic dataset...")
    df = _generate_synthetic_urls()
    
    # Save for future use
    data_dir = Path(__file__).parent / "data"
    data_dir.mkdir(exist_ok=True)
    synthetic_path = data_dir / "synthetic_phishing_dataset.csv"
    df.to_csv(synthetic_path, index=False)
    print(f"Synthetic dataset saved to {synthetic_path}")
    
    return df


def _validate_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """Validate dataset structure."""
    required_cols = {"url", "label"}
    if not required_cols.issubset(df.columns):
        raise ValueError(f"Dataset must contain columns {required_cols}, got {df.columns.tolist()}")
    
    if not set(df["label"].unique()).issubset({0, 1}):
        raise ValueError("Labels must be 0 (safe) or 1 (phishing)")
    
    # Clean URLs
    df = df.copy()
    df["url"] = df["url"].astype(str).str.strip()
    df = df[df["url"].str.startswith("http")]
    
    return df.reset_index(drop=True)