import React, { useState, useEffect } from 'react';
import { getStats, checkHealth } from '../services/api';
import CountUp from './CountUp';
import './Stats.css';

export default function Stats() {
    const [stats, setStats] = useState(null);
    const [health, setHealth] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const [statsData, healthData] = await Promise.all([
                getStats(),
                checkHealth()
            ]);
            setStats(statsData);
            setHealth(healthData);
            setDataLoaded(true);
        };
        fetchData();
    }, []);

    if (!health || !stats) {
        return null;
    }

    return (
        <div className="stats-container">
            <div className="stat-item">
                <div className="stat-label">Status</div>
                <div className="stat-value">
                    <span className={`status-dot ${health.model_loaded ? 'online' : 'offline'}`}></span>
                    {health.model_loaded ? 'Online' : 'Offline'}
                </div>
            </div>
            <div className="stat-item">
                <div className="stat-label">Total Trigrams</div>
                <div className="stat-value">
                    <CountUp
                        from={0}
                        to={stats.total_trigrams || 0}
                        separator=","
                        direction="up"
                        duration={1.5}
                        className="count-up-text"
                        startCounting={dataLoaded}
                    />
                </div>
            </div>
            <div className="stat-item">
                <div className="stat-label">Unique Words</div>
                <div className="stat-value">
                    <CountUp
                        from={0}
                        to={stats.unique_first_words || 0}
                        separator=","
                        direction="up"
                        duration={1.5}
                        className="count-up-text"
                        startCounting={dataLoaded}
                    />
                </div>
            </div>
        </div>
    );
}
