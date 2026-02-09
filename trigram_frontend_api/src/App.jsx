import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactGridLayout from 'react-grid-layout';
import SearchBar from './components/SearchBar';
import Stats from './components/Stats';
import DataStructureViz from './components/DataStructureViz';
import GradientText from './components/GradientText';
import { usePredictions } from './hooks/usePredictions';
import { useSentenceCompletions } from './hooks/useSentenceCompletions';
import 'react-grid-layout/css/styles.css';
import './App.css';

function App() {
    const [text, setText] = useState('');
    const [temperature, setTemperature] = useState(1.0);
    const [predictionMode, setPredictionMode] = useState('word');
    const { predictions, loading: wordLoading } = usePredictions(text, temperature);
    const { completions, loading: sentenceLoading } = useSentenceCompletions(text, 5, 3);

    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(1200);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const layout = [
        { i: 'search', x: 0, y: 0, w: 8, h: 2, static: true },
        { i: 'controls', x: 0, y: 2, w: 4, h: 3, static: true },
        { i: 'stats', x: 4, y: 2, w: 4, h: 3, static: true },
        { i: 'viz', x: 8, y: 0, w: 4, h: 5, static: true },
    ];

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <div className="logo-section">
                        <h1 className="app-title">
                            <GradientText
                                colors={["#7c3aed", "#3b82f6", "#ec4899", "#7c3aed"]}
                                animationSpeed={6}
                                showBorder={false}
                            >
                                Trigram
                            </GradientText>
                        </h1>
                        <span className="app-tagline">Language Model</span>
                    </div>
                    <nav className="header-nav">
                        <Link to="/analysis" className="nav-link nav-secondary">
                            Analysis
                        </Link>
                        <Link to="/train" className="nav-link">
                            <span className="nav-icon"></span>
                            Train Model
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="app-main" ref={containerRef}>
                {mounted && (
                    <ReactGridLayout
                        className="dashboard-grid"
                        layout={layout}
                        cols={12}
                        rowHeight={60}
                        width={containerWidth}
                        isDraggable={false}
                        isResizable={false}
                        margin={[20, 20]}
                    >
                        {/* Search Panel */}
                        <div key="search" className="grid-card search-card">
                            <div className="card-content">
                                <SearchBar
                                    text={text}
                                    setText={setText}
                                    predictions={predictionMode === 'word' ? predictions : []}
                                    completions={predictionMode === 'sentence' ? completions : []}
                                    loading={predictionMode === 'word' ? wordLoading : sentenceLoading}
                                    mode={predictionMode}
                                />
                            </div>
                        </div>

                        {/* Controls Panel */}
                        <div key="controls" className="grid-card controls-card">
                            <div className="card-header">
                                <h3>⚙️ Controls</h3>
                            </div>
                            <div className="card-content">
                                <div className="control-group">
                                    <label className="control-label">Prediction Mode</label>
                                    <div className="toggle-buttons">
                                        <button
                                            className={`toggle-btn ${predictionMode === 'word' ? 'active' : ''}`}
                                            onClick={() => setPredictionMode('word')}
                                        >
                                            📝 Word
                                        </button>
                                        <button
                                            className={`toggle-btn ${predictionMode === 'sentence' ? 'active' : ''}`}
                                            onClick={() => setPredictionMode('sentence')}
                                        >
                                            � Sentence
                                        </button>
                                    </div>
                                </div>

                                {predictionMode === 'word' && (
                                    <div className="control-group">
                                        <div className="control-header">
                                            <label className="control-label">Creativity</label>
                                            <span className="control-value">{temperature.toFixed(1)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            className="slider"
                                            min="0.1"
                                            max="2.0"
                                            step="0.1"
                                            value={temperature}
                                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                        />
                                        <div className="slider-labels">
                                            <span>Focused</span>
                                            <span>Creative</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Panel */}
                        <div key="stats" className="grid-card stats-card">
                            <div className="card-header">
                                <h3>📊 Model Stats</h3>
                            </div>
                            <div className="card-content">
                                <Stats />
                            </div>
                        </div>

                        {/* Visualization Panel */}
                        <div key="viz" className="grid-card viz-card">
                            <div className="card-header">
                                <h3>🌳 Data Structures</h3>
                            </div>
                            <div className="card-content viz-content">
                                <DataStructureViz text={text} predictions={predictions} />
                            </div>
                        </div>
                    </ReactGridLayout>
                )}
            </main>

            <footer className="app-footer">
                <p>DSA Lab Project • Built with React</p>
            </footer>
        </div>
    );
}

export default App;
