# REST API + Real-Time Frontend - Task Breakdown

## Backend: C REST API Server

### Setup & Dependencies
- [ ] Install libmicrohttpd library
- [ ] Create trigram-api directory structure
- [ ] Setup Makefile for API server

### Core API Server
- [ ] Create api_server.c with HTTP server
- [ ] Implement model loading on startup
- [ ] Add CORS headers for cross-origin requests
- [ ] Implement graceful shutdown

### API Endpoints
- [ ] GET /health - Health check
- [ ] POST /predict - Get predictions
- [ ] GET /stats - Model statistics
- [ ] Add JSON request/response handling

### Integration with Existing Model
- [ ] Link with tree.c, hashmap.c
- [ ] Load model.bin on server start
- [ ] Implement thread-safe prediction calls

---

## Frontend: React Real-Time UI

### Project Setup
- [ ] Create trigram-frontend-api with Vite
- [ ] Install axios for API calls
- [ ] Setup project structure

### Core Components
- [ ] SearchBar.jsx - Main input field
- [ ] PredictionDropdown.jsx - Prediction list
- [ ] PredictionItem.jsx - Individual prediction
- [ ] Stats.jsx - Model statistics display

### Hooks & Services
- [ ] useDebounce.js - Debounce hook (300ms)
- [ ] usePredictions.js - API integration hook
- [ ] api.js - Axios client with base URL

### Features
- [ ] Real-time word extraction (last 2 words)
- [ ] Debounced API calls
- [ ] Dropdown show/hide logic
- [ ] Click to insert prediction
- [ ] Keyboard navigation (↑↓ Enter Esc)
- [ ] Loading states
- [ ] Error handling

### Styling
- [ ] Professional, minimal design
- [ ] Smooth animations
- [ ] Responsive layout
- [ ] Google-style dropdown
- [ ] Hover effects

---

## Integration & Testing

### Backend Testing
- [ ] Test with curl commands
- [ ] Verify CORS headers
- [ ] Check response times
- [ ] Test with large models

### Frontend Testing
- [ ] Test API connection
- [ ] Verify debouncing works
- [ ] Test keyboard navigation
- [ ] Test click-to-insert
- [ ] Test error states

### End-to-End
- [ ] Start backend server
- [ ] Start frontend dev server
- [ ] Test full user flow
- [ ] Performance optimization
- [ ] Bug fixes

---

## Documentation

- [ ] API documentation
- [ ] Frontend README
- [ ] Deployment guide
- [ ] Usage examples
