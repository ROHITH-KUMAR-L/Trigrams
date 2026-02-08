# Trigram Autofill - Firefox Extension

A Firefox browser extension that provides AI-powered text prediction using a locally running trigram language model. Works with Google Docs and Microsoft Word Online.

## Features

- 🔮 **Real-time Predictions**: Get word suggestions as you type
- 🏠 **100% Local**: All predictions come from your local trigram server - no data leaves your machine
- 📝 **Works with Popular Editors**: Google Docs and Word Online support
- ⚡ **Fast**: Debounced input handling for smooth typing experience
- ⚙️ **Configurable**: Adjust temperature for creativity, custom API URL
- 🎨 **Beautiful UI**: Modern glassmorphism design

## Prerequisites

Before using this extension, you need to have the trigram API server running locally:

```bash
cd /home/raghottam/RVCE/DSA-EL/Trigrams
./start.sh
```

This starts the trigram API on `http://127.0.0.1:8080`.

## Installation

### Method 1: Temporary Installation (Development)

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..."
4. Navigate to the extension folder and select `manifest.json`

### Method 2: Permanent Installation

1. Package the extension:
   ```bash
   cd trigram-firefox-extension
   zip -r ../trigram-autofill.xpi .
   ```
2. Open Firefox and navigate to `about:addons`
3. Click the gear icon → "Install Add-on From File..."
4. Select the `.xpi` file

## Usage

1. **Start the Trigram Server**: Make sure your local trigram API is running on port 8080

2. **Enable the Extension**: Click the extension icon in the toolbar to verify it's connected

3. **Start Typing**: 
   - Open Google Docs or Word Online
   - Type at least two words
   - Predictions will appear below your cursor

4. **Accept Predictions**:
   - Press `Tab` to accept the top prediction
   - Use `↑`/`↓` arrows to navigate suggestions
   - Press `Enter` to accept selected prediction
   - Press `Escape` to dismiss

## Configuration

Click the extension icon to access settings:

| Setting | Description | Default |
|---------|-------------|---------|
| Enable Autofill | Turn predictions on/off | On |
| Temperature | Creativity level (0.1-2.0) | 1.0 |
| API URL | Trigram server address | `http://127.0.0.1:8080` |

## File Structure

```
trigram-firefox-extension/
├── manifest.json      # Extension manifest
├── background.js      # API communication
├── content.js         # Editor integration
├── content.css        # Prediction dropdown styles
├── popup/
│   ├── popup.html     # Settings popup
│   ├── popup.js       # Popup logic
│   └── popup.css      # Popup styles
└── icons/
    ├── icon-48.png    # Toolbar icon
    └── icon-96.png    # High-res icon
```

## How It Works

1. **Content Script** (`content.js`): Injected into Google Docs/Word Online pages. It:
   - Monitors text input using MutationObserver
   - Extracts the last two words before the cursor
   - Positions the prediction dropdown

2. **Background Script** (`background.js`): Acts as a bridge between content scripts and the API:
   - Sends POST requests to `/predict` endpoint
   - Caches configuration in browser storage
   - Handles health checks and statistics

3. **Trigram API**: Your local C-based server that:
   - Loads the trained trigram model
   - Returns top-5 word predictions with probabilities

## Troubleshooting

### "Cannot connect to API"
- Ensure the trigram server is running: `./start.sh`
- Check if port 8080 is available
- Try using `127.0.0.1` instead of `localhost`

### Predictions not showing in Google Docs
- Google Docs uses canvas rendering which can be tricky
- Try refreshing the page after installing the extension
- Check the browser console for errors (F12 → Console)

### Extension not loading
- Check `about:debugging` for error messages
- Ensure all files are present in the extension folder
- Verify `manifest.json` syntax is valid

## Development

To modify and test the extension:

1. Make your changes to the source files
2. Go to `about:debugging` → This Firefox
3. Click "Reload" on the extension
4. Refresh the Google Docs/Word Online page

## License

MIT License - Part of the Trigrams DSA-EL Project

## Credits

- Trigram language model implemented in C
- Uses libmicrohttpd for the API server
- Firefox WebExtension APIs
