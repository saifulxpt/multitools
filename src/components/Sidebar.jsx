import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Image, FileImage, Layers, UserCheck, Minimize2, Settings, Sparkles, FileArchive, Calculator } from 'lucide-react';

const Sidebar = () => {
  const tools = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'PDF to Image', path: '/pdf-to-image', icon: Image },
    { name: 'Image to PDF', path: '/image-to-pdf', icon: FileImage },
    { name: 'PDF Merge & Split', path: '/pdf-merge-split', icon: Layers },
    { name: 'PDF Compressor', path: '/pdf-compressor', icon: FileArchive },
    { name: 'Image Compressor', path: '/image-compressor', icon: Minimize2 },
    { name: 'Passport & Job Photo', path: '/passport-photo', icon: UserCheck },
    { name: 'Competence Calculator', path: '/competence-calculator', icon: Calculator },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Sparkles size={26} className="sidebar-logo-icon" />
        <span className="sidebar-title">Nexus Tools</span>
      </div>
      <nav className="sidebar-nav">
        {tools.map((tool) => (
          <NavLink
            key={tool.path}
            to={tool.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={tool.path === '/'}
          >
            <tool.icon size={19} className="nav-icon" />
            <span>{tool.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-nav" style={{ flexGrow: 0, borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <div className="nav-item">
          <Settings size={19} className="nav-icon" />
          <span>Settings</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
