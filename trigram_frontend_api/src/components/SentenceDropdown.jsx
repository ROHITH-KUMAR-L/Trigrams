import React from 'react';
import './SentenceDropdown.css';

export default function SentenceDropdown({ completions, onSelect, selectedIndex, loading }) {
    if (loading) {
        return (
            <div className="sentence-dropdown">
                <div className="sentence-loading">Generating sentences...</div>
            </div>
        );
    }

    if (completions.length === 0) {
        return null;
    }

    return (
        <div className="sentence-dropdown">
            <div className="sentence-header">📝 Sentence Completions</div>
            {completions.map((completion, index) => (
                <div
                    key={index}
                    className={`sentence-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => onSelect(completion.sentence)}
                >
                    <div className="sentence-text">{completion.sentence}</div>
                    <div className="sentence-meta">
                        <div className="probability-bar">
                            <div
                                className="probability-fill"
                                style={{ width: `${Math.min(completion.probability * 100, 100)}%` }}
                            />
                        </div>
                        <span className="probability-value">
                            {(completion.probability * 100).toFixed(2)}%
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
