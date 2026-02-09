# Technical Details - Trigram Language Model System

This document provides comprehensive technical specifications for the Trigram Language Model project, including data structures, algorithms, time/space complexity analysis, and system architecture.

---

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACES                                  │
├───────────────────────────┬──────────────────────────────────────────────────┤
│   React Frontend (Vite)   │        Firefox Extension                         │
│   Port: 3001              │        Content Script + Background               │
└───────────────┬───────────┴─────────────────────┬────────────────────────────┘
                │                                 │
                ▼                                 ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                         HTTP REST API Layer                                   │
│                    libmicrohttpd C Server (Port: 8080/8081)                   │
│                                                                               │
│   Endpoints:                                                                  │
│     POST /predict     → Top-N word predictions with probabilities            │
│     POST /generate    → Beam search sentence generation                      │
│     GET  /health      → Server health check                                  │
│     GET  /stats       → Model statistics                                     │
└───────────────────────────────────────────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                         TRIGRAM LLM ENGINE (C)                                │
│                                                                               │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│   │ N-ary Prefix    │    │ HashMap         │    │ Supporting Structures   │  │
│   │ Tree (Trie)     │    │ (DJB2 + Chain)  │    │ - Queue (Sliding Win)   │  │
│   │                 │    │                 │    │ - SLL (Word Storage)    │  │
│   │ Primary storage │    │ Trigram freq    │    │ - Min-Heap (Top-N)      │  │
│   │ for predictions │    │ counting        │    │                         │  │
│   └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Structures

### 2.1 N-ary Prefix Tree (Trie)

**File:** `trigram_llm/src/tree.c`

The core data structure storing the trigram model as a 3-level prefix tree.

```c
typedef struct TreeNode {
    char *word;                  // Word stored at this node
    int count;                   // Frequency count (only at level 3)
    struct TreeNode **children;  // Dynamic array of child pointers
    int num_children;            // Current number of children
    int capacity;                // Allocated capacity (doubles when full)
} TreeNode;

typedef struct {
    TreeNode *root;              // Root node (word = NULL)
    int total_trigrams;          // Total trigram count
    int vocabulary_size;         // Unique words for smoothing
} LanguageModel;
```

**Structure:**
```
Root (word=NULL)
├── "the" (level 1: first word)
│   ├── "quick" (level 2: second word)
│   │   ├── "brown" (count=150)
│   │   ├── "fox" (count=45)
│   │   └── "dog" (count=30)
│   └── "lazy" (level 2)
│       ├── "dog" (count=89)
│       └── "cat" (count=12)
└── "a" (level 1)
    └── ...
```

**Complexity Analysis:**
| Operation | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| Insert trigram | O(3 × k) where k = avg children | O(1) amortized |
| Find child | O(k) linear scan | O(1) |
| Predict next word | O(k₁ + k₂ + n log n) | O(n) for results |
| Memory per node | - | O(w + c × 8) bytes |

*Where w = word length, c = capacity, n = number of candidates*

---

### 2.2 HashMap with Chaining

**File:** `trigram_llm/src/hashmap.c`

Used during training for counting trigram frequencies before tree construction.

```c
typedef struct HashNode {
    char *key;              // Trigram string "w1 w2 w3"
    int value;              // Frequency count
    struct HashNode *next;  // Chain for collision handling
} HashNode;

typedef struct {
    HashNode **buckets;     // Array of bucket pointers
    int size;               // Number of buckets (default: 100003)
    int count;              // Total unique entries
} HashMap;
```

**Hash Function:** DJB2 Algorithm
```c
unsigned int hash = 5381;
while ((c = *key++))
    hash = ((hash << 5) + hash) + c;  // hash * 33 + c
return hash % size;
```

**Complexity Analysis:**
| Operation | Average Case | Worst Case |
|-----------|-------------|------------|
| Insert | O(1) | O(n) chain length |
| Lookup | O(1) | O(n) chain length |
| Get all entries | O(n + m) | O(n + m) |

*Where n = entries, m = buckets*

---

### 2.3 Queue (Sliding Window)

**File:** `trigram_llm/src/queue.c`

Fixed-size circular queue for sliding window trigram generation.

```c
typedef struct QueueNode {
    char *word;
    struct QueueNode *next;
} QueueNode;

typedef struct {
    QueueNode *front;
    QueueNode *rear;
    int size;
    int max_size;  // Fixed at 3 for trigrams
} Queue;
```

**Operation:** When `size >= max_size`, automatically dequeues oldest element.

**Complexity:**
| Operation | Time | Space |
|-----------|------|-------|
| Enqueue | O(1) | O(1) |
| Dequeue | O(1) | O(1) |
| To Array | O(n) | O(n) |

---

### 2.4 Singly Linked List (SLL)

**File:** `trigram_llm/src/sll.c`

Stores tokenized words from training corpus.

```c
typedef struct SLLNode {
    char *word;
    struct SLLNode *next;
} SLLNode;

typedef struct {
    SLLNode *head;
    SLLNode *tail;  // Tail pointer for O(1) append
    int size;
} SLL;
```

**Complexity:**
| Operation | Time |
|-----------|------|
| Insert at end | O(1) |
| Traverse | O(n) |
| Size | O(1) |

---

## 3. Algorithms

### 3.1 Trigram Generation (Sliding Window)

**File:** `trigram_llm/src/trigram.c`

```
Input:  ["the", "quick", "brown", "fox", "jumps"]
        
Window slides:
  [the, quick, brown] → trigram: "the quick brown"
  [quick, brown, fox] → trigram: "quick brown fox"
  [brown, fox, jumps] → trigram: "brown fox jumps"
```

**Time Complexity:** O(n) where n = total words in corpus

