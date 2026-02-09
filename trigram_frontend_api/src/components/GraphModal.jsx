import React, { useEffect } from 'react';
import './GraphModal.css';

export default function GraphModal({ graph, onClose }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!graph) return null;

    const graphDetails = {
        perplexity: {
            distribution: 'Exponential Decay',
            formula: 'PPL(n) = PPL∞ + A · n^(-β)',
            explanation: 'Perplexity measures how "surprised" the model is by test data. As training data increases, the model sees more trigram patterns, reducing uncertainty. The exponential decay follows a power law where initial gains are steep, then plateau as diminishing returns set in.',
            whyThisDistribution: 'The decay occurs because: (1) Better coverage - more trigrams observed means fewer unseen combinations, (2) More accurate probabilities - frequency estimates converge to true distribution (Law of Large Numbers), (3) Lower variance - confidence intervals tighten around probability estimates.',
            typicalValues: [
                '1K words: PPL 500-800 (Poor)',
                '10K words: PPL 200-350 (Fair)',
                '100K words: PPL 80-150 (Good)',
                '1M words: PPL 40-80 (Very good)',
                '10M+ words: PPL 20-50 (Excellent)'
            ]
        },
        accuracy: {
            distribution: 'Cumulative Distribution Function',
            formula: 'Accuracy@K = P(correct word ∈ top-K predictions)',
            explanation: 'Top-K accuracy measures how often the correct next word appears in the top K predictions. Natural language has inherent ambiguity - multiple valid continuations often exist for the same context.',
            whyThisDistribution: 'Accuracy follows logarithmic growth because: (1) Natural language is multi-modal with several likely continuations, (2) Top-1 is limited by irreducible uncertainty, (3) Adding more predictions quickly captures most valid options, then plateaus.',
            typicalValues: [
                'Accuracy@1: 30-40%',
                'Accuracy@5: 55-70%',
                'Accuracy@10: 65-80%'
            ]
        },
        distribution: {
            distribution: "Zipf's Law (Power Law)",
            formula: 'f(r) = C / r^α',
            explanation: "Zipf's law states that the frequency of a trigram is inversely proportional to its rank. The most common trigram appears roughly twice as often as the second most common, three times as often as the third, and so on.",
            whyThisDistribution: 'This power law emerges from: (1) Preferential attachment - popular phrases reinforce themselves, (2) Cognitive economy - humans favor familiar patterns to minimize mental effort, (3) Least effort principle - equilibrium between speaker economy and listener comprehension.',
            typicalValues: [
                'Rank 1: ~5,000 occurrences',
                'Rank 10: ~500 occurrences',
                'Rank 100: ~50 occurrences',
                'α (Zipf exponent) ≈ 1.0 for natural language'
            ]
        },
        smoothing: {
            distribution: 'Comparative Bar Chart',
            formula: 'Stupid Backoff: S(w₃|w₁,w₂) = count(w₁,w₂,w₃)/count(w₁,w₂) OR λ·S(w₃|w₂)',
            explanation: 'Smoothing techniques handle unseen trigrams by allocating probability mass. Stupid Backoff uses hierarchical fallback (trigram → bigram → unigram) with λ=0.4 backoff weight, balancing speed and accuracy.',
            whyThisDistribution: 'Different methods trade off: (1) Laplace over-smooths by adding 1 to all counts, (2) Stupid Backoff is fast but not normalized, (3) Kneser-Ney accounts for contextual diversity. Performance varies based on data sparsity.',
            typicalValues: [
                'No Smoothing: PPL = ∞ (fails on unseen)',
                'Laplace: PPL 200+',
                'Stupid Backoff: PPL 80-120',
                'Kneser-Ney: PPL 60-90 (best)'
            ]
        },
        coverage: {
            distribution: 'Categorical Distribution',
            formula: 'Coverage ≈ 1 - exp(-N / V³)',
            explanation: 'Vocabulary coverage shows what percentage of predictions come from direct trigram matches versus bigram/unigram backoff. Higher-order n-grams are increasingly sparse, requiring fallback mechanisms.',
            whyThisDistribution: 'The breakdown follows n-gram sparsity: With vocabulary V=10K, there are 10K unigrams (fully observable), 100M bigrams (partially observable), and 1T trigrams (mostly sparse). This creates the 65%-25%-10% split across trigram-bigram-unigram.',
            typicalValues: [
                'Trigram hits: 60-70% (exact context match)',
                'Bigram backoff: 20-25% (partial context)',
                'Unigram backoff: 10-15% (no context)'
            ]
        },
        response_time: {
            distribution: 'Log-Normal Distribution',
            formula: 'f(t) = (1/(t·σ√(2π))) · exp(-(ln t - μ)²/(2σ²))',
            explanation: 'API response time follows a log-normal distribution because latency is the product of many independent factors: parsing, tree traversal, heap operations, JSON serialization, and network overhead.',
            whyThisDistribution: 'By Central Limit Theorem applied to products: T = t₁×t₂×...×tₙ means log(T) = sum of logs, which is normally distributed. Therefore T is log-normally distributed. This creates a right-skewed curve with most requests fast, but occasional slow outliers.',
            typicalValues: [
                'Mode: 1-2ms (most common)',
                'Median: 2-3ms',
                'Mean: 3-5ms',
                '95th percentile: 8-12ms',
                '99th percentile: ~20ms'
            ]
        }
    };

    const details = graphDetails[graph.id];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>

                <div className="modal-header">
                    <h2>{graph.title}</h2>
                    <span className="distribution-badge">{details.distribution}</span>
                </div>

                <div className="modal-image">
                    <img src={graph.image} alt={graph.title} />
                </div>

                <div className="modal-body">
                    <section className="detail-section">
                        <h3>Mathematical Formula</h3>
                        <code className="formula">{details.formula}</code>
                    </section>

                    <section className="detail-section">
                        <h3>Explanation</h3>
                        <p>{details.explanation}</p>
                    </section>

                    <section className="detail-section">
                        <h3>Why This Distribution?</h3>
                        <p>{details.whyThisDistribution}</p>
                    </section>

                    <section className="detail-section">
                        <h3>Typical Values</h3>
                        <ul className="values-list">
                            {details.typicalValues.map((value, idx) => (
                                <li key={idx}>{value}</li>
                            ))}
                        </ul>
                    </section>
                </div>

                <div className="modal-footer">
                    <button className="btn-primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
