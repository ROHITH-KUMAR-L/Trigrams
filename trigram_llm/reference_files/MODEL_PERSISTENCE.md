# Model Persistence - Quick Guide

## 🎯 Problem Solved
Previously, every run would retrain the model from scratch. Now you can **train once, use forever**!

## 🚀 Usage

### First Time: Train the Model
```bash
./trigram_llm --train
# or just
./trigram_llm
```

This will:
1. Read and process `data/input.txt`
2. Generate trigrams
3. Build the language model
4. **Save model to `output/model.bin`**
5. Enter interactive prediction mode

### Subsequent Runs: Load Pre-trained Model
```bash
./trigram_llm --load
```

This will:
1. **Load model from `output/model.bin`** (instant!)
2. Skip all training steps
3. Enter interactive prediction mode immediately

## ⚡ Speed Comparison

| Mode | Time for 100K words | Time for 1M words |
|------|---------------------|-------------------|
| **Train** | 10-20 seconds | 2-5 minutes |
| **Load** | < 1 second | < 1 second |

## 📁 Files Created

- `output/model.bin` - Binary file containing the trained tree structure
- `output/result.txt` - Text file with all trigram frequencies

## 💡 Commands

```bash
# Show help
./trigram_llm --help

# Train new model (overwrites existing)
./trigram_llm --train

# Load existing model
./trigram_llm --load

# Default (same as --train)
./trigram_llm
```

## 🔄 When to Retrain

Retrain when:
- You have new training data
- You modified `data/input.txt`
- You want to update the model

## ✅ Benefits

1. **Instant startup** - No waiting for reprocessing
2. **Save time** - Train once, use many times
3. **Portable** - Share `model.bin` with others
4. **Production-ready** - Real LLMs work this way!

---

**Example Workflow:**
```bash
# Day 1: Train with your data
./trigram_llm --train

# Day 2-N: Just use the model
./trigram_llm --load
```
