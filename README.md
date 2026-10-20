# LinkPulse - ML Phishing Detection Platform

A phishing URL detection system with FastAPI backend, React dashboard, and Chrome extension.

## ⚠️ IMPORTANT: Synthetic Data Disclaimer

**This model is trained on synthetic data only and is NOT production-ready.**

- **Dataset**: 2,000 synthetic samples (1,000 safe, 1,000 phishing)
- **Duplicates**: 550 duplicate URLs in dataset (1,450 unique)
- **Metrics**: Accuracy 1.0000, Precision 1.0000, Recall 1.0000, F1 1.0000
- **Nature**: **SMOKE TEST ONLY** - Perfect metrics are artificial due to synthetic generation

These metrics do NOT establish real-world phishing detection accuracy. The synthetic data generator creates trivially separable features. Do NOT use for production or claim real-world accuracy.

## Architecture

- **Backend**: FastAPI with RandomForest classifier
- **Frontend**: React + Vite + Tailwind
- **Extension**: Chrome Manifest V3
- **Model**: `backend/ml/phishing_model.joblib`

## Running Locally

### Backend
```bash
cd C:\Users\PRIYANSHU BISHT\Desktop\LinkPulse
.\.venv\Scripts\python.exe -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npx vite --port 5173
```

### API Endpoint
`POST /scan/` returns risk score, classification, and signals.

## Current Limitations

1. Synthetic dataset only
2. No real-world testing
3. Model not validated on external data
4. API route: `/scan/` (trailing slash, docs say `/scan`)

## Status

Hackathon demo only. Do not deploy.