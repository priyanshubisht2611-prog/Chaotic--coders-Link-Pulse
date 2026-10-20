const API_BASE_URL = 'http://127.0.0.1:8000';

const urlDisplay = document.getElementById('urlDisplay');
const scanBtn = document.getElementById('scanBtn');
const loadingState = document.getElementById('loadingState');
const resultCard = document.getElementById('resultCard');
const errorMsg = document.getElementById('errorMsg');
const riskScoreEl = document.getElementById('riskScore');
const classificationEl = document.getElementById('classification');
const recommendationEl = document.getElementById('recommendation');
const signalsEl = document.getElementById('signals');

let currentUrl = '';

async function getCurrentTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    currentUrl = url;
    urlDisplay.textContent = url;
    return url;
  } catch (error) {
    showError('Could not access current tab URL');
    return null;
  }
}

async function scanUrl(url) {
  showLoading(true);
  hideError();
  hideResult();
  
  try {
    const response = await fetch(`${API_BASE_URL}/scan/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    displayResults(data);
  } catch (error) {
    console.error('Scan error:', error);
    showError(error.message || 'Failed to scan URL. Is the backend running?');
  } finally {
    showLoading(false);
  }
}

function displayResults(data) {
  const { risk_score, classification, recommendation, explanatory_risk_signals } = data;
  
  riskScoreEl.textContent = Math.round(risk_score);
  riskScoreEl.className = `risk-score ${classification}`;
  
  classificationEl.textContent = classification;
  classificationEl.className = `classification ${classification}`;
  
  recommendationEl.textContent = recommendation;
  
  // Display signals
  if (explanatory_risk_signals && explanatory_risk_signals.length > 0) {
    signalsEl.innerHTML = explanatory_risk_signals.map(signal => `
      <div class="signal">
        <span class="signal-icon">⚠️</span>
        <span class="signal-text">${signal.description}</span>
      </div>
    `).join('');
  } else {
    signalsEl.innerHTML = '<div class="signal"><span class="signal-icon">✓</span><span class="signal-text">No significant risk signals detected</span></div>';
  }
  
  // Update risk icon
  const riskIcon = document.getElementById('riskIcon');
  if (classification === 'safe') {
    riskIcon.textContent = '✅';
  } else if (classification === 'suspicious') {
    riskIcon.textContent = '⚠️';
  } else {
    riskIcon.textContent = '🚨';
  }
  
  hideLoading();
  showResult();
}

function showLoading(show) {
  loadingState.style.display = show ? 'block' : 'none';
  scanBtn.disabled = show;
}

function showResult() {
  resultCard.classList.add('visible');
}

function hideResult() {
  resultCard.classList.remove('visible');
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
}

function hideError() {
  errorMsg.style.display = 'none';
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  const url = await getCurrentTabUrl();
  if (url) {
    // Auto-scan on open
    scanUrl(url);
  }
});

// Scan button click
scanBtn.addEventListener('click', async () => {
  const url = await getCurrentTabUrl();
  if (url) {
    scanUrl(url);
  }
});
