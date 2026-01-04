import React from 'react';
import SearchBar from './components/SearchBar';
import Stats from './components/Stats';
import './App.css';

function App() {
    return (
        <div className="app">
            <header className="app-header">
                <h1 className="app-title">Trigram Language Model</h1>
                <p className="app-subtitle">Real-time next-word predictions by statistical analysis</p>
            </header>

            <main className="app-main">
                <SearchBar />
                <Stats />
            </main>

            <footer className="app-footer">
                <p>DSA Lab Project</p>
            </footer>
        </div>
    );
}

export default App;
