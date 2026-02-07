import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8080';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getPredictions = async (word1, word2, temperature = 1.0) => {
    try {
        const response = await api.post('/predict', { word1, word2, temperature });
        return response.data.predictions || [];
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
};

// Code API (Python-trained model on port 8081)
const CODE_API_URL = 'http://127.0.0.1:8081';

export const getCodePredictions = async (word1, word2, temperature = 1.0) => {
    try {
        const response = await axios.post(`${CODE_API_URL}/predict`, { word1, word2, temperature });
        return response.data.predictions || [];
    } catch (error) {
        console.error('Code API Error:', error);
        return [];
    }
};

export const getStats = async () => {
    try {
        const response = await api.get('/stats');
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
};

export const checkHealth = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
};

// Sentence completion API (beam search)
export const getSentenceCompletions = async (word1, word2, numWords = 5, beamWidth = 3) => {
    try {
        const response = await api.post('/generate', { 
            word1, 
            word2, 
            num_words: numWords, 
            beam_width: beamWidth 
        });
        return response.data.completions || [];
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
};

// Format server API (runs on port 5001)
const FORMAT_API_URL = 'http://127.0.0.1:5001';

export const formatCode = async (code) => {
    try {
        const response = await axios.post(`${FORMAT_API_URL}/format`, { code });
        return response.data;
    } catch (error) {
        console.error('Format API Error:', error);
        throw error;
    }
};

export default api;
