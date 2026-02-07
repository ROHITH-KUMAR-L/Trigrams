import React, { useState, useRef, useEffect } from 'react';

import PredictionDropdown from './PredictionDropdown';
import SentenceDropdown from './SentenceDropdown';
import './SearchBar.css';

export default function SearchBar({ text, setText, predictions, completions = [], loading, mode = 'word' }) {
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef(null);

    const currentItems = mode === 'word' ? predictions : completions;

    useEffect(() => {
        setShowDropdown(currentItems.length > 0 || loading);
        setSelectedIndex(-1);
    }, [currentItems, loading]);

    const handleKeyDown = (e) => {
        if (!showDropdown) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev =>
                prev < currentItems.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            if (mode === 'word') {
                insertPrediction(currentItems[selectedIndex].word);
            } else {
                insertSentence(currentItems[selectedIndex].sentence);
            }
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

    const insertSentence = (sentence) => {
        setText(sentence + ' ');
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
                    onFocus={() => currentItems.length > 0 && setShowDropdown(true)}
                />
                {showDropdown && mode === 'word' && (
                    <PredictionDropdown
                        predictions={predictions}
                        onSelect={insertPrediction}
                        selectedIndex={selectedIndex}
                        loading={loading}
                    />
                )}
                {showDropdown && mode === 'sentence' && (
                    <SentenceDropdown
                        completions={completions}
                        onSelect={insertSentence}
                        selectedIndex={selectedIndex}
                        loading={loading}
                    />
                )}
            </div>
            <div className="search-hint">
                {mode === 'word'
                    ? 'Type at least 2 words to see word predictions'
                    : 'Type at least 2 words to see sentence completions (Beam Search)'
                }
            </div>
        </div>
    );
}

