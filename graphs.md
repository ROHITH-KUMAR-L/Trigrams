# Graph Analysis & Statistical Distributions

This document provides an in-depth analysis of all graphs and visualizations in the Trigram Language Model project, explaining the underlying statistical distributions, mathematical foundations, and why these distributions occur naturally in language data.

---

## Table of Contents

1. [Trigram Frequency Distribution (Zipf's Law)](#1-trigram-frequency-distribution-zipfs-law)
2. [Perplexity vs Training Data](#2-perplexity-vs-training-data)
3. [Top-K Prediction Accuracy](#3-top-k-prediction-accuracy)
4. [Smoothing Technique Comparison](#4-smoothing-technique-comparison)
5. [Vocabulary Coverage & Backoff Analysis](#5-vocabulary-coverage--backoff-analysis)
6. [API Response Time Distribution](#6-api-response-time-distribution)

---

## 1. Trigram Frequency Distribution (Zipf's Law)

### Overview
The trigram frequency distribution graph shows the relationship between trigram rank (sorted by frequency) and their occurrence count in the training corpus.

### Statistical Distribution: **Power Law (Zipf's Law)**

#### Mathematical Formula
```
f(r) = C / r^α
```
Where:
- `f(r)` = frequency of the r-th most common trigram
- `r` = rank (1, 2, 3, ...)
- `α` = Zipf exponent (typically ≈ 1.0 for natural language)
- `C` = normalization constant

#### Log-Log Form
When plotted on log-log axes:
```
log(f) = log(C) - α · log(r)
```
This produces a **straight line** with slope `-α`.

### Why This Distribution Occurs

#### Linguistic Explanation
1. **Preferential Attachment**: Common phrases reinforce themselves - once a trigram is popular, it's more likely to be used again
2. **Limited Working Memory**: Humans tend to reuse familiar phrase patterns
3. **Cognitive Economy**: Language evolved to minimize mental effort, favoring frequent combinations
4. **Semantic Clustering**: Related concepts tend to co-occur in predictable patterns

#### Information-Theoretic Explanation
Zipf's law emerges from the principle of **least effort** in communication:
- **Speaker's effort**: Minimize vocabulary (use few words repeatedly)
- **Listener's comprehension**: Maximize distinctiveness (use diverse words)
- The equilibrium between these forces produces Zipf distribution

#### Mathematical Proof (Simplified)
Consider a generative process where:
1. Start with one trigram
2. At each step, either:
   - Repeat an existing trigram with probability ∝ its current frequency
   - Create a new trigram with small constant probability

This "rich-get-richer" process (Yule-Simon model) provably converges to a power law distribution.

### Graph Characteristics

| Graph Element | Description |
|---------------|-------------|
| **X-axis** | Trigram rank (1 = most frequent) |
| **Y-axis** | Occurrence count |
| **Scale** | Log-log |
| **Expected Shape** | Straight diagonal line (slope ≈ -1) |
| **Head** | Few high-frequency trigrams (e.g., "one of the", "in the world") |
| **Tail** | Many low-frequency trigrams (hapax legomena - occur once) |

### Real-World Example
```
Rank  Trigram               Count    f(r) ≈ C/r
1     "one of the"         5,000    5,000
2     "in the world"       2,500    2,500 ≈ 5000/2
3     "at the end"         1,667    1,667 ≈ 5000/3
10    "for the first"        500      500 ≈ 5000/10
100   "with respect to"       50       50 ≈ 5000/100
```

---

## 2. Perplexity vs Training Data

### Overview
Perplexity measures how "surprised" the model is by the test data. Lower perplexity = better prediction quality.

### Statistical Distribution: **Exponential Decay**

#### Mathematical Formula
```
Perplexity(W) = P(w₁, w₂, ..., wₙ)^(-1/n)
             = 2^H(W)
```
Where:
- `H(W)` = cross-entropy of the test corpus
- `n` = number of words
- `P(...)` = probability assigned by the model

#### Simplified for Trigrams
```
PPL = exp(-1/N ∑ log P(wᵢ | wᵢ₋₂, wᵢ₋₁))
```

### Why Perplexity Decreases with Training Data

#### Statistical Explanation
As training data increases:
1. **Better Coverage**: More trigrams observed, fewer unseen combinations
2. **More Accurate Probabilities**: Frequency estimates converge to true distribution (Law of Large Numbers)
3. **Lower Variance**: Confidence intervals tighten around probability estimates

#### Learning Curve Model
The perplexity reduction typically follows a **power law**:
```
PPL(n) = PPL_∞ + A · n^(-β)
```
Where:
- `n` = amount of training data
- `PPL_∞` = asymptotic perplexity (minimum achievable)
- `β` ≈ 0.3 - 0.5 for n-gram models
- `A` = model-specific constant

### Graph Characteristics

| Graph Element | Description |
|---------------|-------------|
| **X-axis** | Training corpus size (words or MB) |
| **Y-axis** | Perplexity score |
| **Expected Shape** | Exponential decay, plateaus at large n |
| **Interpretation** | Steep drop initially, then diminishing returns |

### Typical Values

| Corpus Size | Perplexity | Quality |
|-------------|-----------|---------|
| 1K words | 500-800 | Poor |
| 10K words | 200-350 | Fair |
| 100K words | 80-150 | Good |
| 1M words | 40-80 | Very good |
| 10M+ words | 20-50 | Excellent |

---

## 3. Top-K Prediction Accuracy

### Overview
Measures the percentage of times the correct next word appears in the model's top-K predictions.

### Statistical Distribution: **Cumulative Distribution Function**

#### Mathematical Formula
```
Accuracy@K = P(correct word ∈ top-K predictions)
           = ∑ᵢ₌₁ᴷ P(wᵢ is correct)
```

For a perfect ranking:
```
Accuracy@1 ≤ Accuracy@3 ≤ Accuracy@5 ≤ Accuracy@10
```

### Why Accuracy Follows This Pattern

#### Information-Theoretic Explanation
Natural language has inherent **ambiguity and entropy**:
- Multiple valid continuations exist for most contexts
- True distribution is often **multi-modal** (several likely words)
- Top-1 accuracy limited by this irreducible uncertainty

#### Empirical Model
Accuracy typically follows a **logarithmic growth**:
```
Accuracy@K = A · log(K + 1)
```

For trigram models trained on large corpora:
```
Accuracy@1 ≈ 30-40%
Accuracy@5 ≈ 55-70%
Accuracy@10 ≈ 65-80%
```

### Graph Characteristics

| Graph Element | Description |
|---------------|-------------|
| **X-axis** | K (number of predictions considered) |
| **Y-axis** | Prediction accuracy (%) |
| **Expected Shape** | Logarithmic curve, steep rise then plateau |
| **Interpretation** | Quickly captures most valid options |

### Real-World Example
Context: "the cat sat on the"
```
K=1:  "mat" (40% of test cases)
K=3:  "mat", "floor", "chair" (65% of test cases)
K=5:  + "table", "ground" (75% of test cases)
```

---

## 4. Smoothing Technique Comparison

### Overview
Compares different smoothing methods for handling unseen trigrams.

### Smoothing Methods Analyzed

#### 1. **No Smoothing (Maximum Likelihood Estimation)**
```
P(w₃ | w₁, w₂) = count(w₁, w₂, w₃) / count(w₁, w₂)
```
**Problem**: P = 0 for unseen trigrams → infinite perplexity

#### 2. **Laplace (Add-1) Smoothing**
```
P(w₃ | w₁, w₂) = (count(w₁, w₂, w₃) + 1) / (count(w₁, w₂) + V)
```
Where `V` = vocabulary size

**Distribution**: Shifts probability mass uniformly to unseen events

#### 3. **Stupid Backoff** (Used in this project)
```
S(w₃ | w₁, w₂) = {
    count(w₁, w₂, w₃) / count(w₁, w₂)           if count > 0
    λ · S(w₃ | w₂)                               otherwise (bigram)
    λ² · S(w₃)                                   otherwise (unigram)
}
```
Where `λ = 0.4` (backoff weight)

**Distribution**: Hierarchical fallback, not a true probability distribution

#### 4. **Kneser-Ney Smoothing** (Advanced baseline)
```
P_KN(w₃ | w₁, w₂) = max(count - δ, 0) / count(w₁, w₂) + 
                     γ · P_continuation(w₃ | w₂)
```
**Distribution**: Accounts for **contextual diversity** of words

### Why Different Methods Perform Differently

| Method | Perplexity | Pros | Cons |
|--------|-----------|------|------|
| No Smoothing | ∞ | Simple | Fails on unseen |
| Laplace | High (200+) | Always defined | Over-smooths |
| Stupid Backoff | Medium (80-120) | Fast, good empirical | Not normalized |
| Kneser-Ney | Low (60-90) | Best theory | Computationally expensive |

### Graph Characteristics

| Graph Element | Description |
|---------------|-------------|
| **X-axis** | Smoothing technique |
| **Y-axis** | Perplexity score |
| **Expected Pattern** | Bar chart, Kneser-Ney < Stupid Backoff < Laplace |

---

## 5. Vocabulary Coverage & Backoff Analysis

### Overview
Shows what percentage of predictions come from trigram, bigram, or unigram backoff.

### Statistical Distribution: **Categorical Distribution**

#### Backoff Levels
```
Level 0 (Trigram):   P(w₃ | w₁, w₂)  - Full context match
Level 1 (Bigram):    P(w₃ | w₂)      - Partial context (λ = 0.4)
Level 2 (Unigram):   P(w₃)           - No context (λ² = 0.16)
```

### Why This Distribution Occurs

#### Coverage Analysis
For a corpus with `N` total trigrams and vocabulary size `V`:

**Expected trigram coverage** (based on Good-Turing estimation):
```
Coverage ≈ 1 - exp(-N / V³)
```

Typical breakdown:
- **60-70%** resolved at trigram level (exact match)
- **20-25%** fall back to bigram
- **10-15%** fall back to unigram

#### Mathematical Explanation
The proportion follows the **sparsity of higher-order n-grams**:
- Unigrams: `O(V)` possibilities → high coverage
- Bigrams: `O(V²)` possibilities → medium coverage
- Trigrams: `O(V³)` possibilities → low coverage

For `V = 10,000`:
- Unigrams: 10K (fully observable with moderate data)
- Bigrams: 100M (partially observable)
- Trigrams: 1T (mostly sparse)

### Graph Characteristics

| Graph Element | Description |
|---------------|-------------|
| **Type** | Pie chart or stacked bar |
| **Categories** | Trigram hit, Bigram backoff, Unigram backoff |
| **Expected Values** | ~65%, ~25%, ~10% |

---

## 6. API Response Time Distribution

### Overview
Distribution of prediction API latency across thousands of requests.

### Statistical Distribution: **Log-Normal Distribution**

#### Probability Density Function
```
f(t) = (1 / (t σ√(2π))) · exp(-(ln t - μ)² / (2σ²))
```

Where:
- `t` = response time (ms)
- `μ` = mean of log(t)
- `σ` = standard deviation of log(t)

#### Why Log-Normal?

**Multiplicative Process**: Response time is the product of many independent factors:
1. Request parsing time
2. Tree traversal time (varies with depth)
3. Heap operations for top-N
4. JSON serialization
5. Network overhead

By **Central Limit Theorem** applied to products:
```
T = t₁ × t₂ × t₃ × ... × tₙ
log(T) = log(t₁) + log(t₂) + ... + log(tₙ)
```

Sum of random variables → Normal distribution
Therefore: `log(T) ~ Normal` → `T ~ Log-Normal`

### Graph Characteristics

| Graph Element | Description |
|---------------|-------------|
| **X-axis** | Response time (ms) |
| **Y-axis** | Frequency (number of requests) |
| **Expected Shape** | Right-skewed bell curve |
| **Mode** | 1-2 ms (most common) |
| **Median** | 2-3 ms |
| **Mean** | 3-5 ms (pulled right by tail) |
| **95th percentile** | 8-12 ms |

### Performance Percentiles

| Percentile | Typical Time | Quality |
|------------|-------------|---------|
| 50th (median) | 2 ms | Excellent |
| 75th | 3 ms | Very good |
| 90th | 5 ms | Good |
| 95th | 10 ms | Acceptable |
| 99th | 20 ms | Investigate |

---

## Mathematical Foundations Summary

### Core Distributions in NLP

| Distribution | Phenomenon | Mathematical Form |
|-------------|-----------|------------------|
| **Zipf (Power Law)** | Word/trigram frequencies | `f ∝ 1/r^α` |
| **Poisson** | Word occurrence in windows | `P(k) = λᵏe^(-λ) / k!` |
| **Log-Normal** | Response times | `f(t) ∝ 1/t · exp(-(ln t - μ)²/2σ²)` |
| **Exponential** | Perplexity decay | `f(n) = A·e^(-βn)` |

### Key Statistical Concepts

#### 1. **Entropy**
Measures uncertainty in the model:
```
H(P) = -∑ P(w) log₂ P(w)
```

#### 2. **Cross-Entropy**
Measures model quality vs. truth:
```
H(P, Q) = -∑ P(w) log₂ Q(w)
```

#### 3. **Perplexity**
Exponentiated cross-entropy:
```
PPL = 2^H(P,Q)
```

---

## Practical Implications

### For Model Design
1. **Zipf's Law**: Use hash maps for efficient storage (most trigrams rare)
2. **Power Law Decay**: Diminishing returns beyond ~1M words of training
3. **Backoff Distribution**: Allocate 70% compute to trigram lookups
4. **Log-Normal Latency**: Set timeout at 99th percentile (~20ms)

### For Performance Tuning
1. **Cache top 1% of trigrams** → Covers ~40% of requests (Zipf)
2. **Optimize trigram lookup** → 65% of queries use it
3. **Pre-allocate heap memory** → Reduces tail latency
4. **Use lazy loading** → Most trigrams never accessed

---

## References

### Statistical Theory
- Zipf, G. K. (1949). *Human Behavior and the Principle of Least Effort*
- Manning & Schütze (1999). *Foundations of Statistical NLP*, Chapter 6
- Jurafsky & Martin (2023). *Speech and Language Processing*, 3rd ed.

### Smoothing Techniques
- Chen & Goodman (1999). "An empirical study of smoothing techniques for language modeling"
- Brants et al. (2007). "Large Language Models in Machine Translation" (Stupid Backoff)

### Information Theory
- Shannon (1948). "A Mathematical Theory of Communication"
- Cover & Thomas (2006). *Elements of Information Theory*

---

## Appendix: Generating These Graphs

To generate analysis graphs for your model:

```bash
# 1. Run model training
cd trigram_llm
./trigram_llm --train data/corpus.txt

# 2. Export statistics
./trigram_llm --stats > analysis/stats.txt

# 3. Generate visualizations (Python)
cd ../analysis
python generate_graphs.py
```

Expected output:
- `perplexity.png` - Training curve
- `distribution.png` - Zipf plot
- `accuracy.png` - Top-K curve
- `smoothing.png` - Method comparison
- `coverage.png` - Backoff breakdown
- `response_time.png` - Latency histogram
