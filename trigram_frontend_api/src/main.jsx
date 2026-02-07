import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import CodeEditor from './components/CodeEditor.jsx'
import TrainingPage from './components/TrainingPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/code-editor" element={<CodeEditor />} />
                <Route path="/train" element={<TrainingPage />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
)
