import React, { useState, useCallback } from 'react';
import './DropZone.css';

export default function DropZone({
    onFileSelect,
    acceptedFileTypes = ['.txt'],
    acceptedMimeTypes = ['text/plain'],
    children,
    isFilled = false,
}) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const validFile = files.find(file =>
            acceptedFileTypes.some(ext => file.name.endsWith(ext)) ||
            acceptedMimeTypes.includes(file.type)
        );

        if (validFile && onFileSelect) {
            onFileSelect(validFile);
        }
    }, [acceptedFileTypes, acceptedMimeTypes, onFileSelect]);

    const handleFileInput = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file && onFileSelect) {
            onFileSelect(file);
        }
        e.target.value = '';
    }, [onFileSelect]);

    const handleBrowseClick = useCallback(() => {
        document.getElementById('dropzone-file-input')?.click();
    }, []);

    return (
        <div
            className={`dropzone-container ${isDragging ? 'dragging' : ''} ${isFilled ? 'filled' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
        >
            <input
                id="dropzone-file-input"
                type="file"
                accept={acceptedFileTypes.join(',')}
                onChange={handleFileInput}
                className="dropzone-input"
            />

            {children || (
                <div className="dropzone-content">
                    <span className="dropzone-icon">↑</span>
                    <span className="dropzone-text">
                        Drop .txt file here or <strong>browse</strong>
                    </span>
                </div>
            )}
        </div>
    );
}
