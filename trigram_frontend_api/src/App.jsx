import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import Stats from './components/Stats';
import DataStructureViz from './components/DataStructureViz';
import { usePredictions } from './hooks/usePredictions';
import './App.css';

function App() {
    const [text, setText] = useState('');
    const { predictions, loading } = usePredictions(text);

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
