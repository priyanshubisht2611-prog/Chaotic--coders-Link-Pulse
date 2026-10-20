"""URL scanning route with phishing detection."""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from backend.api.models import ScanRequest, ScanResponse, RiskSignal
from backend.api.dependencies import load_phishing_model
from backend.ml.model import PhishingModel

router = APIRouter(prefix="/scan", tags=["scan"])


def _features_to_risk_signals(features: dict, url: str) -> List[dict]:
    """Convert feature dict to explanatory risk signals."""
    signals = []
    
    # Check suspicious TLD
    if features.get('suspicious_tld', 0) > 0:
        signals.append({
            'signal': 'suspicious_tld',
            'description': 'URL uses uncommon or suspicious top-level domain',
            'weight': 0.25
        })
    
    # Check URL length
    url_length = features.get('url_length', 0)
    if url_length > 100:
        signals.append({
            'signal': 'url_length',
            'description': 'URL is excessively long, potentially obfuscating malicious intent',
            'weight': 0.15
        })
    
    # Check suspicious keywords
    keywords_count = features.get('suspicious_keywords_count', 0)
    if keywords_count > 0:
        weight = min(0.3, keywords_count * 0.08)
        signals.append({
            'signal': 'suspicious_keywords',
            'description': f'URL contains {keywords_count} suspicious keywords commonly used in phishing',
            'weight': weight
        })
    
    # Check IP address
    if features.get('has_ip_address', 0) > 0:
        signals.append({
            'signal': 'ip_address_in_url',
            'description': 'URL uses direct IP address instead of domain name',
            'weight': 0.3
        })
    
    # Check HTTPS
    if features.get('has_https', 0) == 0:
        signals.append({
            'signal': 'no_https',
            'description': 'URL does not use HTTPS encryption',
            'weight': 0.1
        })
    
    # Check at symbol
    if features.get('has_at_symbol', 0) > 0:
        signals.append({
            'signal': 'at_symbol',
            'description': 'URL contains @ symbol which can be used to obfuscate domain',
            'weight': 0.25
        })
    
    # Check multiple HTTP
    if features.get('has_multiple_http', 0) > 0:
        signals.append({
            'signal': 'multiple_http',
            'description': 'URL contains multiple http references',
            'weight': 0.15
        })
    
    # Normalize weights if needed
    total_weight = sum(s['weight'] for s in signals)
    if total_weight > 1.0:
        for s in signals:
            s['weight'] = s['weight'] / total_weight
    
    return signals


def _calculate_risk_score(prediction: str, confidence: float, features: dict) -> tuple[float, str]:
    """Calculate risk score 0-100 and classification."""
    # Base score from model confidence
    if prediction == 'phishing':
        base_score = confidence * 100
    else:
        base_score = (1 - confidence) * 100 * 0.3  # Safe URLs get lower scores
    
    # Adjust based on features
    feature_boost = 0
    if features.get('suspicious_tld', 0) > 0:
        feature_boost += 15
    if features.get('has_ip_address', 0) > 0:
        feature_boost += 20
    if features.get('has_https', 0) == 0:
        feature_boost += 10
    if features.get('suspicious_keywords_count', 0) > 2:
        feature_boost += 10
    
    risk_score = min(100.0, base_score + feature_boost)
    
    # Classification
    if risk_score <= 30:
        classification = 'safe'
    elif risk_score <= 70:
        classification = 'suspicious'
    else:
        classification = 'malicious'
    
    return round(risk_score, 2), classification


def _get_recommendation(classification: str, risk_score: float) -> str:
    """Get recommendation based on classification."""
    if classification == 'safe':
        return "This URL appears safe to visit."
    elif classification == 'suspicious':
        return "Exercise caution. Verify the URL carefully before entering any personal information."
    else:
        return "Do not enter any personal information on this site. This appears to be a phishing attempt."


@router.post("/", response_model=ScanResponse)
async def scan_url(request: ScanRequest, model: PhishingModel = Depends(load_phishing_model)):
    """Scan URL for phishing indicators."""
    try:
        url_str = str(request.url)
        
        # Get prediction dictionary from the new model structure
        prediction_result = model.predict(url_str)
        label = prediction_result['classification']  # 'malicious' or 'safe'
        confidence = prediction_result['model_probability']
        
        # Extract features for signals
        from backend.ml.features import extract_features
        features = extract_features(url_str)
        
        # Calculate risk score and classification (Map 'malicious' to 'phishing' for internal logic)
        internal_label = 'phishing' if label == 'malicious' else 'safe'
        risk_score, classification = _calculate_risk_score(internal_label, confidence, features)
        
        # Get risk signals
        signals = _features_to_risk_signals(features, url_str)
        
        # Get recommendation
        recommendation = _get_recommendation(classification, risk_score)
        
        response = ScanResponse(
            submitted_url=url_str,
            risk_score=risk_score,
            classification=classification,
            model_probability=round(confidence, 4),
            explanatory_risk_signals=[RiskSignal(**s) for s in signals],
            recommendation=recommendation
        )
        
        return response
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log error internally
        print(f"Internal error during scan: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "InternalServerError",
                "detail": "An internal error occurred while scanning the URL",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )
