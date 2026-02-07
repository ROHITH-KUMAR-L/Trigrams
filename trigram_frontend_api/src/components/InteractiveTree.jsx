import React, { useState, useEffect } from 'react';
import { getPredictions } from '../services/api';
import './InteractiveTree.css';

/**
 * InteractiveTree - An expandable/collapsible tree visualization
 * Click on nodes to explore children deeper in the trigram model
 */
export default function InteractiveTree({ rootWord1, rootWord2 }) {
    const [expandedPaths, setExpandedPaths] = useState({});
    const [nodeChildren, setNodeChildren] = useState({});
    const [loading, setLoading] = useState({});

    // Toggle node expansion
    const toggleNode = async (path, word1, word2) => {
        const pathKey = path.join('/');

        if (expandedPaths[pathKey]) {
            // Collapse
            setExpandedPaths(prev => ({ ...prev, [pathKey]: false }));
            return;
        }

        // Expand - fetch children if not cached
        if (!nodeChildren[pathKey]) {
            setLoading(prev => ({ ...prev, [pathKey]: true }));
            try {
                const predictions = await getPredictions(word1, word2, 0.1);
                setNodeChildren(prev => ({ ...prev, [pathKey]: predictions }));
            } catch (err) {
                console.error('Failed to fetch children:', err);
                setNodeChildren(prev => ({ ...prev, [pathKey]: [] }));
            } finally {
                setLoading(prev => ({ ...prev, [pathKey]: false }));
            }
        }

        setExpandedPaths(prev => ({ ...prev, [pathKey]: true }));
    };

    // Reset when context changes
    useEffect(() => {
        setExpandedPaths({});
        setNodeChildren({});
    }, [rootWord1, rootWord2]);

    // Render a tree node recursively
    const renderNode = (word, path, parentWord, depth = 0) => {
        const pathKey = path.join('/');
        const isExpanded = expandedPaths[pathKey];
        const isLoading = loading[pathKey];
        const children = nodeChildren[pathKey] || [];
        const hasChildren = children.length > 0 || !isExpanded;

        return (
            <div key={pathKey} className="tree-node-wrapper" style={{ marginLeft: depth * 20 }}>
                <div
                    className={`interactive-node ${isExpanded ? 'expanded' : ''} ${depth === 0 ? 'root-node' : ''}`}
                    onClick={() => toggleNode(path, parentWord, word)}
                >
                    <span className="node-toggle">
                        {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
                    </span>
                    <span className="node-word">"{word}"</span>
                    {isLoading && <span className="node-loading">...</span>}
                </div>

                {isExpanded && !isLoading && (
                    <div className="node-children">
                        {children.length > 0 ? (
                            children.slice(0, 5).map((child, i) => (
                                <div key={i} className="child-node">
                                    {renderNode(child.word, [...path, child.word], word, depth + 1)}
                                    <span className="child-prob">
                                        {(child.probability * 100).toFixed(1)}%
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="no-children">No predictions (leaf)</div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!rootWord1 || !rootWord2) {
        return (
            <div className="interactive-tree">
                <div className="tree-placeholder">
                    Type at least 2 words to explore the tree
                </div>
            </div>
        );
    }

    return (
        <div className="interactive-tree">
            <div className="tree-header">
                <span className="tree-icon">🌳</span>
                <span>Click nodes to explore deeper</span>
            </div>
            <div className="tree-content">
                <div className="tree-root">
                    <span className="root-label">ROOT</span>
                    <span className="root-arrow">↓</span>
                </div>
                {renderNode(rootWord1, ['root', rootWord1], 'root', 0)}
                <div className="context-arrow">↓</div>
                {renderNode(rootWord2, ['root', rootWord1, rootWord2], rootWord1, 0)}
            </div>
        </div>
    );
}
