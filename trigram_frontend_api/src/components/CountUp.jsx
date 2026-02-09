import { useEffect, useRef, useState, useCallback } from "react";
import { animate, useInView } from "motion/react";

/**
 * CountUp Animation Component
 * Animates numbers from a starting value to an ending value with smooth transitions
 * Based on react-bits CountUp component
 */
export default function CountUp({
    from = 0,
    to,
    separator = ",",
    direction = "up",
    duration = 1,
    className = "",
    startCounting = true,
    decimals = 0,
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px" });
    const [hasAnimated, setHasAnimated] = useState(false);

    const formatNumber = useCallback(
        (num) => {
            const fixedNum = num.toFixed(decimals);
            const [intPart, decPart] = fixedNum.split(".");
            const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
            return decimals > 0 ? `${formattedInt}.${decPart}` : formattedInt;
        },
        [separator, decimals]
    );

    useEffect(() => {
        // Only animate when in view and startCounting is true
        if (!startCounting || !isInView || hasAnimated) return;

        const startValue = direction === "down" ? to : from;
        const endValue = direction === "down" ? from : to;

        const controls = animate(startValue, endValue, {
            duration,
            ease: [0.25, 0.1, 0.25, 1.0], // Smooth cubic bezier
            onUpdate: (latest) => {
                if (ref.current) {
                    ref.current.textContent = formatNumber(latest);
                }
            },
            onComplete: () => {
                setHasAnimated(true);
            },
        });

        return () => controls.stop();
    }, [from, to, direction, duration, formatNumber, isInView, startCounting, hasAnimated]);

    // Set initial value
    useEffect(() => {
        if (ref.current && !hasAnimated) {
            const initialValue = direction === "down" ? to : from;
            ref.current.textContent = formatNumber(initialValue);
        }
    }, [from, to, direction, formatNumber, hasAnimated]);

    return <span ref={ref} className={className} />;
}
