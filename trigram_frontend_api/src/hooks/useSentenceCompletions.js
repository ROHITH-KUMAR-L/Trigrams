import { useState, useEffect } from 'react';
import { getSentenceCompletions } from '../services/api';
import { useDebounce } from './useDebounce';

export const useSentenceCompletions = (text, numWords = 5, beamWidth = 3) => {
    const [completions, setCompletions] = useState([]);
    const [loading, setLoading] = useState(false);
    const debouncedText = useDebounce(text, 300);

    useEffect(() => {
        const fetchCompletions = async () => {
            const words = debouncedText.trim().split(/\s+/);

            if (words.length < 2) {
                setCompletions([]);
                return;
            }

            const word1 = words[words.length - 2].toLowerCase();
            const word2 = words[words.length - 1].toLowerCase();

            setLoading(true);
            const results = await getSentenceCompletions(word1, word2, numWords, beamWidth);
            setCompletions(results);
            setLoading(false);
        };

        fetchCompletions();
    }, [debouncedText, numWords, beamWidth]);

    return { completions, loading };
};
