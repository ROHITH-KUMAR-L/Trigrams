import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './components/SearchBar';
import Stats from './components/Stats';
import DataStructureViz from './components/DataStructureViz';
import { usePredictions } from './hooks/usePredictions';
import { useSentenceCompletions } from './hooks/useSentenceCompletions';
import './App.css';

function App() {
    const [text, setText] = useState('');
    const [temperature, setTemperature] = useState(1.0);
    const [predictionMode, setPredictionMode] = useState('word'); // 'word' or 'sentence'
    const { predictions, loading: wordLoading } = usePredictions(text, temperature);
    const { completions, loading: sentenceLoading } = useSentenceCompletions(text, 5, 3);

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-nav">
                    <Link to="/code-editor" className="nav-link">🖥️ Code Editor</Link>
                </div>
                <h1 className="app-title">Trigram Language Model</h1>
                <p className="app-subtitle">Real-time next-word predictions by statistical analysis</p>
            </header>

            <main className="app-main">
                <div className="main-content">
                    <div className="left-panel">
                        <SearchBar
                            text={text}
                            setText={setText}
                            predictions={predictionMode === 'word' ? predictions : []}
                            completions={predictionMode === 'sentence' ? completions : []}
                            loading={predictionMode === 'word' ? wordLoading : sentenceLoading}
                            mode={predictionMode}
                        />

                        {/* Mode Toggle */}
                        <div className="control-panel" style={{ margin: '20px 0', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '8px' }}>
                                    Prediction Mode
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => setPredictionMode('word')}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            border: predictionMode === 'word' ? '2px solid #667eea' : '1px solid #ccc',
                                            borderRadius: '6px',
                                            background: predictionMode === 'word' ? '#eef' : 'white',
                                            cursor: 'pointer',
                                            fontWeight: predictionMode === 'word' ? 'bold' : 'normal'
                                        }}
                                    >
                                        📝 Word
                                    </button>
                                    <button
                                        onClick={() => setPredictionMode('sentence')}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            border: predictionMode === 'sentence' ? '2px solid #667eea' : '1px solid #ccc',
                                            borderRadius: '6px',
                                            background: predictionMode === 'sentence' ? '#eef' : 'white',
                                            cursor: 'pointer',
                                            fontWeight: predictionMode === 'sentence' ? 'bold' : 'normal'
                                        }}
                                    >
                                        📜 Sentence
                                    </button>
                                </div>
                            </div>

                            {predictionMode === 'word' && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <label style={{ fontWeight: 'bold', color: '#333' }}>Creativity (Temp): {temperature}</label>
                                        <span style={{ fontSize: '0.8em', color: '#666' }}>{temperature < 0.5 ? 'Deterministic' : temperature > 1.2 ? 'Creative' : 'Balanced'}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="2.0"
                                        step="0.1"
                                        value={temperature}
                                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                        style={{ width: '100%', cursor: 'pointer' }}
                                    />
                                </>
                            )}
                        </div>

                        <Stats />
                    </div>
                    <div className="right-panel">
                        <DataStructureViz text={text} predictions={predictions} />
                    </div>
                </div>
            </main>

            <footer className="app-footer">
                <p>DSA Lab Project</p>
            </footer>
        </div>
    );
}

export default App;

