import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './TrainingPage.css';

export default function TrainingPage() {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [progress, setProgress] = useState({ step: '', percent: 0 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.txt')) {
            setFile(droppedFile);
            setError(null);
        } else {
            setError('Please upload a .txt file');
        }
    }, []);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.txt')) {
            setFile(selectedFile);
            setError(null);
        } else {
            setError('Please upload a .txt file');
        }
    };

    const handleTrain = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setIsTraining(true);
        setError(null);
        setResult(null);
        setProgress({ step: 'Uploading file...', percent: 0 });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:5002/train', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Training failed');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));

                        if (data.event === 'progress') {
                            setProgress({ step: data.step, percent: data.percent });
                        } else if (data.event === 'complete') {
                            setResult(data);
                            setIsTraining(false);
                        } else if (data.event === 'error') {
                            setError(data.message);
                            setIsTraining(false);
                        }
                    }
                }
            }
        } catch (err) {
            setError(err.message || 'Training server not available. Make sure training_server.js is running.');
            setIsTraining(false);
        }
    };

    const handleDownload = () => {
        if (result && result.modelPath) {
            window.open(`http://127.0.0.1:5002/download?path=${encodeURIComponent(result.modelPath)}`, '_blank');
        }
    };

    return (
        <div className="training-page">
            <div className="training-header">
                <Link to="/" className="back-link">← Back to Home</Link>
                <h1>  Train Custom Model</h1>
                <p>Upload a .txt file to train a new trigram language model</p>
            </div>

            <div className="training-container">
                <div className="upload-section">
                    <div
                        className={`dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <input
                            id="file-input"
                            type="file"
                            accept=".txt"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />

                        {file ? (
                            <div className="file-info">
                                <div className="file-icon">📄</div>
                                <div className="file-details">
                                    <div className="file-name">{file.name}</div>
                                    <div className="file-size">{(file.size / 1024).toFixed(2)} KB</div>
                                </div>
                            </div>
                        ) : (
                            <div className="dropzone-content">
                                <div className="upload-icon">📁</div>
                                <p className="upload-text">Drag & drop your .txt file here</p>
                                <p className="upload-subtext">or click to browse</p>
                            </div>
                        )}
                    </div>

                    <button
                        className="train-button"
                        onClick={handleTrain}
                        disabled={!file || isTraining}
                    >
                        {isTraining ? '⏳ Training...' : '  Start Training'}
                    </button>
                </div>

                {isTraining && (
                    <div className="progress-section">
                        <h3>Training Progress</h3>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress.percent}%` }}
                            />
                        </div>
                        <p className="progress-text">{progress.step} ({progress.percent}%)</p>
                        <p className="background-notice">
                            💡 Training runs in the background. You can navigate to other pages while training.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="error-section">
                        <p>❌ {error}</p>
                    </div>
                )}

                {result && (
                    <div className="result-section">
                        <h3>Training Complete!</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value">{result.stats?.totalTrigrams || 0}</div>
                                <div className="stat-label">Total Trigrams</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{result.stats?.uniqueTrigrams || 0}</div>
                                <div className="stat-label">Unique Trigrams</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{result.stats?.uniqueWords || 0}</div>
                                <div className="stat-label">Unique Words</div>
                            </div>
                        </div>
                        <button className="download-button" onClick={handleDownload}>
                            Download Model (.bin)
                        </button>
                        <p className="restart-notice">
                            To use the new model, restart the API servers with the updated model.bin file.
                        </p>
                    </div>
                )}
            </div>

            <div className="training-info">
                <h3>ℹ️ How It Works</h3>
                <ol>
                    <li>Upload a text file containing your training data</li>
                    <li>The system tokenizes the text and generates trigrams</li>
                    <li>A statistical model is built using a prefix tree structure</li>
                    <li>The trained model is saved and can be downloaded</li>
                    <li>Use the model for next-word predictions in the main app</li>
                </ol>
            </div>
        </div>
    );
}
