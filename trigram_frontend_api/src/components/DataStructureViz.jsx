import React from 'react';
import './DataStructureViz.css';

const DataStructureViz = ({ text, predictions }) => {
    // Extract words
    const words = text.trim().split(/\s+/);
    const lastWords = words.length >= 2 ? words.slice(-2) : words;
    const [w1, w2] = lastWords.length === 2 ? lastWords : [null, null];

    if (!text) {
        return (
            <div className="viz-container">
                <h3 className="viz-title">Data Structure Visualization</h3>
                <div style={{ color: '#888', fontStyle: 'italic' }}>
                    Start typing to see the data structures in action...
                </div>
            </div>
        );
    }

    return (
        <div className="viz-container">
            <h3 className="viz-title">Data Structure Visualization</h3>

            {/* 1. Input Stream (SLL) */}
            <div className="viz-section">
                <div className="viz-section-title">1. Input Stream (Singly Linked List)</div>
                <div className="sll-box">
                    {words.slice(-4).map((word, i) => (
                        <div key={i} className="sll-node">
                            <span className="sll-data">"{word}"</span>
                            <span className="sll-next">→</span>
                        </div>
                    ))}
                    <div className="sll-node null">NULL</div>
                </div>
                <div className="viz-desc">
                    Raw text is tokenized into a linked list (SLL) for processing.
                </div>
            </div>

            {/* 2. Sliding Window (Queue) */}
            <div className="viz-section">
                <div className="viz-section-title">2. Sliding Window (Queue)</div>
                <div className="queue-box">
                    <span className="queue-label">FRONT</span>
                    {lastWords.map((word, i) => (
                        <div key={i} className="queue-item">"{word}"</div>
                    ))}
                    <span className="queue-label">REAR</span>
                </div>
                <div className="viz-desc">
                    A FIFO Queue maintains the last 2 words to form a context.
                </div>
            </div>

            <div className="viz-split">
                {/* 3. Prediction (Tree) */}
                <div className="viz-section" style={{ flex: 1 }}>
                    <div className="viz-section-title">3. Prediction (N-ary Tree)</div>
                    {w1 && w2 ? (
                        <div className="tree-box">
                            <div className="tree-node root">ROOT</div>
                            <div className="tree-path-line"></div>

                            <div className="tree-node w1">"{w1}"</div>
                            <div className="tree-path-line"></div>

                            <div className="tree-node w2">"{w2}"</div>
                            <div className="tree-path-line"></div>

                            <div className="tree-children">
                                {predictions.length > 0 ? (
                                    predictions.slice(0, 3).map((pred, i) => (
                                        <div key={i} className="prediction-node">
                                            "{pred.word}"
                                            <span className="pred-prob">
                                                {(pred.probability * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <span style={{ color: '#666' }}>No children (Leaf)</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: '#666' }}>Need 2 words to traverse tree.</div>
                    )}
                </div>

                {/* 4. Training (Hash Map) */}
                <div className="viz-section" style={{ flex: 1, borderLeft: '1px solid #333', paddingLeft: '15px' }}>
                    <div className="viz-section-title">4. Training Stats (Hash Map)</div>
                    {w1 && w2 ? (
                        <div className="hash-map-box">
                            <div className="hash-header">Key: "{w1} {w2} [next]"</div>
                            <div className="hash-list">
                                {predictions.slice(0, 3).map((pred, i) => (
                                    <div key={i} className="hash-row">
                                        <span className="hash-key">"{w1} {w2} {pred.word}"</span>
                                        <span className="hash-value">{pred.count}</span>
                                    </div>
                                ))}
                                {predictions.length === 0 && (
                                    <div style={{ color: '#666' }}>No trigrams found.</div>
                                )}
                            </div>
                            <div className="viz-desc">
                                During training, full trigram strings are hashed to count frequencies efficiently.
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: '#666' }}>Waiting for input...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataStructureViz;
