import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Image, FileImage, Layers, UserCheck,
  Minimize2, FileArchive, Calculator, Sparkles, GitBranch, X
} from 'lucide-react';

const tools = [
  { name: 'Dashboard',            path: '/',                      icon: LayoutDashboard },
  { name: 'PDF to Image',         path: '/pdf-to-image',          icon: Image },
  { name: 'Image to PDF',         path: '/image-to-pdf',          icon: FileImage },
  { name: 'PDF Merge & Split',    path: '/pdf-merge-split',       icon: Layers },
  { name: 'PDF Compressor',       path: '/pdf-compressor',        icon: FileArchive },
  { name: 'Image Compressor',     path: '/image-compressor',      icon: Minimize2 },
  { name: 'Passport & Job Photo', path: '/passport-photo',        icon: UserCheck },
  { name: 'Smart % Calculator',   path: '/competence-calculator', icon: Calculator },
];

const Sidebar = ({ onClose, isMobile }) => (
  <aside className="sidebar">
    {/* Logo + close on mobile */}
    <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'var(--accent-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Sparkles size={16} color="#fff" />
        </div>
        <span className="sidebar-title">Nexus Tools</span>
      </div>
      {isMobile && (
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 4, borderRadius: 8,
        }}>
          <X size={20} />
        </button>
      )}
    </div>


    {/* Nav */}
    <nav className="sidebar-nav">
      <div style={{ padding: '4px 4px 8px', fontSize: '.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
        Tools
      </div>

      {tools.map((tool) => (
        <NavLink
          key={tool.path}
          to={tool.path}
          end={tool.path === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          onClick={() => isMobile && onClose && onClose()}
        >
          <tool.icon size={17} className="nav-icon" />
          <span>{tool.name}</span>
        </NavLink>
      ))}
    </nav>

    {/* Footer */}
    <div style={{
      padding: '14px 14px 18px',
      borderTop: '1px solid var(--border-color)',
    }}>
      <a
        href="https://github.com/saifulxpt/multitools"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '9px 12px', borderRadius: 10,
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '.82rem', fontWeight: 600,
          transition: 'all .18s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <GitBranch size={16} />
        View on GitHub
      </a>

      <div style={{
        marginTop: 10,
        padding: '0 12px',
        fontSize: '.72rem',
        color: 'var(--text-muted)',
        lineHeight: 1.5,
      }}>
        All processing happens locally in your browser. No files are uploaded.
      </div>
    </div>
  </aside>
);

export default Sidebar;
