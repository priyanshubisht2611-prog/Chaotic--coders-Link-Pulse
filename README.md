# LinkPulse — AI URL Shortener & Link Security Platform

A production-ready, full-stack platform for creating high-performance short URLs, tracking granular click analytics, generating QR codes, and scanning URLs for phishing and security threats using machine learning.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Backend Implementation](#backend-implementation)
  - [1. URL Shortener & Redirect Engine](#1-url-shortener--redirect-engine)
  - [2. QR Code Service](#2-qr-code-service)
  - [3. Bulk CSV Import Pipeline](#3-bulk-csv-import-pipeline)
  - [4. Click Tracking & Analytics Engine](#4-click-tracking--analytics-engine)
  - [5. ML Phishing Detection Engine](#5-ml-phishing-detection-engine)
  - [6. Storage Layer & Database Schema](#6-storage-layer--database-schema)
- [API Reference](#api-reference)
  - [System & Health](#system--health)
  - [URL Shortener (`/links`)](#url-shortener-links)
  - [Redirection (`/l`)](#redirection-l)
  - [Analytics (`/analytics`)](#analytics-analytics)
  - [Security Scanner (`/scan`)](#security-scanner-scan)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Prerequisites](#prerequisites)
- [Local Setup & Installation](#local-setup--installation)
- [Running Locally](#running-locally)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Chrome Extension](#chrome-extension)
- [ML Model Evaluation & Performance](#ml-model-evaluation--performance)
- [License](#license)

---

## Overview

Modern web workflows require fast, reliable URL shortening and analytics, but shortened and obfuscated URLs are also primary attack vectors for credential harvesting and phishing scams.

**LinkPulse** unifies link management and proactive cybersecurity intelligence into a single platform:
1. **Smart URL Shortener**: Generates 6-character collision-resistant short codes, automatically deduplicates existing links, and produces downloadable QR codes.
2. **Real-time Redirection & Tracking**: Delivers fast HTTP 302 redirects while recording timestamped click events in a local SQLite database.
3. **Analytics Dashboard**: Aggregates high-level metrics, daily time-series trends with date filtering, per-link search/sort/pagination, and streaming CSV export.
4. **Machine Learning URL Scanner**: Evaluates submitted URLs against 23 structural and lexical features using a Random Forest classifier to compute an interpretable 0–100 risk score with explanatory signals.
5. **Bulk Processing**: Allows high-volume URL ingestion via CSV with automated format validation and per-row error reporting.
6. **Browser Extension**: A Manifest V3 Chrome Extension providing one-click phishing inspection directly from active browser tabs.

---

## Key Features

- **Collision-Resistant Short Links**: Generates URL-safe short codes using Python's cryptographically secure `secrets` module.
- **Atomic Click Tracking**: Records every link access with ISO UTC timestamps and updates cumulative click counters atomically.
- **Embedded & Standalone QR Codes**: Generates high-contrast QR codes saved locally to static storage with base64 data URI output.
- **Bulk CSV Upload**: Imports batches of URLs with automatic column detection, deduplication, URL scheme validation, and error breakdown.
- **Granular Analytics**:
  - Global overview metrics: total clicks, active links, total links created.
  - Daily trend aggregation with date range filtering (`YYYY-MM-DD`).
  - Searchable, sortable, and paginated link performance table.
  - Streaming CSV file download (`StreamingResponse`).
- **Phishing Detection Engine (UCI PhiUSIIL Compatible)**:
  - 23 extracted features covering lexical characteristics, character ratios, IP address detection, HTTPS check, and suspicious TLD/keywords.
  - Random Forest classifier achieving **99.52% accuracy** on 47,514 holdout test samples.
  - Explanatory risk signals explaining the factors contributing to the score.
  - Risk categorization into `safe` (0–30), `suspicious` (31–70), and `malicious` (71–100).
- **Comprehensive Test Suite**: Automated unit and integration tests covering API routing, SQLite persistence, bulk import parsing, and ML feature extraction.

---

## System Architecture

```
                                  ┌────────────────────────┐
                                  │      Client Layer      │
                                  │  React UI / Extension  │
                                  └───────────┬────────────┘
                                              │ HTTP / JSON
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Backend (v1.1.0)                                │
│                                                                                        │
│  ┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐  │
│  │   Shortener Router     │   │    Analytics Router    │   │      Scan Router       │  │
│  │     (/links, /l)       │   │      (/analytics)      │   │        (/scan)         │  │
│  └───────────┬────────────┘   └───────────┬────────────┘   └───────────┬────────────┘  │
│              │                            │                            │               │
│              ▼                            ▼                            ▼               │
│  ┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐  │
│  │  Storage & Click Logger│   │   Trend Aggregator &   │   │  PhiUSIIL 23-Feature   │  │
│  │ (In-Memory + SQLite)   │   │     CSV Exporter       │   │   Extraction Pipeline  │  │
│  └───────────┬────────────┘   └───────────┬────────────┘   └───────────┬────────────┘  │
│              │                            │                            │               │
│              ▼                            ▼                            ▼               │
│  ┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐  │
│  │      data/links.db     │   │   Streaming CSV File   │   │  RandomForest Model    │  │
│  │  (links, click_events) │   │        Response        │   │ (scikit-learn / joblib)│  │
│  └────────────────────────┘   └────────────────────────┘   └────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Backend Implementation

The backend is built with **FastAPI** (`backend/api/`) and **Python 3.11+**, structured cleanly into modular services:

### 1. URL Shortener & Redirect Engine
- **Module**: `backend/api/shortener_routes.py`, `backend/api/storage.py`
- **Short Code Generation**: Generates 6-character alphanumeric tokens using `secrets.token_urlsafe(6)`.
- **Deduplication**: If an identical destination URL is submitted, the storage engine returns the existing short link instead of creating duplicate records.
- **Redirection**: `GET /l/{short_code}` performs an HTTP 302 redirect to the original destination URL. During redirection, it atomically increments `links.click_count` and appends a row into `click_events`.

### 2. QR Code Service
- **Module**: `backend/api/qr_service.py`
- **Engine**: Generates QR codes via `qrcode` with medium error correction (`ERROR_CORRECT_M`).
- **Output Formats**:
  - PNG files persisted to `backend/static/qr_codes/{short_code}.png`.
  - Direct file serving via `GET /links/{short_code}/qr` (`FileResponse`).
  - Base64-encoded strings for instant inline rendering in web clients.

### 3. Bulk CSV Import Pipeline
- **Module**: `backend/api/bulk_import.py`
- **Header Flexibility**: Auto-detects columns named `url`, `original_url`, `link`, or `destination` (case-insensitive).
- **Validation**: Enforces valid URL schemes (`http://`, `https://`), non-empty strings, and identifies duplicate entries within the file.
- **Error Diagnostics**: Returns row-level validation errors with error codes (`empty_url`, `invalid_url`, `duplicate_url`, `missing_column`) along with the exact row data.

### 4. Click Tracking & Analytics Engine
- **Module**: `backend/api/analytics_routes.py`
- **Summary Metrics**: Calculates cumulative clicks, count of active links (links with >0 clicks), and total links created.
- **Time-Series Trends**: Aggregates timestamps from `click_events` into daily totals with optional `start` and `end` ISO date filters (`YYYY-MM-DD`).
- **Search, Sort & Pagination**:
  - Filter by case-insensitive substring search across `original_url` and `short_code`.
  - Sort by `created_at`, `clicks`, or `short_code` in `asc` or `desc` order.
  - Client-controlled `limit` (1–1000) and `offset` for high-throughput pagination.
- **Data Export**: Generates and streams standard CSV files (`StreamingResponse`) with RFC-compliant headers for spreadsheet integration.

### 5. ML Phishing Detection Engine
- **Modules**: `backend/ml/features.py`, `backend/ml/model.py`, `backend/ml/predict.py`
- **Feature Extraction (23 Features)**:
  Extracts 23 numerical features matching the UCI PhiUSIIL dataset standard:
  - *Lengths & Structure*: `url_length`, `hostname_length`, `path_depth`, `query_length`, `subdomain_count`.
  - *Character Counts*: `dot_count`, `hyphen_count`, `at_count`, `question_mark_count`, `ampersand_count`, `equals_count`, `underscore_count`, `percent_count`, `digit_count`, `letter_count`.
  - *Ratios*: `digit_ratio`, `letter_ratio`, `special_char_ratio`.
  - *Security & Heuristics*: `is_ip_address`, `uses_https`, `has_punycode`, `has_credentials`, `has_suspicious_keyword`.
- **Model Classifier**:
  - Scikit-learn `RandomForestClassifier` (100 estimators, max depth 20).
  - Serialized to disk using `joblib`.
  - Loaded as a singleton dependency via `backend/api/dependencies.py` using `functools.lru_cache`.
- **Risk Scoring & Explanations**:
  - Maps model probability into a 0–100 score with heuristic feature adjustments.
  - Classifies into `safe` (<=30), `suspicious` (31–70), or `malicious` (>=71).
  - Generates weighted risk signals (e.g., direct IP address, suspicious TLD, missing HTTPS, excessive length) to explain why the URL was classified as risky.

### 6. Storage Layer & Database Schema
- **Module**: `backend/api/storage.py`
- **Database**: SQLite with foreign key enforcement (`PRAGMA foreign_keys = ON`). Configurable via `LINKPULSE_DB_PATH` or `LINKPULSE_TEST_DB` (defaults to `data/links.db`).
- **Hybrid Architecture**: Fast in-memory dictionary lookup for instant resolution paired with database write-through persistence.
- **Database Schema**:
  ```sql
  CREATE TABLE IF NOT EXISTS links (
      short_code TEXT PRIMARY KEY,
      original_url TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      click_count INTEGER NOT NULL DEFAULT 0,
      qr_enabled INTEGER NOT NULL DEFAULT 0,
      qr_image_path TEXT
  );

  CREATE TABLE IF NOT EXISTS click_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      short_code TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY(short_code) REFERENCES links(short_code) ON DELETE CASCADE
  );
  ```

---

## API Reference

Base URL: `http://127.0.0.1:8000`

### System & Health

| Method | Endpoint | Description | Response Example |
|--------|----------|-------------|------------------|
| `GET` | `/` | API service status & version | `{"status": "ok", "service": "LinkPulse API", "version": "1.1.0"}` |
| `GET` | `/health` | Health check endpoint | `{"status": "healthy"}` |

---

### URL Shortener (`/links`)

#### 1. Shorten URL
- **Endpoint**: `POST /links/shorten`
- **Request Body**:
  ```json
  {
    "url": "https://example.com/very/long/destination/url"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "original_url": "https://example.com/very/long/destination/url",
    "short_code": "aB3x9Z",
    "short_url": "/l/aB3x9Z",
    "qr_code_url": null,
    "created_at": "2026-10-20T18:00:00.000000Z"
  }
  ```

#### 2. List Links
- **Endpoint**: `GET /links`
- **Response** (`200 OK`):
  ```json
  {
    "links": [
      {
        "original_url": "https://example.com/page",
        "short_code": "aB3x9Z",
        "short_url": "/l/aB3x9Z",
        "qr_code_url": "/links/aB3x9Z/qr",
        "created_at": "2026-10-20T18:00:00.000000Z"
      }
    ],
    "total": 1
  }
  ```

#### 3. Delete Short Link
- **Endpoint**: `DELETE /links/{short_code}`
- **Response** (`200 OK`):
  ```json
  {
    "status": "deleted",
    "short_code": "aB3x9Z"
  }
  ```

#### 4. Generate QR Code
- **Endpoint**: `POST /links/{short_code}/qr?base_url=http://localhost:8000`
- **Response** (`200 OK`):
  ```json
  {
    "short_code": "aB3x9Z",
    "short_url": "/l/aB3x9Z",
    "qr_image_url": "/links/aB3x9Z/qr",
    "qr_image_base64": "iVBORw0KGgoAAAANSUhEUgAA..."
  }
  ```

#### 5. Get QR Code Image
- **Endpoint**: `GET /links/{short_code}/qr`
- **Response**: Binary PNG file (`image/png`).

#### 6. Get Link Statistics
- **Endpoint**: `GET /links/{short_code}/stats`
- **Response** (`200 OK`):
  ```json
  {
    "short_code": "aB3x9Z",
    "original_url": "https://example.com/page",
    "clicks": 42,
    "created_at": "2026-10-20T18:00:00.000000Z",
    "qr_enabled": true
  }
  ```

#### 7. Bulk Import via CSV
- **Endpoint**: `POST /links/import`
- **Content-Type**: `multipart/form-data` (`file: UploadFile`)
- **Response** (`200 OK`):
  ```json
  {
    "summary": {
      "total_rows": 5,
      "successful": 4,
      "failed": 1,
      "success_rate": 80.0
    },
    "errors": [
      {
        "row": 3,
        "type": "invalid_url",
        "message": "Invalid URL format: not-a-valid-url...",
        "data": { "url": "not-a-valid-url" }
      }
    ],
    "imported_codes": ["code1", "code2", "code3", "code4"]
  }
  ```

---

### Redirection (`/l`)

- **Endpoint**: `GET /l/{short_code}`
- **Behavior**:
  - Valid code: Returns `302 Found` with `Location: <original_url>`. Increments click count and registers timestamped click event.
  - Invalid code: Returns `404 Not Found`.

---

### Analytics (`/analytics`)

#### 1. Summary Metrics
- **Endpoint**: `GET /analytics/summary`
- **Response** (`200 OK`):
  ```json
  {
    "total_clicks": 1420,
    "active_links": 35,
    "total_links": 40
  }
  ```

#### 2. Click Trends
- **Endpoint**: `GET /analytics/trends?start=2026-10-01&end=2026-10-20`
- **Query Parameters**:
  - `start` *(optional)*: Start date (`YYYY-MM-DD`).
  - `end` *(optional)*: End date (`YYYY-MM-DD`).
- **Response** (`200 OK`):
  ```json
  [
    { "date": "2026-10-18", "clicks": 120 },
    { "date": "2026-10-19", "clicks": 240 },
    { "date": "2026-10-20", "clicks": 310 }
  ]
  ```

#### 3. Link Performance Table
- **Endpoint**: `GET /analytics/links?search=example&sort_by=clicks&sort_order=desc&limit=50&offset=0`
- **Query Parameters**:
  - `search` *(optional)*: Filter by string in original URL or short code.
  - `sort_by` *(optional)*: Field to sort by (`created_at`, `clicks`, `short_code`). Default: `created_at`.
  - `sort_order` *(optional)*: `asc` or `desc`. Default: `desc`.
  - `limit` *(optional)*: Integer (1–1000). Default: `100`.
  - `offset` *(optional)*: Integer (>=0). Default: `0`.
- **Response** (`200 OK`):
  ```json
  {
    "links": [
      {
        "short_code": "aB3x9Z",
        "original_url": "https://example.com/target",
        "created_at": "2026-10-19T14:22:00Z",
        "clicks": 425,
        "short_url": "/l/aB3x9Z"
      }
    ],
    "total": 1
  }
  ```

#### 4. Export CSV
- **Endpoint**: `GET /analytics/export?format=csv&start=2026-10-01&end=2026-10-20`
- **Response**: Downloadable file attachment (`text/csv`) with header `Content-Disposition: attachment; filename=linkpulse_analytics.csv`.

---

### Security Scanner (`/scan`)

- **Endpoint**: `POST /scan/`
- **Request Body**:
  ```json
  {
    "url": "http://paypal-security-update.xyz/login.php?user=admin"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "submitted_url": "http://paypal-security-update.xyz/login.php?user=admin",
    "risk_score": 86.5,
    "classification": "malicious",
    "model_probability": 0.9412,
    "explanatory_risk_signals": [
      {
        "signal": "suspicious_tld",
        "description": "URL uses uncommon or suspicious top-level domain",
        "weight": 0.25
      },
      {
        "signal": "no_https",
        "description": "URL does not use HTTPS encryption",
        "weight": 0.1
      },
      {
        "signal": "suspicious_keywords",
        "description": "URL contains 2 suspicious keywords commonly used in phishing",
        "weight": 0.16
      }
    ],
    "recommendation": "Do not enter any personal information on this site. This appears to be a phishing attempt."
  }
  ```

---

## Technology Stack

| Component | Technology | File / Reference |
|-----------|------------|------------------|
| **API Framework** | FastAPI 0.115+ | `backend/api/main.py` |
| **ASGI Server** | Uvicorn 0.30+ | `run_server.py`, `pyproject.toml` |
| **Data Validation** | Pydantic v2 | `backend/api/models.py` |
| **Database** | SQLite3 | `backend/api/storage.py`, `data/links.db` |
| **QR Code Generation** | `qrcode` (PIL / image buffer) | `backend/api/qr_service.py` |
| **Machine Learning** | scikit-learn (RandomForestClassifier) | `backend/ml/model.py`, `train.py` |
| **Model Serialization** | Joblib | `backend/ml/phishing_model.joblib` |
| **Data Manipulation** | Pandas, NumPy | `backend/ml/dataset.py`, `features.py` |
| **Domain Parsing** | `tldextract` | `backend/ml/features.py` |
| **Test Runner** | pytest, pytest-cov, httpx | `tests/`, `pyproject.toml` |
| **Frontend UI** | React 18, Vite, Tailwind CSS | `frontend/package.json` |
| **Extension** | Google Chrome Manifest V3 | `extension/manifest.json` |

---

## Project Directory Structure

```
LinkPulse/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application entry point, middleware & routing
│   │   ├── routes.py                # Phishing detection scan endpoint (/scan)
│   │   ├── shortener_routes.py      # Short link creation, deletion, QR, & bulk import (/links)
│   │   ├── analytics_routes.py      # Analytics summary, trends, links table, & CSV export (/analytics)
│   │   ├── models.py                # Pydantic schemas for requests, responses, and signals
│   │   ├── storage.py               # SQLite URLStore with click tracking & in-memory cache
│   │   ├── qr_service.py            # QR code image generator (PNG & base64)
│   │   ├── bulk_import.py           # CSV import validation and parsing engine
│   │   └── dependencies.py          # Cached ML model loader singleton
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── data/
│   │   │   └── synthetic_phishing_dataset.csv # Base synthetic training dataset
│   │   ├── dataset.py               # Dataset loading and synthetic generator
│   │   ├── features.py              # UCI PhiUSIIL 23-feature URL extractor
│   │   ├── features_new.py          # Extended feature extraction heuristics
│   │   ├── feature_schema.json      # Standardized 23-feature schema definition
│   │   ├── model.py                 # PhishingModel wrapper around RandomForestClassifier
│   │   ├── train.py                 # Training script with evaluation & artifact export
│   │   ├── predict.py               # Standalone prediction interface & model info
│   │   ├── evaluation_report.json   # Benchmark metrics on 47,514 holdout samples
│   │   └── phishing_model.joblib    # Trained Random Forest model binary
│   └── static/
│       └── qr_codes/                # Generated QR code PNG storage
├── data/
│   └── links.db                     # SQLite persistence database (created on first run)
├── extension/
│   ├── manifest.json                # Chrome Manifest V3 extension configuration
│   ├── popup.html                   # Extension interface
│   ├── popup.js                     # Extension scanner logic
│   └── icons/                       # Extension icon assets
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main single-page application
│   │   ├── components/
│   │   │   ├── ShortenerPanel.jsx
│   │   │   ├── AnalyticsDashboard.jsx
│   │   │   └── SecurityCheckerPanel.jsx
│   │   └── utils/api.js             # Frontend API client
│   └── package.json                 # Node dependencies
├── tests/
│   ├── __init__.py
│   ├── test_api.py                  # Tests for /scan and health endpoints
│   ├── test_shortener.py            # Tests for URLStore, QR service, and bulk import
│   ├── test_shortener_api.py        # Integration tests for /links shortener API
│   └── test_ml.py                   # Tests for feature extraction and ML classifier
├── docs/
│   ├── api_contract.md              # Original API design contract
│   ├── architecture.md              # Architectural overview
│   └── implementation-plan.md       # Phased implementation plan
├── requirements.txt                 # Python runtime and development dependencies
├── pyproject.toml                   # Python packaging & pytest configuration
└── run_server.py                    # Convenience script to start Uvicorn
```

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** & **npm** (for frontend development)
- **Git**

---

## Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/priyanshubisht2611-prog/Chaotic--coders-Link-Pulse.git
cd Chaotic--coders-Link-Pulse
```

### 2. Set Up Python Virtual Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# Linux / macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

### 3. Set Up Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## Running Locally

### Start Backend Server (Port 8000)
You can launch the FastAPI server using either `run_server.py` or `uvicorn`:

```bash
# Option A: Run convenience script
python run_server.py

# Option B: Run via Uvicorn CLI
uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Interactive API Documentation (Swagger UI)**: `http://127.0.0.1:8000/docs`
- **Alternative API Documentation (ReDoc)**: `http://127.0.0.1:8000/redoc`

### Start Frontend Client (Port 5173)
In a separate terminal window:
```bash
cd frontend
npm run dev
```
Open your browser at `http://127.0.0.1:5173`.

---

## Testing & Quality Assurance

LinkPulse includes an extensive suite of automated tests for all backend modules.

Run the test suite using `pytest`:
```bash
# Run all tests
pytest

# Run tests with verbose output
pytest -v

# Run specific test suites
pytest tests/test_api.py
pytest tests/test_shortener.py
pytest tests/test_shortener_api.py
pytest tests/test_ml.py
```

---

## Chrome Extension

To install the browser extension locally in Google Chrome:

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** in the upper-right corner.
3. Click **Load unpacked** in the top-left toolbar.
4. Select the `extension/` directory from this repository.
5. With the backend server running at `http://127.0.0.1:8000`, open the extension popup on any active tab to scan the current webpage for phishing threats.

---

## ML Model Evaluation & Performance

The phishing detection classifier was trained and evaluated against a benchmark dataset using hostname-grouped holdout splitting to prevent data leakage.

### Evaluation Metrics (47,514 Holdout Samples)

| Metric | Score |
|--------|-------|
| **Accuracy** | **99.52%** |
| **Phishing Precision** | **99.67%** |
| **Phishing Recall** | **99.23%** |
| **Phishing F1-Score** | **99.45%** |
| **PR-AUC** | **0.9984** |
| **ROC-AUC** | **0.9979** |
| **False Positive Rate** | **0.25%** |

### Confusion Matrix
- **True Legitimate**: 26,954
- **False Phishing (FP)**: 68
- **False Legitimate (FN)**: 158
- **True Phishing**: 20,334

---

## License

This project is licensed under the [MIT License](LICENSE).