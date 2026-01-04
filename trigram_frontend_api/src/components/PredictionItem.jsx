import React from 'react';
import './PredictionItem.css';

export default function PredictionItem({ prediction, onClick, isSelected }) {
    return (
        <div
            className={`prediction-item ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <div className="prediction-word">{prediction.word}</div>
            <div className="prediction-meta">
                <span className="prediction-prob">{(prediction.probability * 100).toFixed(1)}%</span>
                <span className="prediction-count">({prediction.count})</span>
            </div>
        </div>
    );
}
