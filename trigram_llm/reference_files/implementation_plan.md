# REST API + Real-Time React Frontend Implementation Plan

## 🎯 Goal
Build a professional, real-time trigram prediction system with:
- **Backend**: C REST API server with loaded model
- **Frontend**: React app with Google-style autocomplete
- **Real-time**: Predictions appear as you type (no submit button)

---

## 📋 Architecture Overview

```
┌─────────────────┐
│  React Frontend │  (Port 3000)
│  - Text input   │
│  - Real-time UI │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  C REST API     │  (Port 8080)
│  - Load model   │
│  - /predict     │
│  - CORS enabled │
└─────────────────┘
```

---

## 🔧 Backend: C REST API Server

### Technology Stack
- **HTTP Server**: `libmicrohttpd` (lightweight C HTTP library)
- **JSON**: `cJSON` (JSON parsing/generation)
- **Model**: Pre-loaded trigram model in memory

### API Endpoints

#### 1. `GET /health`
Health check endpoint
```json
Response: { "status": "ok", "model_loaded": true }
```

#### 2. `POST /predict`
Get predictions for word pair
```json
Request:  { "word1": "operating", "word2": "system" }
Response: {
  "predictions": [
    { "word": "is", "probability": 0.45, "count": 28 },
    { "word": "must", "probability": 0.22, "count": 14 },
    { "word": "provides", "probability": 0.16, "count": 10 },
    { "word": "can", "probability": 0.09, "count": 6 },
    { "word": "has", "probability": 0.06, "count": 4 }
  ]
}
```

#### 3. `GET /stats`
Model statistics
```json
Response: {
  "total_trigrams": 149998,
  "unique_trigrams": 45231,
  "unique_words": 1234
}
```

### Implementation Files
```
trigram-api/
├── src/
│   ├── api_server.c       # Main HTTP server
│   ├── api_handlers.c     # Request handlers
│   └── json_utils.c       # JSON helpers
├── include/
│   ├── api_server.h
│   └── json_utils.h
├── Makefile
└── start_server.sh
```

---

## 🎨 Frontend: React Real-Time UI

### Technology Stack
- **Framework**: React + Vite
- **Styling**: Modern CSS (no Tailwind)
- **HTTP Client**: Axios
- **Debouncing**: Custom hook for performance

### Features

#### 1. **Real-Time Input**
- Text input with live word tracking
- Debounced API calls (300ms delay)
- Extracts last 2 words automatically

#### 2. **Google-Style Predictions**
- Dropdown appears below input
- Shows top 5 predictions
- Click to insert prediction
- Keyboard navigation (↑↓ Enter)

#### 3. **Professional Design**
- Clean, minimal interface
- Smooth animations
- Loading states
- Error handling
- Responsive layout

### Component Structure
```
trigram-frontend-api/
├── src/
│   ├── components/
│   │   ├── SearchBar.jsx       # Main input + predictions
│   │   ├── PredictionDropdown.jsx
│   │   ├── PredictionItem.jsx
│   │   └── Stats.jsx
│   ├── hooks/
│   │   ├── useDebounce.js      # Debounce hook
│   │   └── usePredictions.js   # API hook
│   ├── services/
│   │   └── api.js              # Axios API client
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

---

## 🔄 User Flow

1. User types: "operating"
   - No prediction (need 2 words)

2. User types: "operating system"
   - Extract last 2 words: ["operating", "system"]
   - API call: POST /predict
   - Show dropdown with 5 predictions

3. User continues: "operating system is"
   - Extract last 2 words: ["system", "is"]
   - New API call
   - Update dropdown

4. User clicks prediction
   - Insert word into input
   - Continue typing...

---

## 📦 Dependencies

### Backend (C)
```bash
# Ubuntu/Debian
sudo apt-get install libmicrohttpd-dev

# Or build from source
wget https://ftp.gnu.org/gnu/libmicrohttpd/libmicrohttpd-latest.tar.gz
```

### Frontend (React)
```bash
npm install axios
```

---

## 🚀 Implementation Steps

### Phase 1: Backend API (C)
1. ✅ Install libmicrohttpd
2. ✅ Create HTTP server skeleton
3. ✅ Implement /predict endpoint
4. ✅ Add CORS headers
5. ✅ Load model on startup
6. ✅ Test with curl

### Phase 2: Frontend (React)
1. ✅ Create Vite React project
2. ✅ Build SearchBar component
3. ✅ Implement debounce hook
4. ✅ Create API service
5. ✅ Build PredictionDropdown
6. ✅ Add keyboard navigation
7. ✅ Style professionally

### Phase 3: Integration
1. ✅ Test API + Frontend together
2. ✅ Handle edge cases
3. ✅ Add loading states
4. ✅ Error handling
5. ✅ Performance optimization

---

## 🎯 Key Features

### Backend
- ✅ Fast response (< 10ms per request)
- ✅ CORS enabled for localhost:3000
- ✅ Model loaded once at startup
- ✅ Thread-safe request handling
- ✅ JSON responses

### Frontend
- ✅ Real-time predictions (no submit button)
- ✅ Debounced API calls (avoid spam)
- ✅ Smooth animations
- ✅ Keyboard shortcuts
- ✅ Click to insert
- ✅ Professional design
- ✅ Loading indicators
- ✅ Error messages

---

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time | < 10ms |
| Debounce Delay | 300ms |
| Predictions Shown | 5 |
| Model Load Time | < 2s |
| Frontend Bundle Size | < 500KB |

---

## 🔒 Security Considerations

1. **CORS**: Only allow localhost:3000 in development
2. **Input Validation**: Sanitize word inputs
3. **Rate Limiting**: Prevent API abuse (optional)
4. **No Authentication**: Not needed for local demo

---

## 🎨 UI Design Principles

1. **Minimal**: Clean, distraction-free
2. **Fast**: Instant feedback
3. **Intuitive**: Works like Google
4. **Professional**: Modern aesthetics
5. **Accessible**: Keyboard navigation

---

## ✅ Success Criteria

- [ ] Backend API responds in < 10ms
- [ ] Frontend shows predictions as you type
- [ ] No submit button needed
- [ ] Predictions update in real-time
- [ ] Professional, polished UI
- [ ] Works smoothly with large models
- [ ] Keyboard navigation works
- [ ] Click-to-insert works

---

## 🚀 Next Steps

1. Implement C REST API server
2. Build React frontend
3. Test integration
4. Polish UI/UX
5. Create deployment guide
