// Background service worker for LinkPulse Chrome Extension
// Handles communication between popup and backend API

const API_BASE_URL = 'http://127.0.0.1:8000';

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanUrl') {
    scanUrl(request.url)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getCurrentTabUrl') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        sendResponse({ url: tabs[0].url });
      } else {
        sendResponse({ error: 'Could not get tab URL' });
      }
    });
    return true;
  }
});

async function scanUrl(url) {
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
  
  return await response.json();
}

// Update extension badge based on scan results
function updateBadge(riskScore) {
  let color = [52, 168, 83, 255]; // green
  let text = '';
  
  if (riskScore >= 71) {
    color = [239, 68, 68, 255]; // red
    text = '!';
  } else if (riskScore >= 31) {
    color = [245, 158, 11, 255]; // yellow
    text = '⚠';
  }
  
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
}
