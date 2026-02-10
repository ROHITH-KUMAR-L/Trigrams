/**
 * Trigram Autofill - Popup Script
 * Manages extension settings and displays API status
 */

// DOM Elements
const statusChip = document.getElementById('statusChip');
const enableToggle = document.getElementById('enableToggle');
const tempSlider = document.getElementById('tempSlider');
const tempDisplay = document.getElementById('tempDisplay');
const apiUrl = document.getElementById('apiUrl');
const totalTrigrams = document.getElementById('totalTrigrams');
const uniqueWords = document.getElementById('uniqueWords');
const errorBanner = document.getElementById('errorBanner');
const refreshBtn = document.getElementById('refreshBtn');
const saveBtn = document.getElementById('saveBtn');
const statsCard = document.getElementById('statsCard');

/**
 * Initialize popup
 */
async function init() {
  await loadConfig();
  await checkApiStatus();
  setupEventListeners();
}

/**
 * Load configuration from background script
 */
async function loadConfig() {
  try {
    const response = await browser.runtime.sendMessage({ action: 'getConfig' });
    if (response.success) {
      const config = response.config;
      enableToggle.checked = config.enabled;
      tempSlider.value = config.temperature;
      tempDisplay.textContent = config.temperature.toFixed(1);
      apiUrl.value = config.apiUrl;
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}

/**
 * Check API health and fetch stats
 */
async function checkApiStatus() {
  try {
    const healthResponse = await browser.runtime.sendMessage({ action: 'health' });
    
    if (healthResponse.success && healthResponse.modelLoaded) {
      setStatus('connected', 'Connected');
      hideError();
      
      // Fetch stats
      const statsResponse = await browser.runtime.sendMessage({ action: 'stats' });
      if (statsResponse.success) {
        totalTrigrams.textContent = formatNumber(statsResponse.stats.total_trigrams);
        uniqueWords.textContent = formatNumber(statsResponse.stats.unique_first_words);
        statsCard.classList.remove('hidden');
      }
    } else {
      setStatus('error', 'Not loaded');
      showError('Model not loaded. Please start the trigram server.');
    }
  } catch (error) {
    setStatus('error', 'Offline');
    showError('Cannot connect to API. Is the server running?');
    statsCard.classList.add('hidden');
  }
}

/**
 * Set status chip state
 */
function setStatus(state, text) {
  statusChip.className = 'status-chip ' + state;
  statusChip.querySelector('.status-label').textContent = text;
}

/**
 * Show error banner
 */
function showError(message) {
  errorBanner.querySelector('.error-text').textContent = message;
  errorBanner.classList.remove('hidden');
}

/**
 * Hide error banner
 */
function hideError() {
  errorBanner.classList.add('hidden');
}

/**
 * Format large numbers
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Save settings
 */
async function saveSettings() {
  const config = {
    enabled: enableToggle.checked,
    temperature: parseFloat(tempSlider.value),
    apiUrl: apiUrl.value.trim()
  };

  try {
    await browser.runtime.sendMessage({ 
      action: 'setConfig', 
      config 
    });
    
    // Visual feedback
    saveBtn.textContent = '✓ Saved';
    saveBtn.classList.add('success');
    
    setTimeout(() => {
      saveBtn.textContent = 'Save Settings';
      saveBtn.classList.remove('success');
    }, 1500);
    
    // Re-check API status with new URL
    await checkApiStatus();
  } catch (error) {
    console.error('Failed to save config:', error);
    saveBtn.textContent = '✕ Error';
    setTimeout(() => {
      saveBtn.textContent = 'Save Settings';
    }, 1500);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Temperature slider
  tempSlider.addEventListener('input', () => {
    tempDisplay.textContent = parseFloat(tempSlider.value).toFixed(1);
  });

  // Enable toggle - instant save
  enableToggle.addEventListener('change', async () => {
    await browser.runtime.sendMessage({ action: 'toggleEnabled' });
  });

  // Refresh button
  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spinning');
    checkApiStatus().finally(() => {
      setTimeout(() => {
        refreshBtn.classList.remove('spinning');
      }, 500);
    });
  });

  // Save button
  saveBtn.addEventListener('click', saveSettings);

  // Enter key on API URL input
  apiUrl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveSettings();
    }
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
