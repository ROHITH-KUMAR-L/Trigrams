import React from 'react';
import PredictionItem from './PredictionItem';
import './PredictionDropdown.css';

export default function PredictionDropdown({ predictions, onSelect, selectedIndex, loading }) {
    if (loading) {
        return (
            <div className="prediction-dropdown">
                <div className="prediction-loading">Searching...</div>
            </div>
        );
    }

    if (predictions.length === 0) {
        return null;
    }

    return (
        <div className="prediction-dropdown">
            {predictions.map((pred, index) => (
                <PredictionItem
                    key={index}
                    prediction={pred}
                    onClick={() => onSelect(pred.word)}
                    isSelected={index === selectedIndex}
                />
            ))}
            <div className="keyboard-hints">
                <span>↑↓ Navigate</span>
                <span>Tab Accept</span>
                <span>Esc Close</span>
            </div>
        </div>
    );
}
