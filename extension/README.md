# LinkPulse Chrome Extension

Chrome Extension Manifest V3 for phishing URL detection.

## Installation

1. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/` folder

2. Start the backend API:
   ```bash
   cd backend
   python -m uvicorn api.main:app --reload --port 8000
   ```

3. Click the LinkPulse icon in Chrome toolbar to scan current page

## Features

- Scan active tab URL via backend /scan endpoint
- Display risk score (0-100)
- Show classification (safe/suspicious/malicious)
- Visual warnings based on risk level
- Recommendation text
- Risk signals explanation

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension UI
- `popup.js` - Popup logic and API communication
- `background.js` - Background service worker
- `styles.css` - UI styling
