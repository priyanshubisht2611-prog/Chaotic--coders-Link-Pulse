# LinkPulse API Contract

## Endpoint: POST /scan

### Request
```json
{
  "url": "string (required, valid URL format)"
}
```

### Response (Success)
```json
{
  "submitted_url": "string (the URL that was submitted)",
  "risk_score": "number (0-100, higher = more risky)",
  "classification": "string (either 'safe', 'suspicious', or 'malicious')",
  "model_probability": "number (0-1, probability from ML model, optional)",
  "explanatory_risk_signals": [
    {
      "signal": "string (name of the risk signal)",
      "description": "string (human-readable explanation)",
      "weight": "number (contribution to risk score, 0-1)"
    }
  ],
  "recommendation": "string (actionable advice for the user)"
}
```

### Response (Validation Error)
```json
{
  "error": "ValidationError",
  "detail": "string (description of validation failure)",
  "field": "string (field that failed validation, if applicable)"
}
```

### Response (Internal Error)
```json
{
  "error": "InternalServerError",
  "detail": "string (generic error message for security)",
  "timestamp": "string (ISO timestamp)"
}
```

## Risk Score Interpretation
- 0-30: Safe (green)
- 31-70: Suspicious (yellow)
- 71-100: Malicious (red)

## Classification Logic
- 'safe': risk_score <= 30
- 'suspicious': 31 <= risk_score <= 70
- 'malicious': risk_score >= 71

## Explanatory Risk Signals
Each signal should include:
1. **signal**: Identifier like "ip_address_in_url", "suspicious_tld", "url_length", etc.
2. **description**: Plain English explanation
3. **weight**: Normalized contribution (0-1) to the final risk score

## Example Successful Response
```json
{
  "submitted_url": "http://paypa1.com-security.update.net/",
  "risk_score": 85,
  "classification": "malicious",
  "model_probability": 0.92,
  "explanatory_risk_signals": [
    {
      "signal": "suspicious_tld",
      "description": "URL uses uncommon or suspicious top-level domain",
      "weight": 0.3
    },
    {
      "signal": "url_length",
      "description": "URL is excessively long, potentially obfuscating malicious intent",
      "weight": 0.2
    },
    {
      "signal": "brand_imitation",
      "description": "URL imitates a well-known brand (PayPal) with character substitution",
      "weight": 0.4
    }
  ],
  "recommendation": "Do not enter any personal information on this site. This appears to be a phishing attempt."
}
```

## Example Safe Response
```json
{
  "submitted_url": "https://www.google.com/",
  "risk_score": 5,
  "classification": "safe",
  "model_probability": 0.01,
  "explanatory_risk_signals": [],
  "recommendation": "This URL appears safe to visit."
}
```