import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import Stats from './components/Stats';
import DataStructureViz from './components/DataStructureViz';
import { usePredictions } from './hooks/usePredictions';
import './App.css';

function App() {
    const [text, setText] = useState('');
    const [temperature, setTemperature] = useState(1.0);
    const { predictions, loading } = usePredictions(text, temperature);

    return (
        <div className="app">
            <header className="app-header">
                <h1 className="app-title">Trigram Language Model</h1>
                <p className="app-subtitle">Real-time next-word predictions by statistical analysis</p>
            </header>

            <main className="app-main">
                <div className="main-content">
                    <div className="left-panel">
                        <SearchBar
                            text={text}
                            setText={setText}
                            predictions={predictions}
                            loading={loading}
                        />

                        <div className="control-panel" style={{ margin: '20px 0', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <label style={{ fontWeight: 'bold', color: '#333' }}>Creativity (Temp): {temperature}</label>
                                <span style={{ fontSize: '0.8em', color: '#666' }}>{temperature < 0.5 ? 'Determinisitic' : temperature > 1.2 ? 'Creative' : 'Balanced'}</span>
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
