/**
 * Trigram Autofill - Content Script (v9 - Word/Sentence Mode)
 * - Choose between word and sentence prediction
 * - Settings panel with all controls
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

  // Settings (synced with storage)
  let settings = {
    enabled: true,
    temperature: 1.0,
    autoPredict: true,
    predictionMode: 'word', // 'word' or 'sentence'
    sentenceLength: 5 // words in sentence prediction
  };

  const DEBOUNCE_MS = 400;

  console.log('[Trigram] v9 loading...');

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
    // Control panel (floating in corner)
    document.querySelectorAll('#trigram-panel').forEach(e => e.remove());
    controlPanel = document.createElement('div');
    controlPanel.id = 'trigram-panel';
    controlPanel.innerHTML = `
      <div id="trigram-header" style="display:flex;align-items:center;gap:8px;cursor:pointer;">
        <span style="font-size:20px;">🔮</span>
        <span style="font-weight:600;color:#e5e7eb;">Trigram</span>
        <span id="trigram-status" style="font-size:11px;padding:2px 6px;border-radius:10px;
          background:${settings.enabled ? '#059669' : '#6b7280'};color:#fff;">
          ${settings.enabled ? 'ON' : 'OFF'}
        </span>
      </div>
      <div id="trigram-settings" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid #374151;">
        <!-- Prediction Mode -->
        <div style="margin-bottom:10px;">
          <span style="color:#9ca3af;font-size:11px;display:block;margin-bottom:4px;">Mode</span>
          <div style="display:flex;gap:4px;">
            <button id="mode-word" style="flex:1;padding:5px;border:none;border-radius:5px;font-size:11px;cursor:pointer;
              background:${settings.predictionMode === 'word' ? '#6366f1' : '#374151'};
              color:${settings.predictionMode === 'word' ? '#fff' : '#9ca3af'};">
              📝 Word
            </button>
            <button id="mode-sentence" style="flex:1;padding:5px;border:none;border-radius:5px;font-size:11px;cursor:pointer;
              background:${settings.predictionMode === 'sentence' ? '#6366f1' : '#374151'};
              color:${settings.predictionMode === 'sentence' ? '#fff' : '#9ca3af'};">
              📄 Sentence
            </button>
          </div>
        </div>
        <!-- Sentence Length (only show for sentence mode) -->
        <div id="sentence-length-row" style="margin-bottom:8px;display:${settings.predictionMode === 'sentence' ? 'block' : 'none'};">
          <span style="color:#9ca3af;font-size:11px;">Words: <span id="len-val">${settings.sentenceLength}</span></span>
          <input type="range" id="trigram-len" min="3" max="10" step="1" value="${settings.sentenceLength}"
            style="width:100%;margin-top:2px;accent-color:#6366f1;">
        </div>
        <!-- Auto-predict -->
        <label style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="color:#9ca3af;font-size:12px;">Auto-predict</span>
          <input type="checkbox" id="trigram-auto" ${settings.autoPredict ? 'checked' : ''} 
            style="width:16px;height:16px;accent-color:#6366f1;">
        </label>
        <!-- Temperature -->
        <label style="display:block;margin-bottom:8px;">
          <span style="color:#9ca3af;font-size:11px;">Temperature: <span id="temp-val">${settings.temperature}</span></span>
          <input type="range" id="trigram-temp" min="0.1" max="2.0" step="0.1" value="${settings.temperature}"
            style="width:100%;margin-top:2px;accent-color:#6366f1;">
        </label>
        <!-- Toggle Button -->
        <button id="trigram-toggle" style="width:100%;margin-top:4px;padding:6px;border:none;border-radius:6px;
          background:${settings.enabled ? '#dc2626' : '#059669'};color:#fff;font-size:12px;font-weight:600;cursor:pointer;">
          ${settings.enabled ? '⏸ Disable' : '▶ Enable'}
        </button>
      </div>
    `;
    Object.assign(controlPanel.style, {
      position: 'fixed', bottom: '20px', right: '20px',
      background: '#1f2937', border: '1px solid #374151', borderRadius: '12px',
      padding: '10px 14px', zIndex: '2147483647',
      fontFamily: 'system-ui, sans-serif', fontSize: '13px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)', minWidth: '160px'
    });
    document.body.appendChild(controlPanel);

    // Event handlers for panel
    document.getElementById('trigram-header').onclick = () => {
      const settingsDiv = document.getElementById('trigram-settings');
      settingsDiv.style.display = settingsDiv.style.display === 'none' ? 'block' : 'none';
    };

    document.getElementById('trigram-toggle').onclick = () => {
      settings.enabled = !settings.enabled;
      updatePanelUI();
      saveSettings();
      if (!settings.enabled) hidePredictions();
    };

    document.getElementById('trigram-auto').onchange = (e) => {
      settings.autoPredict = e.target.checked;
      saveSettings();
    };

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
      document.getElementById('sentence-length-row').style.display = 'block';
      saveSettings();
    };

    document.getElementById('trigram-len').oninput = (e) => {
      settings.sentenceLength = parseInt(e.target.value);
      document.getElementById('len-val').textContent = settings.sentenceLength;
      saveSettings();
    };

    // Prediction dropdown
    document.querySelectorAll('#trigram-dropdown').forEach(e => e.remove());
    predictionBox = document.createElement('div');
    predictionBox.id = 'trigram-dropdown';
    Object.assign(predictionBox.style, {
      position: 'fixed', zIndex: '2147483646',
      minWidth: '200px', maxWidth: '400px', background: '#1a1a2e',
      border: '2px solid #6366f1', borderRadius: '10px',
      boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
      fontFamily: 'system-ui, sans-serif',
      display: 'none'
    });
    predictionBox.addEventListener('click', e => {
      const item = e.target.closest('[data-word]');
      if (item) insertPrediction(item.dataset.word);
    });
    document.body.appendChild(predictionBox);
  }

  function updateModeButtons() {
    const wordBtn = document.getElementById('mode-word');
    const sentBtn = document.getElementById('mode-sentence');
    if (wordBtn) {
      wordBtn.style.background = settings.predictionMode === 'word' ? '#6366f1' : '#374151';
      wordBtn.style.color = settings.predictionMode === 'word' ? '#fff' : '#9ca3af';
    }
    if (sentBtn) {
      sentBtn.style.background = settings.predictionMode === 'sentence' ? '#6366f1' : '#374151';
      sentBtn.style.color = settings.predictionMode === 'sentence' ? '#fff' : '#9ca3af';
    }
  }

  function updatePanelUI() {
    const status = document.getElementById('trigram-status');
    const toggle = document.getElementById('trigram-toggle');
    if (status) {
      status.textContent = settings.enabled ? 'ON' : 'OFF';
      status.style.background = settings.enabled ? '#059669' : '#6b7280';
    }
    if (toggle) {
      toggle.textContent = settings.enabled ? '⏸ Disable' : '▶ Enable';
      toggle.style.background = settings.enabled ? '#dc2626' : '#059669';
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
    // Position ABOVE the element, not below
    return {
      x: Math.max(10, rect.left),
      y: Math.max(10, rect.top - 10) // Above the element
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
        // Sentence mode: chain multiple predictions
        await fetchSentencePredictions(words, target);
      } else {
        // Word mode: single prediction
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
    const numSentences = 3; // Generate 3 sentence options
    const sentencePromises = [];

    for (let i = 0; i < numSentences; i++) {
      sentencePromises.push(generateSentence(words.word1, words.word2, settings.sentenceLength));
    }

    const sentences = await Promise.all(sentencePromises);
    const validSentences = sentences.filter(s => s && s.length > 0);

    if (validSentences.length > 0) {
      // Convert to prediction format
      currentPredictions = validSentences.map((sentence, idx) => ({
        word: sentence,
        probability: 1 - (idx * 0.15) // Decreasing probability for display
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
          // Pick randomly from top predictions for variety
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
      const sel = i === selectedIndex;
      html += `<div data-word="${escapeHtml(p.word)}" 
        style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;cursor:pointer;
        background:${sel ? '#4338ca' : 'transparent'};border-left:${sel ? '3px solid #818cf8' : '3px solid transparent'};">
        <span style="color:${sel ? '#e0e7ff' : '#d1d5db'};font-size:13px;font-weight:500;">${escapeHtml(p.word)}</span>
        <span style="font-size:10px;color:#6b7280;background:#1e293b;padding:2px 6px;border-radius:8px;">
          ${(p.probability * 100).toFixed(0)}%
        </span>
      </div>`;
    });

    // Add hint at bottom
    html += `<div style="padding:6px 10px;background:#0f172a;border-top:1px solid #334155;font-size:10px;color:#64748b;text-align:center;">
      Tab to accept • ↑↓ navigate • Esc close
    </div>`;

    predictionBox.innerHTML = html;

    // Position ABOVE the input element
    if (target) {
      const pos = getPositionAboveElement(target);
      const dropdownHeight = predictions.length * 36 + 30; // Approximate height
      
      predictionBox.style.left = Math.min(pos.x, window.innerWidth - 220) + 'px';
      predictionBox.style.top = Math.max(10, pos.y - dropdownHeight) + 'px';
      predictionBox.style.bottom = 'auto';
    }

    predictionBox.style.display = 'block';

    // Hover effects
    predictionBox.querySelectorAll('[data-word]').forEach((el, i) => {
      el.onmouseenter = () => el.style.background = '#3730a3';
      el.onmouseleave = () => el.style.background = i === selectedIndex ? '#4338ca' : 'transparent';
    });
  }

  function hidePredictions() {
    predictionBox.style.display = 'none';
    currentPredictions = [];
    selectedIndex = 0;
  }

  function updateSelection() {
    predictionBox.querySelectorAll('[data-word]').forEach((el, i) => {
      const sel = i === selectedIndex;
      el.style.background = sel ? '#4338ca' : 'transparent';
      el.style.borderLeft = sel ? '3px solid #818cf8' : '3px solid transparent';
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
