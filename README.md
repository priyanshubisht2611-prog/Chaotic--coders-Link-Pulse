# LinkPulse — AI URL Shortener & Link Security Platform

A full-stack platform for creating short URLs, tracking link analytics, and scanning URLs for phishing threats using machine learning.

## Problem Statement

URL shorteners and phishing attacks are both prevalent on the web. Users often cannot verify whether a shortened link leads to a legitimate destination, and even direct URLs may disguise malicious intent. Organizations and individuals need a combined solution that not only creates trackable short links but also provides real-time security intelligence about any URL.

## Proposed Solution

LinkPulse unifies three capabilities in one platform:

1. **URL Shortening** — Create concise, trackable short links with optional QR codes for easy sharing
2. **Analytics Dashboard** — Monitor click counts, trends over time, and export performance reports
3. **URL Security Scanner** — Scan any URL against a trained Random Forest classifier to receive phishing risk scores and safety recommendations

## Main Features

- **Smart URL Shortener**: Create short links with persistent SQLite-backed storage and optional QR code generation
- **Analytics Dashboard**: Summary cards, daily click trends, per-link performance table, date range filtering, and CSV export
- **URL Security Checker**: Real-time phishing risk assessment using a trained ML model (0–100 risk score, classification, and explanatory signals)
- **Chrome Extension**: Optional browser extension for instant URL scanning from any tab (local Developer mode installation)
- **Persistent Click Tracking**: SQLite database records every short-link redirect with timestamps
- **Unified Web Interface**: Single-page application with shared navigation and branding

## Technology Stack

| Layer | Technology | Verified From |
|-------|------------|---------------|
| **Backend** | FastAPI (Python 3.11+) | `backend/api/main.py`, `requirements.txt` |
| **Frontend** | React 18 + Vite + Tailwind CSS | `frontend/package.json` |
| **Database** | SQLite (local persistence) | `backend/api/storage.py`, `data/links.db` |
| **ML Model** | scikit-learn RandomForestClassifier | `backend/ml/model.py`, `requirements.txt` |
| **Testing** | pytest (backend), Vitest (frontend) | `tests/`, `frontend/src/__tests__/` |
| **Browser Extension** | Chrome Manifest V3 | `extension/manifest.json` |

## Project Architecture

```
LinkPulse/
├── backend/
│   ├── api/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── routes.py         # /scan/ phishing detection endpoint
│   │   ├── shortener_routes.py  # /shorten/ and QR generation
│   │   ├── analytics_routes.py  # /analytics/ endpoints
│   │   ├── storage.py        # SQLite URLStore with click recording
│   │   ├── models.py         # Pydantic request/response models
│   │   └── qr_service.py     # QR code generation
│   ├── ml/
│   │   ├── model.py          # RandomForest phishing classifier
│   │   ├── train.py          # Model training script
│   │   └── features.py       # URL feature extraction
│   └── static/               # QR code image storage
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Unified single-page app
│   │   ├── components/
│   │   │   ├── ShortenerPanel.jsx
│   │   │   ├── AnalyticsDashboard.jsx
│   │   │   └── SecurityCheckerPanel.jsx
│   │   └── utils/api.js      # API client
│   └── dist/                 # Production build output
├── extension/
│   ├── manifest.json         # Chrome Extension V3 manifest
│   ├── popup.html/js         # Extension UI
│   └── icons/                # Extension icons
├── data/
│   └── links.db              # SQLite database (local only)
├── tests/                    # Backend pytest tests
└── requirements.txt          # Python dependencies
```

## Prerequisites

- **Python 3.11+** (for FastAPI and scikit-learn)
- **Node.js 18+** (for React frontend with Vite)
- **Git** (for version control)

## Local Setup

### 1. Clone and enter the project

```bash
cd C:\Users\PRIYANSHU BISHT\Desktop\LinkPulse
```

### 2. Set up Python virtual environment

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
```

### 3. Set up frontend dependencies

```bash
cd frontend
npm install
```

### 4. Initialize the database (optional)

The SQLite database is created automatically on first run at `data/links.db`.

## Running Locally

### Backend API (Port 8000)

```bash
# From project root
.venv\Scripts\python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000
```

### Frontend Development Server (Port 5173)

```bash
cd frontend
npm run dev
```

Access the unified website at: `http://127.0.0.1:5173`

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/scan/` | POST | Phishing risk analysis (risk_score, classification, signals) |
| `/shorten/` | POST | Create short URL (original_url, optional custom code) |
| `/analytics/` | GET | Dashboard data (summary cards, trends, link table) |
| `/l/{short_code}` | GET | Redirect short URL and record click |
| `/health` | GET | Health check |

## Testing

### Backend Tests

```bash
pytest
```

### Frontend Tests

```bash
cd frontend
npm run test
```

### Production Build

```bash
cd frontend
npm run build
```

The build output is generated in `frontend/dist/`.

## Chrome Extension (Local Installation)

The extension is not published to the Chrome Web Store. To install locally:

1. Open Google Chrome and navigate to `chrome://extensions/`
2. Toggle **Developer mode** in the top-right corner
3. Click **Load unpacked** in the top-left corner
4. Select the `extension/` folder from your LinkPulse project

The extension will scan the current tab URL against the backend API for phishing risk.

## Live Website & Screenshots

**Local Development URL:** `http://127.0.0.1:5173`

*Screenshots to be added when deployed.*

## Current Limitations

1. **AI predictions are not guarantees**: The phishing detection model is trained on synthetic data and cannot guarantee that any URL is safe. Always exercise caution with unfamiliar links.

2. **Synthetic training data**: The model was trained on 2,000 synthetic samples (1,000 safe, 1,000 phishing) and has not been validated on real-world data.

3. **Local SQLite database**: The analytics data is stored in a local SQLite file and is not synchronized across devices or users.

4. **Extension not published**: The Chrome extension requires local Developer mode installation and is not available through the Chrome Web Store.

5. **No user authentication**: The platform currently does not include user accounts or access controls.

## License

MIT License (to be added)