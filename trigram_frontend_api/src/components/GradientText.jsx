import React from 'react';
import './GradientText.css';

/**
 * GradientText Component - Animated gradient text effect
 * Inspired by react-bits GradientText component
 */
export default function GradientText({
    children,
    colors = ["#5227FF", "#FF9FFC", "#B19EEF"],
    animationSpeed = 8,
    showBorder = false,
    className = "",
}) {
    const gradientStyle = {
        backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: `gradient-animation ${animationSpeed}s linear infinite`,
    };

    const borderStyle = showBorder ? {
        position: 'relative',
        display: 'inline-block',
    } : {};

    return (
        <span className={`gradient-text-wrapper ${className}`} style={borderStyle}>
            <span className="gradient-text" style={gradientStyle}>
                {children}
            </span>
            {showBorder && (
                <span
                    className="gradient-border"
                    style={{
                        backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
                        backgroundSize: '200% auto',
                        animation: `gradient-animation ${animationSpeed}s linear infinite`,
                    }}
                />
            )}
        </span>
    );
}
