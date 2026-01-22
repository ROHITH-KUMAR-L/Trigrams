import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useCodePredictions } from '../hooks/useCodePredictions';
import { formatCode } from '../services/api';
import './CodeEditor.css';

export default function CodeEditor() {
    const [code, setCode] = useState('# Start typing Python code...\n# Predictions will appear as you type\n\n');
    const [currentLine, setCurrentLine] = useState('');
    const [temperature, setTemperature] = useState(1.0);
    const [isFormatting, setIsFormatting] = useState(false);
    const [formatError, setFormatError] = useState(null);
    const editorRef = useRef(null);
    const monacoRef = useRef(null);

    const { predictions, loading } = useCodePredictions(currentLine, temperature);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Register completion provider for trigram predictions
        monaco.languages.registerCompletionItemProvider('python', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                const suggestions = predictions.map((pred, index) => ({
                    label: pred.word,
                    kind: monaco.languages.CompletionItemKind.Text,
                    detail: `Trigram: ${(pred.probability * 100).toFixed(1)}%`,
                    insertText: pred.word,
                    range: range,
                    sortText: String(index).padStart(3, '0'),
                }));

                return { suggestions };
            },
            triggerCharacters: [' ', '.', '(', ','],
        });

        // Listen for cursor position changes to track current line
        editor.onDidChangeCursorPosition((e) => {
            const lineContent = editor.getModel().getLineContent(e.position.lineNumber);
            setCurrentLine(lineContent);
        });
    };

    const handleEditorChange = (value) => {
        setCode(value || '');
        setFormatError(null);
    };

    const handleFormat = useCallback(async () => {
        if (!code.trim()) return;

        setIsFormatting(true);
        setFormatError(null);

        try {
            const result = await formatCode(code);
            if (result.formatted) {
                setCode(result.formatted);
                if (result.error) {
                    setFormatError(result.error);
                }
            } else if (result.error) {
                setFormatError(result.error);
            }
        } catch (error) {
            setFormatError('Format server not available. Make sure format_server.js is running.');
        } finally {
            setIsFormatting(false);
        }
    }, [code]);

    // Format on Ctrl+Shift+F
    useEffect(() => {
        const handler = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                handleFormat();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleFormat]);

    return (
        <div className="code-editor-page">
            <div className="code-editor-header">
                <Link to="/" className="back-link">← Back to Home</Link>
                <h1>Python Code Editor</h1>
                <p>Trigram-powered code completion with auto-formatting</p>
            </div>

            <div className="code-editor-toolbar">
                <div className="toolbar-left">
                    <button
                        className="format-btn"
                        onClick={handleFormat}
                        disabled={isFormatting}
                    >
                        {isFormatting ? '⏳ Formatting...' : '✨ Format Code'}
                    </button>
                    <span className="toolbar-hint">Ctrl+Shift+F</span>
                </div>

                <div className="toolbar-right">
                    <div className="temperature-control">
                        <label>Creativity: {temperature.toFixed(1)}</label>
                        <input
                            type="range"
                            min="0.1"
                            max="2.0"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        />
                        <span className="temp-label">
                            {temperature < 0.5 ? '🎯 Precise' : temperature > 1.2 ? '🎨 Creative' : '⚖️ Balanced'}
                        </span>
                    </div>
                </div>
            </div>

            {formatError && (
                <div className="format-error">
                    ⚠️ {formatError}
                </div>
            )}

            <div className="editor-container">
                <Editor
                    height="500px"
                    defaultLanguage="python"
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        insertSpaces: true,
                        wordWrap: 'on',
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: true,
                        acceptSuggestionOnEnter: 'on',
                    }}
                />
            </div>

            <div className="predictions-panel">
                <h3>
                    {loading ? '⏳ Loading predictions...' : '💡 Trigram Predictions'}
                </h3>
                {predictions.length > 0 ? (
                    <div className="prediction-chips">
                        {predictions.slice(0, 8).map((pred, idx) => (
                            <span
                                key={idx}
                                className="prediction-chip"
                                onClick={() => {
                                    if (editorRef.current) {
                                        const position = editorRef.current.getPosition();
                                        editorRef.current.executeEdits('trigram', [{
                                            range: {
                                                startLineNumber: position.lineNumber,
                                                startColumn: position.column,
                                                endLineNumber: position.lineNumber,
                                                endColumn: position.column,
                                            },
                                            text: pred.word + ' ',
                                        }]);
                                        editorRef.current.focus();
                                    }
                                }}
                            >
                                {pred.word}
                                <span className="chip-prob">{(pred.probability * 100).toFixed(0)}%</span>
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="no-predictions">
                        Type at least 2 words to see predictions
                    </p>
                )}
            </div>

            <div className="code-editor-info">
                <p>
                    <strong>How it works:</strong> The trigram model predicts the next word based on the previous two words.
                    Since the model was trained without punctuation, use the <strong>Format Code</strong> button
                    to add proper Python syntax with Black/autopep8.
                </p>
            </div>
        </div>
    );
}
