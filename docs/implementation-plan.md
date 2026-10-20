# LinkPulse Implementation Plan

## Subagent 1: ML Dataset, Feature Extraction, Model Training, Evaluation and Prediction
**Goal**: Create a working ML phishing detection engine that can extract features from URLs and make predictions using a trained Random Forest model.

**Tasks**:
1. Create dataset module to load a labeled URL dataset (use a publicly available phishing dataset)
2. Create feature extraction module to extract relevant features from URLs
3. Create model training script that trains a Random Forest classifier
4. Create model evaluation script to measure accuracy, precision, recall, F1-score
5. Create prediction interface that loads the trained model and makes predictions
6. Save trained model using joblib
7. Write unit tests for feature extraction and prediction functions

**Files to create**:
- `backend/ml/dataset.py`
- `backend/ml/features.py`
- `backend/ml/model.py`
- `backend/ml/train.py`
- `backend/ml/predict.py`
- `tests/test_ml.py`

**Acceptance Criteria**:
- Model trains successfully on a labeled dataset
- Feature extraction produces meaningful numerical features
- Model achieves reasonable performance (>70% accuracy)
- Prediction interface returns probabilities and classifications
- Model is saved and can be reloaded for inference

## Subagent 2: FastAPI Backend, Validation, API Endpoints and ML Integration
**Goal**: Create a FastAPI backend that serves the ML model via a /scan endpoint with proper validation and error handling.

**Tasks**:
1. Set up FastAPI application with proper project structure
2. Create URL validation (ensure valid URL format)
3. Create dependency to load ML model at startup
4. Implement /scan endpoint that accepts URL and returns prediction
5. Integrate with ML engine to get predictions and format response
6. Implement proper error handling for validation and internal errors
7. Add middleware for CORS to allow frontend requests
8. Write unit tests for API endpoints

**Files to create**:
- `backend/api/main.py`
- `backend/api/routes.py`
- `backend/api/dependencies.py`
- `backend/api/models.py` (for request/response schemas)
- `tests/test_api.py`

**Acceptance Criteria**:
- API starts successfully and loads ML model
- /scan endpoint accepts valid URLs and returns proper response format
- Invalid URLs return appropriate validation errors
- Internal errors are handled gracefully without exposing stack traces
- Response matches the defined API contract
- CORS is properly configured

## Subagent 3: React Dashboard, Scan UI, Risk Visualization and Humor Feature
**Goal**: Create a React Vite dashboard that allows users to submit URLs for scanning and displays results with visualizations and humor.

**Tasks**:
1. Set up React Vite project with Tailwind CSS
2. Create URL input form with validation
3. Create scan button that triggers API request
4. Display loading state during scan
5. Show results with risk score visualization (gauge or progress bar)
6. Display classification with color coding (green/yellow/red)
7. Show explanatory risk signals in a readable format
8. Add recommendation text
9. Implement humor feature: stickman security assistant with occasional jokes
10. Handle error states (network errors, invalid responses)
11. Write basic tests for components

**Files to create**:
- `frontend/package.json`
- `frontend/index.html`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/components/URLInput.jsx`
- `frontend/src/components/ScanButton.jsx`
- `frontend/src/components/ResultsDisplay.jsx`
- `frontend/src/components/RiskGauge.jsx`
- `frontend/src/components/StickmanAssistant.jsx`
- `frontend/src/utils/api.js`
- `frontend/src/utils/jokes.js` (for humor feature)
- `tests/frontend.test.js` (basic component tests)

**Acceptance Criteria**:
- Dashboard loads without errors
- Users can submit URLs and see loading state
- Successful API responses are displayed properly
- Risk score is visualized appropriately
- Classification shows correct color coding
- Explanatory signals are displayed
- Recommendation text is shown
- Stickman assistant appears with occasional jokes
- Error states are handled gracefully

## Subagent 4: Chrome Extension and Backend Integration
**Goal**: Create a Chrome Manifest V3 extension that can scan the active tab URL through the backend and display results.

**Tasks**:
1. Set up Chrome extension structure with Manifest V3
2. Create popup.html for extension UI
3. Create popup.js to handle UI logic and communicate with background
4. Create background.js to handle messaging and API calls
5. Implement active tab URL extraction
6. Send URL to backend /scan endpoint
7. Display results in popup with risk score, classification, and recommendation
8. Show appropriate warnings based on risk level
9. Handle extension-to-backend communication errors
10. Add basic tests for background scripts

**Files to create**:
- `extension/manifest.json`
- `extension/popup.html`
- `extension/popup.js`
- `extension/background.js`
- `extension/content.js` (if needed for tab communication)
- `extension/styles.css` (for popup styling)
- `tests/test_extension.js` (basic background script tests)

**Acceptance Criteria**:
- Extension loads in Chrome without errors
- Extension can extract active tab URL
- Extension successfully communicates with backend
- Results are displayed in popup with proper formatting
- Risk level determines visual warnings (green/yellow/red)
- Extension handles network errors gracefully
- Extension follows Manifest V3 best practices

## Subagent 5: Testing, Integration Coordination, Deployment and Documentation
**Goal**: Ensure all components work together, create tests, prepare for deployment, and write documentation.

**Tasks**:
1. Create integration tests that test the full workflow
2. Write end-to-end tests for dashboard-backend communication
3. Write end-to-end tests for extension-backend communication
4. Create Dockerfile for easy deployment (optional)
5. Prepare deployment instructions for free-tier hosting (Render, Fly.io, etc.)
6. Write comprehensive README with setup, training, and deployment instructions
7. Create .gitignore file to exclude sensitive and unnecessary files
8. Verify all components work together through manual testing
9. Run all tests and ensure they pass
10. Create deployment verification checklist

**Files to create**:
- `tests/test_integration.py`
- `tests/test_e2e_dashboard.py`
- `tests/test_e2e_extension.py`
- `Dockerfile` (optional)
- `docker-compose.yml` (optional)
- `README.md`
- `.gitignore`
- `requirements.txt`
- `pyproject.toml` or `setup.py`
- `DEPLOYMENT.md` (deployment instructions)

**Acceptance Criteria**:
- All unit tests pass
- Integration tests verify components work together
- E2E tests confirm dashboard and extension can communicate with backend
- README provides clear setup and installation instructions
- Deployment instructions work for at least one free-tier provider
- .gitignore excludes venv, __pycache__, .env, etc.
- Project can be built and run locally with minimal setup