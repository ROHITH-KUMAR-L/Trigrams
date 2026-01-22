import { useState, useEffect, useCallback } from 'react';
import { getPredictions } from '../services/api';

/**
 * Custom hook for code predictions using trigram model
 * @param {string} currentLine - The current line of code being typed
 * @param {number} temperature - Temperature for prediction diversity (0.1-2.0)
 */
export function useCodePredictions(currentLine, temperature = 1.0) {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPredictions = useCallback(async () => {
        if (!currentLine || currentLine.trim().length === 0) {
            setPredictions([]);
            return;
        }

        // Extract tokens from current line (split by whitespace)
        const tokens = currentLine.trim().split(/\s+/).filter(t => t.length > 0);
        
        // Need at least 2 tokens for trigram prediction
        if (tokens.length < 2) {
            setPredictions([]);
            return;
        }

        // Get last 2 tokens
        const word1 = tokens[tokens.length - 2].toLowerCase();
        const word2 = tokens[tokens.length - 1].toLowerCase();

        setLoading(true);
        try {
            const results = await getPredictions(word1, word2, temperature);
            setPredictions(results);
        } catch (error) {
            console.error('Prediction error:', error);
            setPredictions([]);
        } finally {
            setLoading(false);
        }
    }, [currentLine, temperature]);

    useEffect(() => {
        // Debounce predictions
        const timeoutId = setTimeout(fetchPredictions, 200);
        return () => clearTimeout(timeoutId);
    }, [fetchPredictions]);

    return { predictions, loading };
}
