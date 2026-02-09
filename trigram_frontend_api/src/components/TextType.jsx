import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

/**
 * TextType Component - Animated typing effect
 * Inspired by react-bits TextType component
 */
export default function TextType({
    texts = ["Welcome to React Bits!"],
    typingSpeed = 75,
    deletingSpeed = 50,
    pauseDuration = 1500,
    showCursor = true,
    cursorCharacter = "_",
    cursorBlinkDuration = 0.5,
    variableSpeedEnabled = false,
    variableSpeedMin = 60,
    variableSpeedMax = 120,
    className = "",
}) {
    const textRef = useRef(null);
    const cursorRef = useRef(null);
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentText, setCurrentText] = useState('');
    const timeoutRef = useRef(null);

    useEffect(() => {
        const fullText = texts[currentTextIndex];

        const getTypingSpeed = () => {
            if (!variableSpeedEnabled) return isDeleting ? deletingSpeed : typingSpeed;
            return Math.random() * (variableSpeedMax - variableSpeedMin) + variableSpeedMin;
        };

        const type = () => {
            if (isDeleting) {
                // Deleting characters
                if (currentText.length > 0) {
                    setCurrentText(prev => prev.slice(0, -1));
                    timeoutRef.current = setTimeout(type, getTypingSpeed());
                } else {
                    // Done deleting, move to next text
                    setIsDeleting(false);
                    setCurrentTextIndex((prev) => (prev + 1) % texts.length);
                    // Small delay before starting next text
                    timeoutRef.current = setTimeout(type, 200);
                }
            } else {
                // Typing characters
                if (currentText.length < fullText.length) {
                    setCurrentText(fullText.slice(0, currentText.length + 1));
                    timeoutRef.current = setTimeout(type, getTypingSpeed());
                } else {
                    // Done typing, pause then start deleting
                    timeoutRef.current = setTimeout(() => {
                        setIsDeleting(true);
                    }, pauseDuration);
                }
            }
        };

        timeoutRef.current = setTimeout(type, 100);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [currentText, isDeleting, currentTextIndex, texts, typingSpeed, deletingSpeed, pauseDuration, variableSpeedEnabled, variableSpeedMin, variableSpeedMax]);

    // Cursor blink animation
    useEffect(() => {
        if (!showCursor || !cursorRef.current) return;

        const timeline = gsap.timeline({ repeat: -1 });
        timeline.to(cursorRef.current, {
            opacity: 0,
            duration: cursorBlinkDuration,
            ease: "power1.inOut"
        }).to(cursorRef.current, {
            opacity: 1,
            duration: cursorBlinkDuration,
            ease: "power1.inOut"
        });

        return () => {
            timeline.kill();
        };
    }, [showCursor, cursorBlinkDuration]);

    return (
        <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span ref={textRef}>{currentText}</span>
            {showCursor && (
                <span
                    ref={cursorRef}
                    style={{
                        display: 'inline-block',
                        marginLeft: '2px',
                        fontWeight: 'bold'
                    }}
                >
                    {cursorCharacter}
                </span>
            )}
        </span>
    );
}
