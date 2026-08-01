import React from 'react';
import { Link } from 'react-router-dom';
import { Image, FileImage, Layers, Minimize2, UserCheck, ArrowRight, FileArchive, Calculator } from 'lucide-react';

const availableTools = [
  {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    description: 'Convert PDF documents into high-resolution PNG or JPEG images directly in your browser.',
    icon: Image,
    path: '/pdf-to-image',
    badge: 'Popular',
    keywords: 'pdf image convert extract png jpg page'
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Combine multiple JPG/PNG images into a single professional PDF document.',
    icon: FileImage,
    path: '/image-to-pdf',
    badge: 'New',
    keywords: 'image photo pdf combine merge create A4'
  },
  {
    id: 'pdf-merge-split',
    name: 'PDF Merge & Split',
    description: 'Combine multiple PDFs into one or extract specific page ranges into a new PDF.',
    icon: Layers,
    path: '/pdf-merge-split',
    badge: 'New',
    keywords: 'pdf merge split combine extract range document'
  },
  {
    id: 'pdf-compressor',
    name: 'PDF Compressor',
    description: 'Reduce PDF file sizes for easier sharing and faster uploads without losing quality.',
    icon: FileArchive,
    path: '/pdf-compressor',
    badge: 'New',
    keywords: 'pdf compress size reduce optimize shrink'
  },
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Reduce image file size (KB/MB) preserving maximum visual quality.',
    icon: Minimize2,
    path: '/image-compressor',
    badge: 'New',
    keywords: 'image compress size kb mb reduce optimize quality'
  },
  {
    id: 'passport-photo',
    name: 'Passport & Job Photo',
    description: 'Resize photos & signatures for BD Govt jobs (300x300 & 300x80 px <100KB).',
    icon: UserCheck,
    path: '/passport-photo',
    badge: 'Essential',
    keywords: 'passport job photo signature 300x300 300x80 resize govt admission'
  },
  {
    id: 'competence-calculator',
    name: 'Competence Calculator',
    description: 'Calculate passing percentage and competence instantly.',
    icon: Calculator,
    path: '/competence-calculator',
    badge: 'New',
    keywords: 'calculate percentage pass fail student competence tool'
  }
];

const Dashboard = ({ searchQuery = '' }) => {
  const filteredTools = availableTools.filter(tool => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return tool.name.toLowerCase().includes(q) || 
           tool.description.toLowerCase().includes(q) || 
           tool.keywords.toLowerCase().includes(q);
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h2 className="page-title text-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>Multi-Tool Suite</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Select a tool below to process your files securely in real-time.</p>
      </div>

      {filteredTools.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <h3>No tools found matching "{searchQuery}"</h3>
          <p style={{ marginTop: '8px' }}>Try searching for "PDF", "Image", "Compressor", or "Photo".</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {filteredTools.map((tool) => (
            <Link to={tool.path} key={tool.id} className="tool-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="tool-icon-wrapper">
                  <tool.icon size={24} />
                </div>
                {tool.badge && (
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'var(--accent-light)', color: 'var(--accent-secondary)', padding: '4px 10px', borderRadius: '999px' }}>
                    {tool.badge}
                  </span>
                )}
              </div>
              <div className="tool-card-content">
                <h3 className="tool-card-title">{tool.name}</h3>
                <p className="tool-card-desc">{tool.description}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: '700', color: 'var(--accent-primary)', marginTop: 'auto' }}>
                Open Tool <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
