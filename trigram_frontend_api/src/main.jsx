import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import TrainingPage from './components/TrainingPage.jsx'
import AnalysisPage from './components/AnalysisPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/train" element={<TrainingPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
)

