import React, { useState, useRef, useEffect } from 'react';

import PredictionDropdown from './PredictionDropdown';
import './SearchBar.css';

export default function SearchBar({ text, setText, predictions, loading }) {
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        setShowDropdown(predictions.length > 0 || loading);
        setSelectedIndex(-1);
    }, [predictions, loading]);

    const handleKeyDown = (e) => {
        if (!showDropdown) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev =>
                prev < predictions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            insertPrediction(predictions[selectedIndex].word);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    const insertPrediction = (word) => {
        const words = text.trim().split(/\s+/);
        words.push(word);
        setText(words.join(' ') + ' ');
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    return (
        <div className="search-container">
            <div className="search-bar-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder="Start typing... (e.g., 'operating system')"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                />
                {showDropdown && (
                    <PredictionDropdown
                        predictions={predictions}
                        onSelect={insertPrediction}
                        selectedIndex={selectedIndex}
                        loading={loading}
                    />
                )}
            </div>
            <div className="search-hint">
                Type at least 2 words to see predictions
            </div>
        </div>
    );
}
