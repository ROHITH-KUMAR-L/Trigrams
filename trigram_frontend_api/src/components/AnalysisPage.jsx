import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GraphModal from './GraphModal';
import './AnalysisPage.css';

export default function AnalysisPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedGraph, setSelectedGraph] = useState(null);

    useEffect(() => {
        fetch('/analysis/stats.json')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load stats:', err);
                setLoading(false);
            });
    }, []);

    const graphs = [
        {
            id: 'perplexity',
            title: 'Perplexity vs Training Data',
            description: 'Shows how model perplexity decreases with more training data. Lower perplexity indicates better prediction capability.',
            image: '/analysis/perplexity.png'
        },
        {
            id: 'accuracy',
            title: 'Top-K Prediction Accuracy',
            description: 'Measures how often the correct next word appears in the top K predictions.',
            image: '/analysis/accuracy.png'
        },
        {
            id: 'distribution',
            title: 'Trigram Frequency Distribution',
            description: "Displays the frequency distribution of trigrams following Zipf's law pattern.",
            image: '/analysis/distribution.png'
        },
        {
            id: 'smoothing',
            title: 'Smoothing Technique Comparison',
            description: 'Compares different smoothing methods and their impact on model perplexity.',
            image: '/analysis/smoothing.png'
        },
        {
            id: 'coverage',
            title: 'Vocabulary Coverage',
            description: 'Shows how predictions are resolved: direct trigram match vs backoff strategies.',
            image: '/analysis/coverage.png'
        },
        {
            id: 'response_time',
            title: 'API Response Time',
            description: 'Distribution of prediction API response times showing performance characteristics.',
            image: '/analysis/response_time.png'
        }
    ];

    return (
        <div className="analysis-page">
            <header className="analysis-header">
                <div className="header-content">
                    <Link to="/" className="back-link">← Back to Home</Link>
                    <h1>Model Analysis & Evaluation</h1>
                    <p>Performance metrics and visualizations for the Trigram Language Model</p>
                </div>
            </header>

            <main className="analysis-main">
                {/* Stats Overview */}
                {stats && (
                    <section className="stats-overview">
                        <h2>Key Metrics</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-value">{stats.total_trigrams?.toLocaleString()}</span>
                                    <span className="stat-label">Total Trigrams</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-value">{stats.unique_words?.toLocaleString()}</span>
                                    <span className="stat-label">Vocabulary Size</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-value">{stats.top_k_accuracy?.top_5}%</span>
                                    <span className="stat-label">Top-5 Accuracy</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-value">{stats.avg_response_time_ms}ms</span>
                                    <span className="stat-label">Avg Response Time</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-value">{stats.avg_perplexity}</span>
                                    <span className="stat-label">Avg Perplexity</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-value">{stats.smoothing_technique}</span>
                                    <span className="stat-label">Smoothing Method</span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Graph Sections */}
                <section className="graphs-section">
                    <h2>Visualizations</h2>
                    <div className="graphs-grid">
                        {graphs.map((graph) => (
                            <div
                                key={graph.id}
                                className="graph-card"
                                onClick={() => setSelectedGraph(graph)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="graph-image">
                                    <img
                                        src={graph.image}
                                        alt={graph.title}
                                        loading="lazy"
                                    />
                                </div>
                                <div className="graph-info">
                                    <h3>{graph.title}</h3>
                                    <p>{graph.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="analysis-footer">
                <p>DSA Lab Project • Model Analysis Dashboard</p>
            </footer>

            {/* Graph Detail Modal */}
            {selectedGraph && (
                <GraphModal
                    graph={selectedGraph}
                    onClose={() => setSelectedGraph(null)}
                />
            )}
        </div>
    );
}
