import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PdfToImageTool from './components/PdfToImageTool';
import ImageToPdfTool from './components/ImageToPdfTool';
import PdfMergeSplitTool from './components/PdfMergeSplitTool';
import PdfCompressorTool from './components/PdfCompressorTool';
import ImageCompressorTool from './components/ImageCompressorTool';
import PassportPhotoTool from './components/PassportPhotoTool';
import CompetenceCalculatorTool from './components/CompetenceCalculatorTool';
import { Search, Sun, Moon } from 'lucide-react';
import './App.css';

const TopBar = ({ theme, toggleTheme, searchQuery, setSearchQuery }) => {
  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search tools (e.g. PDF, Image, Resizer)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme (Dark / Light)">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent-gradient)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}></div>
      </div>
    </header>
  );
};

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('nexus_theme') || 'light');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        
        <main className="main-content">
          <TopBar 
            theme={theme} 
            toggleTheme={toggleTheme} 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
          />
          
          <div className="content-area">
            <Routes>
              <Route path="/" element={<Dashboard searchQuery={searchQuery} />} />
              <Route path="/pdf-to-image" element={<PdfToImageTool />} />
              <Route path="/image-to-pdf" element={<ImageToPdfTool />} />
              <Route path="/pdf-merge-split" element={<PdfMergeSplitTool />} />
              <Route path="/pdf-compressor" element={<PdfCompressorTool />} />
              <Route path="/image-compressor" element={<ImageCompressorTool />} />
              <Route path="/passport-photo" element={<PassportPhotoTool />} />
              <Route path="/competence-calculator" element={<CompetenceCalculatorTool />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
