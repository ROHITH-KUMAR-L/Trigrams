/**
 * Trigram Autofill - Background Script
 * Handles communication between content scripts and the local trigram API
 */

// Configuration - can be overridden via storage
const DEFAULT_CONFIG = {
  apiUrl: 'http://127.0.0.1:8080',
  enabled: true,
  temperature: 1.0,
  maxPredictions: 5
};

let config = { ...DEFAULT_CONFIG };

// Load saved configuration
browser.storage.local.get('config').then((result) => {
  if (result.config) {
    config = { ...DEFAULT_CONFIG, ...result.config };
  }
});

// Listen for config changes
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.config) {
    config = { ...DEFAULT_CONFIG, ...changes.config.newValue };
    console.log('[Trigram] Config updated:', config);
  }
});

/**
 * Fetch predictions from the local trigram API
 */
async function fetchPredictions(word1, word2) {
  if (!config.enabled) {
    return { success: false, error: 'Extension disabled' };
  }

  try {
    const response = await fetch(`${config.apiUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        word1: word1.toLowerCase(),
        word2: word2.toLowerCase(),
        temperature: config.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      predictions: data.predictions || []
    };
  } catch (error) {
    console.error('[Trigram] API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if the API is available
 */
async function checkApiHealth() {
  try {
    const response = await fetch(`${config.apiUrl}/health`, {
      method: 'GET'
    });
    const data = await response.json();
    return {
      success: true,
      status: data.status,
      modelLoaded: data.model_loaded
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get API statistics
 */
async function getApiStats() {
  try {
    const response = await fetch(`${config.apiUrl}/stats`, {
      method: 'GET'
    });
    const data = await response.json();
    return {
      success: true,
      stats: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Handle messages from content scripts and popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'predict':
      fetchPredictions(request.word1, request.word2)
        .then(sendResponse);
      return true; // Keep channel open for async response

    case 'health':
      checkApiHealth().then(sendResponse);
      return true;

    case 'stats':
      getApiStats().then(sendResponse);
      return true;

    case 'getConfig':
      sendResponse({ success: true, config });
      return false;

    case 'setConfig':
      config = { ...config, ...request.config };
      browser.storage.local.set({ config });
      sendResponse({ success: true, config });
      return false;

    case 'toggleEnabled':
      config.enabled = !config.enabled;
      browser.storage.local.set({ config });
      sendResponse({ success: true, enabled: config.enabled });
      return false;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

// Log when background script loads
console.log('[Trigram] Background script loaded. API URL:', config.apiUrl);