---

### 3.2 Top-N Selection with Min-Heap

**File:** `trigram_llm/src/trigram.c` (`save_trigram_frequencies`)

Uses a min-heap to efficiently find top N most frequent trigrams.

```
Algorithm:
1. Create min-heap of size N
2. For each trigram:
   - If heap.size < N: add to heap
   - Else if freq > heap.min: replace min, heapify
3. Sort heap for final output
```

**Complexity:** O(m × log N) where m = total unique trigrams

---

### 3.3 Stupid Backoff Smoothing

**File:** `trigram_llm/src/tree.c` (`lm_predict_top_n`)

Handles unseen trigram contexts by backing off to lower-order n-grams.

```
Given context (w1, w2):

Level 0 - Full trigram:
  P(w | w1, w2) = count(w1, w2, w) / count(w1, w2, *)
  
Level 1 - Bigram backoff (λ = 0.4):
  P_backoff(w | w2) = λ × count(w2, w) / count(w2, *)
  
Level 2 - Unigram backoff (λ² = 0.16):
  P_backoff(w) = λ² × count(w) / total_count
```

---

### 3.4 Temperature-Scaled Sampling

**File:** `trigram_llm/src/tree.c`

Adjusts prediction diversity using temperature parameter.

```
Scaled probability: P'(w) = count(w)^(1/T) / Σ count(w_i)^(1/T)

Where T = temperature:
  T < 1.0  → More deterministic (favors high-frequency words)
  T = 1.0  → Standard probability distribution
  T > 1.0  → More random (flattens distribution)
```

---

### 3.5 Nucleus (Top-P) Sampling

**File:** `trigram_llm/src/tree.c`

Prunes low-probability candidates before sampling.

```
Algorithm:
1. Sort candidates by probability (descending)
2. Find cutoff where cumulative probability >= 0.9
3. Renormalize within this nucleus
4. Sample N times with rejection for uniqueness
```

---

### 3.6 Beam Search for Sentence Generation

**File:** `trigram_llm/src/tree.c` (`lm_beam_search`)

Generates multiple sentence completions in parallel.

```
Input: context (w1, w2), num_words, beam_width

Algorithm:
1. Initialize beam with single state [(w1, w2), log_prob=0]
2. For each word position:
   a. Expand each beam with top-k predictions
   b. Score: new_log_prob = old_log_prob + log(P(next_word))
   c. Keep only top beam_width beams
3. Return top beam_width complete sentences
```

**Complexity:** O(num_words × beam_width² × k)

---

## 4. API Server

**File:** `trigram_api/src/api_server.c`

Built with GNU `libmicrohttpd` for lightweight HTTP handling.

### Endpoints

| Endpoint | Method | Request Body | Response |
|----------|--------|-------------|----------|
| `/predict` | POST | `{"word1":"the","word2":"quick","temperature":1.0}` | `{"predictions":[{"word":"brown","probability":0.45,"count":150},...]}` |
| `/generate` | POST | `{"word1":"the","word2":"quick","num_words":5,"beam_width":3}` | `{"completions":[{"sentence":"the quick brown fox jumps","probability":0.012},...]}` |
| `/health` | GET | - | `{"status":"ok","model_loaded":true}` |
| `/stats` | GET | - | `{"total_trigrams":1234567,"unique_first_words":5432}` |

### CORS Support
All responses include:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## 5. Firefox Extension

**Files:** `trigram-firefox-extension/`

### Architecture
```
manifest.json          → Extension configuration (Manifest V2)
background.js          → API communication proxy
content.js             → DOM manipulation, UI rendering
popup/                 → Extension popup settings
```

### Features
- **Auto-predict:** Debounced (400ms) predictions as user types
- **Prediction modes:** Word (single) or Sentence (chained)
- **Temperature control:** Adjustable 0.1 - 2.0
- **Keyboard navigation:** Tab (accept), ↑↓ (navigate), Esc (close)

---

## 6. Model Serialization

**Binary Format:** `output/model.bin`

```
Header:
  [int] total_trigrams
  [int] vocabulary_size
  [int] num_first_words

For each first word:
  [int] word_length
  [char*] word
  [int] num_second_words
  
  For each second word:
    [int] word_length
    [char*] word
    [int] num_third_words
    
    For each third word:
      [int] word_length
      [char*] word
      [int] count
```

---

## 7. Performance Characteristics

### Training
| Corpus Size | Trigrams | Memory | Training Time |
|-------------|----------|--------|---------------|
| 1 MB | ~50K | ~20 MB | < 1s |
| 100 MB | ~5M | ~500 MB | ~30s |
| 1 GB | ~50M | ~5 GB | ~5 min |

### Inference
| Operation | Latency |
|-----------|---------|
| Single word prediction | < 1ms |
| Top-5 predictions | 1-2ms |
| Beam search (5 words, width 3) | 5-10ms |

---

## 8. Dependencies

### C Engine
- Standard C library (libc)
- `libmicrohttpd` - HTTP server

### Frontend
- React 18
- Vite 5
- Node.js 18+

### Build Tools
- GCC / Clang
- Make

---

## 9. File Summary

| Component | Language | LOC | Purpose |
|-----------|----------|-----|---------|
| `tree.c` | C | 781 | N-ary trie, predictions, beam search |
| `hashmap.c` | C | 167 | DJB2 hash with chaining |
| `trigram.c` | C | 178 | Sliding window, top-N heap |
| `queue.c` | C | 115 | Fixed-size sliding window |
| `sll.c` | C | 80 | Tokenized word storage |
| `api_server.c` | C | 431 | REST API server |
| `content.js` | JS | 497 | Firefox extension logic |

**Total C Engine:** ~1,752 lines of code
