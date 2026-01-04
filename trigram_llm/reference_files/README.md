# Trigram-Based Statistical Language Model

## 📘 Project Overview

This project implements a **trigram-based statistical language model** using core data structures in C. It demonstrates fundamental DSA concepts while building a simplified version of language modeling used in modern LLMs.

### Key Features
- ✅ **Singly Linked List (SLL)** for dynamic word storage
- ✅ **Queue** for sliding-window trigram generation
- ✅ **Hash Table** for efficient frequency counting
- ✅ **Tree (Trie-like)** for hierarchical language model
- ✅ **Next-word prediction** with probability calculation

---

## 🗂 Project Structure

```
trigram-llm/
├── src/
│   ├── main.c          # Main application
│   ├── sll.c           # Singly Linked List implementation
│   ├── queue.c         # Queue implementation
│   ├── reader.c        # File reading and preprocessing
│   ├── trigram.c       # Trigram generation
│   ├── hashmap.c       # Hash table implementation
│   └── tree.c          # Tree-based language model
├── include/
│   ├── sll.h
│   ├── queue.h
│   ├── reader.h
│   ├── trigram.h
│   ├── hashmap.h
│   └── tree.h
├── data/
│   └── input.txt       # Sample input text
├── output/
│   └── result.txt      # Generated results
└── Makefile            # Build configuration
```

---

## 🚀 How to Compile and Run (Using WSL)

### Prerequisites
- Windows Subsystem for Linux (WSL) installed
- GCC compiler installed in WSL

### Step 1: Open WSL Terminal
```bash
# Open WSL from Windows Terminal or PowerShell
wsl
```

### Step 2: Navigate to Project Directory
```bash
cd /mnt/c/Users/rohit/Documents/DSA-EL/trigram-llm
```

### Step 3: Compile the Project
```bash
make
```

This will:
- Create an `obj/` directory for object files
- Compile all `.c` files
- Link them into the executable `trigram_llm`

### Step 4: Run the Program
```bash
./trigram_llm
```

### Step 5: Interactive Prediction
After the program runs, it will:
1. Read and tokenize `data/input.txt`
2. Generate trigrams using queue-based sliding window
3. Display top 10 most frequent trigrams
4. Build tree-based language model
5. Save results to `output/result.txt`
6. Enter **interactive prediction mode**

In interactive mode:
```
Enter first word: operating
Enter second word: system
Prediction: "is" (probability: 45.23%)

Enter first word: quit
```

---

## 🧪 Testing with Different Input

To test with your own text:
1. Edit `data/input.txt` with your text
2. Recompile and run:
   ```bash
   make clean
   make
   ./trigram_llm
   ```

---

## 🧹 Cleaning Build Files

```bash
make clean
```

This removes:
- `obj/` directory
- `trigram_llm` executable

---

## 📊 Data Structures Used

### 1. Singly Linked List (SLL)
- **Purpose**: Dynamic word storage
- **Time Complexity**: O(1) insertion, O(n) traversal
- **Justification**: Unknown number of words, efficient sequential access

### 2. Queue
- **Purpose**: Sliding window for trigram generation
- **Implementation**: Using linked list (FIFO)
- **Time Complexity**: O(1) enqueue/dequeue
- **Justification**: Perfect for sliding window pattern

### 3. Hash Table
- **Purpose**: Frequency counting
- **Collision Resolution**: Chaining
- **Time Complexity**: O(1) average lookup/insert
- **Justification**: Fast frequency updates

### 4. Tree (Trie-like)
- **Purpose**: Statistical language model
- **Structure**: 3-level tree (word1 → word2 → word3)
- **Time Complexity**: O(1) average insertion/lookup
- **Justification**: Hierarchical representation of language patterns

---

## 🎯 Complexity Analysis

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| Word storage (SLL) | O(n) | O(n) |
| Trigram generation (Queue) | O(n) | O(1) |
| Frequency counting (Hash) | O(1) avg | O(k) |
| Tree insertion | O(1) avg | O(k) |
| Prediction | O(1) avg | O(1) |

**Overall**: O(n) time, O(n + k) space  
where n = number of words, k = unique trigrams

---

## 📝 Sample Output

```
=== TRIGRAM-BASED STATISTICAL LANGUAGE MODEL ===

Step 1: Reading and tokenizing input file...
Read 687 words from file 'data/input.txt'

Step 2: Generating trigrams using queue-based sliding window...
Generated 685 trigrams (234 unique)

=== Top 10 Trigrams ===
 1. "operating system is" - 8 occurrences
 2. "the operating system" - 7 occurrences
 3. "of the operating" - 5 occurrences
 4. "system is a" - 4 occurrences
 5. "operating system to" - 4 occurrences
 ...

Step 3: Building tree-based language model...

=== Language Model Statistics ===
Total trigrams: 685
Unique first words: 156
Unique bigrams (w1, w2): 312

Step 4: Saving results...
Results saved to 'output/result.txt'

=== INTERACTIVE PREDICTION MODE ===
Enter two words to predict the next word (or 'quit' to exit)

Enter first word: operating
Enter second word: system
Prediction: "is" (probability: 42.11%)
```

---

## 🎓 Viva Questions & Answers

### Q1: Why use SLL instead of array?
**A**: Dynamic memory allocation allows handling unknown number of words without pre-allocation. SLL provides O(1) insertion at tail and efficient sequential traversal for trigram generation.

### Q2: Why use Queue for trigram generation?
**A**: Queue's FIFO property perfectly matches the sliding window pattern. We maintain exactly 3 words at a time, automatically removing the oldest when adding new ones.

### Q3: Why use Hash Table for frequency counting?
**A**: Hash tables provide O(1) average-case lookup and insertion, making frequency updates extremely efficient. Chaining handles collisions gracefully.

### Q4: Why use Tree for language model?
**A**: Tree structure naturally represents hierarchical language patterns. Each level represents a word position in the trigram, allowing efficient prefix-based lookup for prediction.

### Q5: How does this relate to modern LLMs?
**A**: This implements the core concept of n-gram language models - predicting next word based on previous context. Modern LLMs use neural networks instead of trees, but the fundamental idea of learning word patterns from data is the same.

---

## 📚 One-Line Description (for Lab Record)

> Implemented a trigram-based statistical language model using Singly Linked Lists, Queues, Hash Tables, and Trees for efficient frequency analysis and next-word prediction.

---

## 👨‍💻 Author

DSA Lab Project - Trigram Language Model  
Demonstrates core data structures in a practical NLP application

---

## 📄 License

Educational project for DSA lab coursework.
