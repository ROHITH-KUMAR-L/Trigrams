# Trigram Language Model - Real-Time Frontend

Professional React frontend with Google-style autocomplete for trigram predictions.

## Features

- ✨ **Real-time predictions** - No submit button, predictions appear as you type
- ⌨️ **Keyboard navigation** - Use ↑↓ arrows and Enter
- 🎯 **Smart word extraction** - Automatically uses last 2 words
- ⚡ **Debounced API calls** - 300ms delay to avoid spam
- 🎨 **Professional design** - Clean, minimal, modern UI
- 📊 **Live statistics** - Model status and stats

## Prerequisites

1. **Backend API must be running**
   ```bash
   cd ../trigram-api
   ./trigram_api
   ```

2. **Node.js** (v16 or higher)

## Setup

```bash
cd trigram-frontend-api
npm install
```

## Run

```bash
npm run dev
```

Opens at `http://localhost:3000`

## Usage

1. Start typing in the search bar
2. After 2+ words, predictions appear automatically
3. Click a prediction or use keyboard:
   - `↑` / `↓` - Navigate predictions
   - `Enter` - Insert selected prediction
   - `Esc` - Close dropdown

## How It Works

### Real-Time Flow

```
User types "operating system"
    ↓
Extract last 2 words: ["operating", "system"]
    ↓
Debounce 300ms
    ↓
API call: POST /predict
    ↓
Show dropdown with top 5 predictions
    ↓
User clicks "is"
    ↓
Insert into text: "operating system is "
    ↓
Extract last 2 words: ["system", "is"]
    ↓
New predictions...
```

### Components

- **SearchBar** - Main input with dropdown logic
- **PredictionDropdown** - Dropdown container
- **PredictionItem** - Individual prediction row
- **Stats** - Model statistics display

### Hooks

- **useDebounce** - Delays API calls
- **usePredictions** - Fetches predictions from API

## Build for Production

```bash
npm run build
```

Output in `dist/` folder.

## API Integration

Connects to `http://localhost:8080`:
- `POST /predict` - Get predictions
- `GET /stats` - Model statistics
- `GET /health` - Health check

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` | Previous prediction |
| `↓` | Next prediction |
| `Enter` | Insert selected |
| `Esc` | Close dropdown |

## Design

- **Colors**: Purple gradient header, clean white content
- **Font**: Inter (Google Fonts)
- **Animations**: Smooth transitions
- **Responsive**: Works on all screen sizes

---

**No submit button. No waiting. Just type and predict.** 🚀
