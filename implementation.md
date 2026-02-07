# Trigrams Project Implementation Details

This document provides a detailed breakdown of the files and directories in the Trigrams project.

## 1. Project Root Directory
*   `start.sh`: The main entry point to start the entire stack.
    *   Finds and builds the LLM and API binaries using `make`.
    *   Launches two backend API servers (English text on port 8080, Python code on port 8081).
    *   Starts the Node.js format server (port 5001).
    *   Starts the Vite frontend dev server (port 3001).
*   `start_trigram_stack.sh`: An alternative startup script for Linux/WSL environments.
*   `start_trigram_stack.ps1`: Alternative startup script for PowerShell environments.
*   `Trigram_Analysis.md`: Documentation/analysis of the trigram model's behavior and results.

---

## 2. LLM Engine (`trigram_llm/`)
This is the core C engine that implements the trigram language model using custom data structures.

### `src/` (Engine Implementation)
*   **`main.c`**: Entry point for training and testing. Handles command-line arguments like `--train` or `--test`.
*   **`trigram.c`**: Core logic for the trigram model. It manages the training process (counting occurrences) and prediction logic (calculating probabilities from counts).
*   **`tree.c`**: Implements a Prefix Tree (Trie) where nodes represent the sequence of words. This is the primary storage structure for the model.
*   **`hashmap.c`**: Provides a hash map implementation used for fast lookups of words and frequency counts.
*   **`sll.c`**: Standard Singly Linked List implementation used for collision handling in the hash map and for collecting results.
*   **`queue.c`**: Implementation of a Queue data structure, used in tree traversals or during data processing.
*   **`reader.c`**: Utilities for reading and tokenizing large text files (training data).

### `include/` (Headers)
*   Contains `.h` files defining the interfaces for all modules listed above.

### `output/` & `output_py/`
*   `model.bin`: The serialized binary representation of the trained trigram model (English and Python respectively).
*   `result.txt`: Generated text or diagnostic logs after training/testing.

---

## 3. Backend API Server (`trigram_api/`)
A lightweight C web server that wraps the LLM engine to provide an HTTP interface.

### `src/`
*   **`api_server.c`**: Uses `libmicrohttpd` to handle HTTP requests.
    *   `POST /predict`: Receives two words and returns the top 5 predicted next words as JSON.
    *   `GET /health`: Basic health check.
    *   `GET /stats`: Returns model statistics (total trigrams, unique words).
    *   Handles CORS headers for frontend integration.

---

## 4. Frontend Application (`trigram_frontend_api/`)
A modern React application built with Vite and Tailwind CSS.

### `format_server.js` (Root)
*   A Express/Node.js server that acts as a proxy or utility for formatting Python code. It uses the Groq API (configured via `.env`) to handle advanced code formatting or linting suggestions.

### `src/components/` (React Components)
*   **`CodeEditor.jsx`**: A full-featured code editor where users can type Python code and get real-time trigram-based autocompletion.
*   **`SearchBar.jsx`**: The main interface for the English text prediction demo.
*   **`DataStructureViz.jsx`**: An interactive visualization showing how the Prefix Tree and Hash Map store the trigram data.
*   **`PredictionDropdown.jsx` / `PredictionItem.jsx`**: UI elements for displaying and selecting predicted words.
*   **`Stats.jsx`**: Displays real-time metrics from the API backends.

### `src/App.jsx`
*   Main routing component. Connects the search demo, code editor, and visualization views.

---

## 5. Development Infrastructure
*   `Makefile` (found in both `trigram_llm` and `trigram_api`): Automates the compilation process using `gcc`.
*   `package.json`: Manages Node.js dependencies for the frontend and format server.
*   `vite.config.js`: Configuration for the Vite build engine.
*   `.env`: Stores the `GROQ_API_KEY` for the format server.
