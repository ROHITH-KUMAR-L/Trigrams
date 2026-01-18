import { useState, useEffect } from 'react';
import { getPredictions } from '../services/api';
import { useDebounce } from './useDebounce';

export function usePredictions(text, temperature = 1.0) {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const debouncedText = useDebounce(text, 300);

    useEffect(() => {
        const fetchPredictions = async () => {
            // Extract last 2 words
            const words = debouncedText.trim().split(/\s+/).filter(w => w.length > 0);

            if (words.length < 2) {
                setPredictions([]);
                return;
            }

            const word1 = words[words.length - 2].toLowerCase();
            const word2 = words[words.length - 1].toLowerCase();

            setLoading(true);
            const results = await getPredictions(word1, word2, temperature);
            setPredictions(results);
            setLoading(false);
        };

        fetchPredictions();
    }, [debouncedText, temperature]);

    return { predictions, loading };
}
