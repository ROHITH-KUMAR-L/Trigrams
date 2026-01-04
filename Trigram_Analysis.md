# Trigram Analysis

This document explains the Trigrams project, the statistical language model it implements, and how the backend and frontend collaborate to deliver real-time predictions.

## Repository Overview

- **`trigram_llm`** – C implementation of the trigram language model, covering training, prediction, and serialization.@trigram_llm/src/main.c#72-194
- **`trigram_api`** – REST API built with libmicrohttpd that loads the model and exposes health, statistics, and prediction endpoints.@trigram_api/src/api_server.c#1-285
- **`trigram_frontend_api`** – React/Vite frontend that calls the API to provide autocomplete-style UI.@trigram_frontend_api/src/App.jsx#1-24

## What is a Trigram?

A trigram is an ordered sequence of three consecutive tokens. The project builds a statistical language model by counting how often each trigram occurs in the training corpus and using those counts to predict the most likely third word given two predecessors.@trigram_llm/src/trigram.c#22-71

## Core Processing Pipeline

1. **Tokenization** – Training reads the input text, normalizes to lowercase, replaces punctuation with spaces, and stores each word in a singly linked list for linear traversal.@trigram_llm/src/reader.c#7-63 @trigram_llm/src/sll.c#6-79
2. **Trigram extraction** – A fixed-size queue forms a sliding window over the word list; once three words are in the window, a trigram string is created and counted in a hash map.@trigram_llm/src/queue.c#7-114 @trigram_llm/src/trigram.c#22-71 @trigram_llm/src/hashmap.c#7-69
3. **Frequency reporting** – Trigram frequencies can be written to stdout or a file, using a min-heap to efficiently retrieve the top-N most common entries.@trigram_llm/src/trigram.c#74-175
4. **Language-model construction** – The data is replayed to build a three-level tree structure that maps first and second words to possible third words and their counts.@trigram_llm/src/tree.c#42-208
5. **Persistence** – The trained model is serialized to `output/model.bin`, storing the hierarchical tree so it can be reloaded without retraining.@trigram_llm/src/tree.c#256-366
6. **Interactive CLI** – After training or loading, the CLI allows interactive prediction sessions for manual testing.@trigram_llm/src/main.c#35-69

## Algorithms and Data Structures

- **Singly Linked List (SLL)** – Maintains token order during tokenization and training.@trigram_llm/src/sll.c#6-79
- **Queue-based sliding window** – Maintains the last three words to generate trigrams in O(1) per step.@trigram_llm/src/queue.c#7-114
- **Hash map with djb2 hashing** – Maps trigram strings to frequency counts using separate chaining for collisions.@trigram_llm/src/hashmap.c#7-107
- **Min-heap for top-N** – Keeps only the most frequent trigrams when a limit is requested, operating in O(N log k).@trigram_llm/src/trigram.c#118-175
- **Tree-based language model** – Multi-level tree storing counts per context, enabling quick lookup of predictions and probabilities.@trigram_llm/src/tree.c#90-208
- **Binary serialization** – Writes the language model tree to disk and reconstructs it at load time, preserving counts and hierarchy.@trigram_llm/src/tree.c#256-366

## Backend Service Architecture (`trigram_api`)

- Loads the serialized model on startup and keeps it in memory.@trigram_api/src/api_server.c#226-285
- Starts an HTTP daemon on port 8080 via GNU libmicrohttpd.@trigram_api/src/api_server.c#227-248
- Adds CORS headers to every response to allow browser clients.@trigram_api/src/api_server.c#12-45
- Routes requests:
  - `GET /health` – Indicates server status and whether the model is loaded.@trigram_api/src/api_server.c#48-56
  - `GET /stats` – Reports total trigram count and unique first-word count.@trigram_api/src/api_server.c#58-71
  - `POST /predict` – Parses JSON `{ word1, word2 }`, queries the language model via `lm_predict_top_n`, and returns predictions with probabilities and counts.@trigram_api/src/api_server.c#74-143

## Frontend Application Architecture (`trigram_frontend_api`)

- **`SearchBar` component** – Manages user input, listens for keyboard navigation, and inserts selected predictions into the text area.@trigram_frontend_api/src/components/SearchBar.jsx#6-70
- **`usePredictions` hook** – Debounces typing by 300 ms, extracts the last two words, and fetches predictions using the API service.@trigram_frontend_api/src/hooks/useDebounce.js#3-17 @trigram_frontend_api/src/hooks/usePredictions.js#5-33
- **`Stats` component** – Fetches `/stats` and `/health` to display model status and counts.@trigram_frontend_api/src/components/Stats.jsx#5-42
- **API service (`services/api.js`)** – Configures Axios to call `http://127.0.0.1:8080` with helper methods for predictions, stats, and health checks.@trigram_frontend_api/src/services/api.js#1-40

## Frontend–Backend Integration Flow

1. Axios client is configured with the backend base URL and JSON headers.@trigram_frontend_api/src/services/api.js#1-18
2. User typing triggers `usePredictions`; after debounce, the last two words are sent to `POST /predict`.
3. The backend validates the request, queries `lm_predict_top_n`, and returns an array of `{ word, probability, count }`.
4. `SearchBar` renders predictions in `PredictionDropdown` and allows selection via keyboard or mouse.@trigram_frontend_api/src/components/SearchBar.jsx#18-64
5. `Stats` periodically polls `/stats` and `/health` to reflect server health and model metrics.@trigram_frontend_api/src/components/Stats.jsx#9-42

## Summary

The Trigrams project combines classic data-structure-based NLP (queues, hash maps, trees) with a lightweight HTTP API and a modern React interface. Training converts raw text into a persistent trigram model, the backend exposes it over REST, and the frontend delivers an interactive next-word prediction experience.
