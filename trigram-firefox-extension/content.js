/**
 * Trigram Autofill - Content Script (v10 - Professional UI)
 * - Clean CSS-class-based UI
 * - Word and sentence prediction modes
 * - Settings panel with refined controls
 */

(function() {
  'use strict';

  if (window !== window.top) return;
  if (window._trigramInitialized) return;
  window._trigramInitialized = true;

  let predictionBox = null;
  let controlPanel = null;
  let selectedIndex = 0;
  let currentPredictions = [];
  let currentTarget = null;
  let debounceTimer = null;
  let panelOpen = false;

  // Settings (synced with storage)
  let settings = {
    enabled: true,
    temperature: 1.0,
    autoPredict: true,
    predictionMode: 'word',
    sentenceLength: 5
  };

  const DEBOUNCE_MS = 400;

  console.log('[Trigram] v10 loading...');

  async function init() {
    await loadSettings();
    createUI();
    setupListeners();
    console.log('[Trigram] Ready! Mode:', settings.predictionMode);
  }

  async function loadSettings() {
    try {
      const result = await browser.storage.local.get('trigramSettings');
      if (result.trigramSettings) {
        settings = { ...settings, ...result.trigramSettings };
      }
    } catch (e) {
      console.log('[Trigram] Using default settings');
    }
  }

  async function saveSettings() {
    try {
      await browser.storage.local.set({ trigramSettings: settings });
    } catch (e) {}
  }

  function createUI() {
    // Remove previous instances
    document.querySelectorAll('#trigram-panel').forEach(e => e.remove());
    document.querySelectorAll('#trigram-dropdown').forEach(e => e.remove());

    // ─── Control Panel ───
    controlPanel = document.createElement('div');
    controlPanel.id = 'trigram-panel';
    controlPanel.innerHTML = buildPanelHTML();
    document.body.appendChild(controlPanel);
    bindPanelEvents();

    // ─── Prediction Dropdown ───
    predictionBox = document.createElement('div');
    predictionBox.id = 'trigram-dropdown';
    predictionBox.style.display = 'none';
    predictionBox.addEventListener('click', e => {
      const item = e.target.closest('[data-word]');
      if (item) insertPrediction(item.dataset.word);
    });
    document.body.appendChild(predictionBox);
  }

  function buildPanelHTML() {
    return `
      <div id="trigram-header">
        <span class="tri-logo"></span>
        <span class="tri-brand">Trigram</span>
        <span id="trigram-status" class="tri-status-badge ${settings.enabled ? 'on' : 'off'}">
          ${settings.enabled ? 'ON' : 'OFF'}
        </span>
        <span id="trigram-chevron" class="tri-chevron">▾</span>
      </div>
      <div id="trigram-settings" style="display:none;">
        <!-- Mode Toggle -->
        <div>
          <span class="tri-section-label">Prediction Mode</span>
          <div class="tri-mode-group">
            <button id="mode-word" class="tri-mode-btn ${settings.predictionMode === 'word' ? 'active' : ''}">
              <span class="mode-icon">Aa</span> Word
            </button>
            <button id="mode-sentence" class="tri-mode-btn ${settings.predictionMode === 'sentence' ? 'active' : ''}">
              <span class="mode-icon">¶</span> Sentence
            </button>
          </div>
        </div>

        <!-- Sentence Length -->
        <div id="sentence-length-row" class="tri-slider-row" style="display:${settings.predictionMode === 'sentence' ? 'flex' : 'none'};">
          <div class="tri-slider-header">
            <span class="tri-slider-label">Sentence Length</span>
            <span id="len-val" class="tri-slider-value">${settings.sentenceLength}</span>
          </div>
          <input type="range" id="trigram-len" class="tri-slider" min="3" max="10" step="1" value="${settings.sentenceLength}">
        </div>

        <!-- Temperature -->
        <div class="tri-slider-row">
          <div class="tri-slider-header">
            <span class="tri-slider-label">Temperature</span>
            <span id="temp-val" class="tri-slider-value">${settings.temperature.toFixed(1)}</span>
          </div>
          <input type="range" id="trigram-temp" class="tri-slider" min="0.1" max="2.0" step="0.1" value="${settings.temperature}">
        </div>

        <!-- Auto-predict Toggle -->
        <div class="tri-toggle-row">
          <span class="tri-toggle-label">Auto-predict</span>
          <label class="tri-toggle">
            <input type="checkbox" id="trigram-auto" ${settings.autoPredict ? 'checked' : ''}>
            <span class="tri-toggle-track"></span>
          </label>
        </div>

        <div class="tri-separator"></div>

        <!-- Power Button -->
        <button id="trigram-toggle" class="tri-power-btn ${settings.enabled ? 'enabled' : 'disabled'}">
          ${settings.enabled ? '⏸ Disable' : '▶ Enable'}
        </button>
      </div>
    `;
  }

  function bindPanelEvents() {
    // Toggle settings panel
    document.getElementById('trigram-header').onclick = () => {
      const settingsDiv = document.getElementById('trigram-settings');
      const chevron = document.getElementById('trigram-chevron');
      panelOpen = !panelOpen;
      settingsDiv.style.display = panelOpen ? 'flex' : 'none';
      chevron.classList.toggle('open', panelOpen);
    };

    // Enable/Disable toggle
    document.getElementById('trigram-toggle').onclick = () => {
      settings.enabled = !settings.enabled;
      updatePanelUI();
      saveSettings();
      if (!settings.enabled) hidePredictions();
    };

    // Auto-predict
    document.getElementById('trigram-auto').onchange = (e) => {
      settings.autoPredict = e.target.checked;
      saveSettings();
    };

    // Temperature
    document.getElementById('trigram-temp').oninput = (e) => {
      settings.temperature = parseFloat(e.target.value);
      document.getElementById('temp-val').textContent = settings.temperature.toFixed(1);
      saveSettings();
    };

    // Mode buttons
    document.getElementById('mode-word').onclick = () => {
      settings.predictionMode = 'word';
      updateModeButtons();
      document.getElementById('sentence-length-row').style.display = 'none';
      saveSettings();
    };

    document.getElementById('mode-sentence').onclick = () => {
      settings.predictionMode = 'sentence';
      updateModeButtons();
      document.getElementById('sentence-length-row').style.display = 'flex';
      saveSettings();
    };

    // Sentence length
    document.getElementById('trigram-len').oninput = (e) => {
      settings.sentenceLength = parseInt(e.target.value);
      document.getElementById('len-val').textContent = settings.sentenceLength;
      saveSettings();
    };
  }

  function updateModeButtons() {
    const wordBtn = document.getElementById('mode-word');
    const sentBtn = document.getElementById('mode-sentence');
    if (wordBtn) {
      wordBtn.classList.toggle('active', settings.predictionMode === 'word');
    }
    if (sentBtn) {
      sentBtn.classList.toggle('active', settings.predictionMode === 'sentence');
    }
  }

  function updatePanelUI() {
    const status = document.getElementById('trigram-status');
    const toggle = document.getElementById('trigram-toggle');
    if (status) {
      status.textContent = settings.enabled ? 'ON' : 'OFF';
      status.className = 'tri-status-badge ' + (settings.enabled ? 'on' : 'off');
    }
    if (toggle) {
      toggle.innerHTML = settings.enabled ? '⏸ Disable' : '▶ Enable';
      toggle.className = 'tri-power-btn ' + (settings.enabled ? 'enabled' : 'disabled');
    }
  }

  function setupListeners() {
    // Auto-trigger on input
    document.addEventListener('input', e => {
      if (!settings.enabled || !settings.autoPredict) return;
      const target = e.target;
      if (isEditableElement(target)) {
        currentTarget = target;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => autoPredict(target), DEBOUNCE_MS);
      }
    }, true);

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      // Alt+P manual trigger
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (settings.enabled) manualTrigger();
        return;
      }

      // Navigation when dropdown visible
      if (predictionBox.style.display !== 'none') {
        if (e.key === 'Tab') {
          e.preventDefault();
          e.stopPropagation();
          if (currentPredictions[selectedIndex]) insertPrediction(currentPredictions[selectedIndex].word);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedIndex = Math.min(selectedIndex + 1, currentPredictions.length - 1);
          updateSelection();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, 0);
          updateSelection();
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
          hidePredictions();
        }
      }
    }, true);

    // Hide on click outside
    document.addEventListener('click', e => {
      if (!predictionBox.contains(e.target) && !controlPanel.contains(e.target)) {
        hidePredictions();
      }
    });

    document.addEventListener('scroll', () => hidePredictions(), true);
  }

  function isEditableElement(el) {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return tag === 'textarea' || 
           (tag === 'input' && ['text', 'search', 'email', 'url'].includes(el.type)) ||
           el.isContentEditable || el.contentEditable === 'true';
  }

  function getTextFromElement(el) {
    if (!el) return '';
    if (el.tagName?.toLowerCase() === 'textarea' || el.tagName?.toLowerCase() === 'input') {
      return el.value || '';
    }
    return el.textContent || el.innerText || '';
  }

  function getPositionAboveElement(el) {
    const rect = el.getBoundingClientRect();
    return {
      x: Math.max(10, rect.left),
      y: Math.max(10, rect.top - 10)
    };
  }

  async function autoPredict(target) {
    if (!settings.enabled) return;
    
    const text = getTextFromElement(target);
    if (!text || text.length < 3) {
      hidePredictions();
      return;
    }

    const words = getLastTwoWords(text);
    if (!words) {
      hidePredictions();
      return;
    }

    await fetchPredictions(words, target);
  }

  function manualTrigger() {
    let target = document.activeElement;
    if (!isEditableElement(target)) return;

    const text = getTextFromElement(target);
    const words = getLastTwoWords(text);
    if (!words) return;

    currentTarget = target;
    fetchPredictions(words, target);
  }

  async function fetchPredictions(words, target) {
    try {
      if (settings.predictionMode === 'sentence') {
        await fetchSentencePredictions(words, target);
      } else {
        const response = await browser.runtime.sendMessage({
          action: 'predict',
          word1: words.word1,
          word2: words.word2,
          temperature: settings.temperature
        });

        if (response?.success && response.predictions?.length > 0) {
          currentPredictions = response.predictions;
          selectedIndex = 0;
          showPredictions(response.predictions, words, target);
        } else {
          hidePredictions();
        }
      }
    } catch (err) {
      hidePredictions();
    }
  }

  async function fetchSentencePredictions(words, target) {
    const numSentences = 3;
    const sentencePromises = [];

    for (let i = 0; i < numSentences; i++) {
      sentencePromises.push(generateSentence(words.word1, words.word2, settings.sentenceLength));
    }

    const sentences = await Promise.all(sentencePromises);
    const validSentences = sentences.filter(s => s && s.length > 0);

    if (validSentences.length > 0) {
      currentPredictions = validSentences.map((sentence, idx) => ({
        word: sentence,
        probability: 1 - (idx * 0.15)
      }));
      selectedIndex = 0;
      showPredictions(currentPredictions, words, target);
    } else {
      hidePredictions();
    }
  }

  async function generateSentence(word1, word2, length) {
    let sentence = [];
    let w1 = word1;
    let w2 = word2;

    for (let i = 0; i < length; i++) {
      try {
        const response = await browser.runtime.sendMessage({
          action: 'predict',
          word1: w1,
          word2: w2,
          temperature: settings.temperature
        });

        if (response?.success && response.predictions?.length > 0) {
          const topPreds = response.predictions.slice(0, 3);
          const picked = topPreds[Math.floor(Math.random() * topPreds.length)];
          sentence.push(picked.word);
          w1 = w2;
          w2 = picked.word;
        } else {
          break;
        }
      } catch (e) {
        break;
      }
    }

    return sentence.join(' ');
  }

  function getLastTwoWords(text) {
    const clean = text.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const words = clean.split(' ').filter(w => w.length > 0);
    if (words.length < 2) return null;
    return {
      word1: words[words.length - 2].toLowerCase(),
      word2: words[words.length - 1].toLowerCase()
    };
  }

  function showPredictions(predictions, words, target) {
    let html = '';
    predictions.forEach((p, i) => {
      const sel = i === selectedIndex ? ' selected' : '';
      html += `<div data-word="${escapeHtml(p.word)}" class="tri-pred-item${sel}">
        <span class="tri-pred-word">${escapeHtml(p.word)}</span>
        <span class="tri-pred-prob">${(p.probability * 100).toFixed(0)}%</span>
      </div>`;
    });

    html += `<div class="tri-pred-footer">
      <span><kbd>Tab</kbd> accept</span>
      <span><kbd>↑↓</kbd> navigate</span>
      <span><kbd>Esc</kbd> close</span>
    </div>`;

    predictionBox.innerHTML = html;

    // Position above the input element
    if (target) {
      const pos = getPositionAboveElement(target);
      const dropdownHeight = predictions.length * 40 + 32;
      
      predictionBox.style.left = Math.min(pos.x, window.innerWidth - 240) + 'px';
      predictionBox.style.top = Math.max(10, pos.y - dropdownHeight) + 'px';
      predictionBox.style.bottom = 'auto';
    }

    predictionBox.style.display = 'block';

    // Hover effects
    predictionBox.querySelectorAll('[data-word]').forEach((el, i) => {
      el.onmouseenter = () => {
        el.classList.add('selected');
      };
      el.onmouseleave = () => {
        if (i !== selectedIndex) el.classList.remove('selected');
      };
    });
  }

  function hidePredictions() {
    predictionBox.style.display = 'none';
    currentPredictions = [];
    selectedIndex = 0;
  }

  function updateSelection() {
    predictionBox.querySelectorAll('[data-word]').forEach((el, i) => {
      el.classList.toggle('selected', i === selectedIndex);
    });
  }

  function insertPrediction(word) {
    hidePredictions();
    const text = ' ' + word;

    if (currentTarget) {
      if (currentTarget.selectionStart !== undefined) {
        const start = currentTarget.selectionStart;
        const end = currentTarget.selectionEnd;
        const value = currentTarget.value;
        currentTarget.value = value.substring(0, start) + text + value.substring(end);
        currentTarget.selectionStart = currentTarget.selectionEnd = start + text.length;
        currentTarget.focus();
        currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      
      if (currentTarget.isContentEditable || currentTarget.contentEditable === 'true') {
        document.execCommand('insertText', false, text);
        return;
      }
    }

    navigator.clipboard.writeText(text);
  }

  function escapeHtml(t) {
    return String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  init();
})();
