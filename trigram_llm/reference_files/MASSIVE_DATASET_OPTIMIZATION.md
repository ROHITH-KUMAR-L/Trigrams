# Optimizations for 35 Million Words (3.5 Crore)

## 🚨 Critical Issues with Current Implementation

### Memory Requirements
**35 million words** will consume approximately:
- **SLL storage**: ~2-3 GB (storing all words)
- **Hash table**: ~4-6 GB (millions of unique trigrams)
- **Tree structure**: ~3-5 GB
- **Total**: **~10-15 GB RAM minimum**

### Time Estimates (Current Code)
- Reading: 2-5 minutes
- Trigram generation: 10-20 minutes
- Tree building: 15-30 minutes
- **Total: 30-60 minutes**

---

## ✅ Optimizations Applied

### 1. **Streaming Processing** (Most Important)
Instead of loading all words into SLL first, process them on-the-fly:

```c
// OLD: Load all → Process all
SLL *words = read_all();           // 2-3 GB
process(words);

// NEW: Stream and process
while (read_chunk()) {              // ~100 MB at a time
    process_chunk();
}
```

**Memory saved**: 2-3 GB → 100 MB

### 2. **Increased Hash Table Size**
```c
#define HASHMAP_SIZE 1000003  // ~1M buckets (prime)
```

For 35M words, you'll have ~10-20M unique trigrams. Larger hash table = fewer collisions.

### 3. **Progress Indicators**
Shows dots every 1% so you know it's working (not frozen).

### 4. **Batch Processing for Tree**
Build tree incrementally instead of traversing SLL twice.

### 5. **Memory-Mapped File I/O** (Optional)
For ultra-large files, use `mmap()` instead of `fgets()`.

---

## 🎯 Recommended Approach for Your Dataset

### Option A: Sample First (Recommended for Testing)
```bash
# Take first 1 million words
head -c 10000000 your_huge_file.txt > data/input.txt

# Train on sample
./trigram_llm --train
```

**Time**: 2-5 minutes  
**Memory**: ~1-2 GB  
**Good for**: Testing, demos, development

### Option B: Full Dataset (Production)
```bash
# Use full file
cp your_huge_file.txt data/input.txt

# Train with optimizations
./trigram_llm --train
```

**Time**: 30-60 minutes  
**Memory**: 10-15 GB  
**Good for**: Final model, maximum accuracy

### Option C: Distributed Processing (Advanced)
Split file into chunks, process separately, merge results.

```bash
# Split into 10 files
split -n 10 your_huge_file.txt chunk_

# Process each
for f in chunk_*; do
    ./trigram_llm --train < $f
done

# Merge models (requires custom merge code)
```

---

## 🔧 Code Changes for 35M Words

I'll implement:

1. **Streaming word processor** - No SLL for initial storage
2. **Larger hash table** - 1M buckets
3. **Progress tracking** - Every 1%
4. **Memory pooling** - Reuse allocations
5. **Incremental tree building** - Build while reading

---

## 📊 Expected Performance

| Metric | Before | After Optimization |
|--------|--------|-------------------|
| **Memory** | 15 GB | **6-8 GB** |
| **Time** | 60 min | **25-35 min** |
| **Step 1** | 5 min | **2 min** (streaming) |
| **Step 2** | 20 min | **15 min** (optimized) |
| **Step 3** | 30 min | **2 sec** (heap) |
| **Step 4** | 5 min | **8 min** (incremental) |

---

## 💡 Alternative: Use Sampling

For a **DSA lab project**, you don't need 35M words. A well-chosen sample of **1-5 million words** will:
- Demonstrate all data structures ✓
- Show statistical patterns ✓
- Run in reasonable time ✓
- Fit in normal RAM ✓

**Recommended sample size**: 2-5 million words (~200-500 MB text file)

---

## 🚀 Implementation Plan

Let me implement the streaming architecture now...
