# LinkPulse Architecture

## Overview
LinkPulse is a phishing URL detection platform with the following components:
1. ML Phishing Detection Engine (backend)
2. FastAPI API service
3. React dashboard (frontend)
4. Chrome extension
5. Testing, integration, and documentation

## Components

### 1. ML Phishing Detection Engine
- Location: `backend/ml/`
- Responsibilities:
  - Load and preprocess URL dataset
  - Extract features from URLs
  - Train Random Forest model
  - Evaluate model performance
  - Save/load model using joblib
  - Provide prediction function

### 2. FastAPI Backend
- Location: `backend/api/`
- Responsibilities:
  - Expose `/scan` endpoint for URL analysis
  - Load ML model at startup
  - Validate input URLs
  - Call ML engine to get predictions
  - Format response according to API contract
  - Handle errors gracefully

### 3. React Dashboard
- Location: `frontend/`
- Responsibilities:
  - Provide UI for URL submission
  - Display risk score, classification, and explanations
  - Show humorous stickman security assistant
  - Handle loading and error states
  - Communicate with backend via API

### 4. Chrome Extension
- Location: `extension/`
- Responsibilities:
  - Scan active tab URL via backend
  - Display risk result in extension popup
  - Show appropriate warnings based on risk level
  - Use Manifest V3

### 5. Testing, Integration, and Documentation
- Location: Throughout the project
- Responsibilities:
  - Unit tests for ML engine and API
  - Integration tests for full workflow
  - End-to-end tests for dashboard and extension
  - Deployment preparation
  - README with setup instructions

## Data Flow
1. User submits URL via dashboard or extension
2. Frontend sends URL to `/scan` endpoint
3. Backend loads ML model and extracts features
4. ML model predicts phishing probability
5. Backend returns risk score, classification, and explanations
6. Frontend/extension displays results to user

## File Structure
```
LinkPulse/
├── backend/
│   ├── ml/                 # ML engine
│   │   ├── dataset.py
│   │   ├── features.py
│   │   ├── model.py
│   │   └── train.py
│   └── api/                # FastAPI application
│       ├── main.py
│       ├── routes.py
│       └── dependencies.py
├── frontend/               # React Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
├── extension/              # Chrome extension
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── background.js
├── tests/                  # Test suite
│   ├── test_ml.py
│   ├── test_api.py
│   └── test_integration.py
├── docs/
│   ├── architecture.md
│   └── api_contract.md
├── .gitignore
├── requirements.txt
├── README.md
└── pyproject.toml or setup.py
```