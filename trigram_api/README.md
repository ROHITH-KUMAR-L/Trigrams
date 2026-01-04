# Trigram API Server

REST API backend for trigram language model predictions.

## Prerequisites

### Install libmicrohttpd

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install libmicrohttpd-dev
```

**Arch Linux:**
```bash
sudo pacman -S libmicrohttpd
```

**From source:**
```bash
wget https://ftp.gnu.org/gnu/libmicrohttpd/libmicrohttpd-latest.tar.gz
tar -xzf libmicrohttpd-latest.tar.gz
cd libmicrohttpd-*
./configure
make
sudo make install
```

## Build

```bash
cd trigram-api
make
```

## Run

```bash
# Make sure you have a trained model first
cd ../trigram-llm
./trigram_llm --train  # Creates output/model.bin

# Start API server
cd ../trigram-api
./trigram_api
```

Server will start on `http://localhost:8080`

## API Endpoints

### GET /health
Health check

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true
}
```

### GET /stats
Model statistics

**Response:**
```json
{
  "total_trigrams": 149998,
  "unique_first_words": 1234
}
```

### POST /predict
Get top 5 predictions

**Request:**
```json
{
  "word1": "operating",
  "word2": "system"
}
```

**Response:**
```json
{
  "predictions": [
    {"word": "is", "probability": 0.4516, "count": 28},
    {"word": "must", "probability": 0.2258, "count": 14},
    {"word": "provides", "probability": 0.1613, "count": 10},
    {"word": "can", "probability": 0.0968, "count": 6},
    {"word": "has", "probability": 0.0645, "count": 4}
  ]
}
```

## Test with curl

```bash
# Health check
curl http://localhost:8080/health

# Stats
curl http://localhost:8080/stats

# Predict
curl -X POST http://localhost:8080/predict \
  -H "Content-Type: application/json" \
  -d '{"word1":"operating","word2":"system"}'
```

## CORS

CORS is enabled for all origins (`*`) to allow frontend development.

## Performance

- Model loaded once at startup
- Response time: < 10ms per request
- Supports concurrent requests
