import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PdfToImageTool from './components/PdfToImageTool';
import ImageToPdfTool from './components/ImageToPdfTool';
import PdfMergeSplitTool from './components/PdfMergeSplitTool';
import PdfCompressorTool from './components/PdfCompressorTool';
import ImageCompressorTool from './components/ImageCompressorTool';
import PassportPhotoTool from './components/PassportPhotoTool';
import CompetenceCalculatorTool from './components/CompetenceCalculatorTool';
import { Search, Sun, Moon, Menu, X } from 'lucide-react';
import useIsMobile from './hooks/useIsMobile';
import './App.css';

/* ─── TopBar ──────────────────────────────────────────────── */
const TopBar = ({ theme, toggleTheme, searchQuery, setSearchQuery, onMenuClick }) => (
  <header className="topbar">
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Hamburger — visible on mobile only */}
      <button
        className="hamburger-btn"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      <div className="search-box">
        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
        {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
      </button>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'var(--accent-gradient)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: '0.82rem', fontWeight: 800, color: '#fff',
        boxShadow: 'var(--shadow-glow)', flexShrink: 0,
      }}>S</div>
    </div>
  </header>
);

/* ─── App ─────────────────────────────────────────────────── */
function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('nexus_theme') || 'light');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  // Close sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <Router>
      <div className="app-container">

        {/* Overlay — mobile only */}
        {isMobile && sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`sidebar-wrapper ${isMobile ? (sidebarOpen ? 'open' : 'closed') : ''}`}>
          <Sidebar onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
        </div>

        {/* Main */}
        <main className="main-content">
          <TopBar
            theme={theme}
            toggleTheme={toggleTheme}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onMenuClick={() => setSidebarOpen(prev => !prev)}
          />
          <div className="content-area">
            <Routes>
              <Route path="/"                      element={<Dashboard searchQuery={searchQuery} />} />
              <Route path="/pdf-to-image"          element={<PdfToImageTool />} />
              <Route path="/image-to-pdf"          element={<ImageToPdfTool />} />
              <Route path="/pdf-merge-split"       element={<PdfMergeSplitTool />} />
              <Route path="/pdf-compressor"        element={<PdfCompressorTool />} />
              <Route path="/image-compressor"      element={<ImageCompressorTool />} />
              <Route path="/passport-photo"        element={<PassportPhotoTool />} />
              <Route path="/competence-calculator" element={<CompetenceCalculatorTool />} />
            </Routes>
          </div>
        </main>

      </div>
    </Router>
  );
}

export default App;
