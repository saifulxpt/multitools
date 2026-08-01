import React from 'react';
import { Link } from 'react-router-dom';
import {
  Image, FileImage, Layers, Minimize2, UserCheck,
  ArrowRight, FileArchive, Calculator, Zap, Shield, Globe
} from 'lucide-react';
import SEOHead from './SEOHead';

const TOOL_COLORS = [
  '#e85555', // PDF to Image  – red
  '#f59e0b', // Image to PDF  – amber
  '#8b5cf6', // Merge/Split   – violet
  '#0ea5e9', // PDF Compress  – sky
  '#10b981', // Img Compress  – emerald
  '#ec4899', // Passport      – pink
  '#6366f1', // % Calc        – indigo
];

const availableTools = [
  {
    id: 'pdf-to-image', name: 'PDF to Image',
    description: 'Convert PDF pages to crisp HD PNG or JPEG images instantly in your browser.',
    icon: Image, path: '/pdf-to-image', badge: 'Popular',
    keywords: 'pdf image convert extract png jpg page',
  },
  {
    id: 'image-to-pdf', name: 'Image to PDF',
    description: 'Combine multiple JPG / PNG images into one professional PDF document.',
    icon: FileImage, path: '/image-to-pdf', badge: 'New',
    keywords: 'image photo pdf combine merge create A4',
  },
  {
    id: 'pdf-merge-split', name: 'PDF Merge & Split',
    description: 'Reorder, rotate, merge or extract pages from PDFs with drag & drop.',
    icon: Layers, path: '/pdf-merge-split', badge: 'New',
    keywords: 'pdf merge split combine extract range document',
  },
  {
    id: 'pdf-compressor', name: 'PDF Compressor',
    description: 'Shrink PDF file sizes for easy sharing without quality loss.',
    icon: FileArchive, path: '/pdf-compressor', badge: 'New',
    keywords: 'pdf compress size reduce optimize shrink',
  },
  {
    id: 'image-compressor', name: 'Image Compressor',
    description: 'Reduce image size (KB/MB) while preserving maximum visual quality.',
    icon: Minimize2, path: '/image-compressor', badge: 'New',
    keywords: 'image compress size kb mb reduce optimize quality',
  },
  {
    id: 'passport-photo', name: 'Passport & Job Photo',
    description: 'Resize photos & signatures for BD Govt jobs (300×300 & 300×80 px, <100 KB).',
    icon: UserCheck, path: '/passport-photo', badge: 'Essential',
    keywords: 'passport job photo signature 300x300 300x80 resize govt admission',
  },
  {
    id: 'competence-calculator', name: 'Smart % Calculator',
    description: 'Discount, % increase/decrease, reverse price — 6 daily-life percentage tools.',
    icon: Calculator, path: '/competence-calculator', badge: 'New',
    keywords: 'percentage calculator discount increase decrease reverse price percent daily',
  },
];

const BADGE_COLOR = {
  Popular:   { bg: '#fff3cd', color: '#a16207' },
  New:       { bg: '#dbeafe', color: '#1d4ed8' },
  Essential: { bg: '#dcfce7', color: '#15803d' },
};

/* ─── Stat pill ──────────────────────────────── */
const Stat = ({ icon: Icon, label }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 16px',
    borderRadius: 99,
    background: 'rgba(255,255,255,.12)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,.2)',
    color: '#fff',
    fontSize: '.82rem', fontWeight: 600,
  }}>
    <Icon size={14} /> {label}
  </div>
);

const Dashboard = ({ searchQuery = '' }) => {
  const q = searchQuery.toLowerCase().trim();
  const filteredTools = availableTools.filter(tool =>
    !q ||
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.keywords.toLowerCase().includes(q)
  );

  return (
    <div className="animate-fade-in">
      <SEOHead
        title="Multi-Tools Suite — Free PDF & Image Tools Online"
        description="Free online tools: PDF to image, image to PDF, PDF compress & merge, image compressor, passport photo resizer. Works 100% in your browser — no upload needed."
        keywords="pdf tools online, image compressor, pdf compressor, pdf to image, passport photo resize, free online tools, image to pdf"
      />

      {/* ─── Hero ──────────────────────────────────────── */}
      {!q && (
        <div style={{
          borderRadius: 24,
          background: 'linear-gradient(135deg, #5b6ef5 0%, #9b6af5 55%, #d966ef 100%)',
          padding: '44px 40px',
          marginBottom: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* decorative blur circles */}
          <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'260px', height:'260px', borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'-60px', left:'30%', width:'220px', height:'220px', borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }} />

          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,.15)',
              border: '1px solid rgba(255,255,255,.25)',
              borderRadius: 99,
              padding: '5px 14px',
              fontSize: '.78rem', fontWeight: 700, color: '#fff',
              letterSpacing: '.04em', textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              ✦ All tools work offline · No upload · 100% free
            </div>

            <h1 style={{
              fontSize: 'clamp(1.7rem, 4vw, 2.6rem)',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.15,
              letterSpacing: '-.04em',
              marginBottom: 12,
            }}>
              Your All-in-One<br />
              PDF & Image Toolkit
            </h1>

            <p style={{ color: 'rgba(255,255,255,.82)', fontSize: '1rem', maxWidth: 480, lineHeight: 1.7 }}>
              Process files directly in your browser — no server, no waiting, no privacy risk.
            </p>
          </div>

          {/* Stat pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Stat icon={Zap}    label={`${availableTools.length} Tools`} />
            <Stat icon={Shield} label="100% Private" />
            <Stat icon={Globe}  label="Works Offline" />
          </div>
        </div>
      )}

      {/* ─── Section title ───────────────────────────── */}
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-.02em' }}>
            {q ? `Results for "${searchQuery}"` : 'Available Tools'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '.85rem', marginTop: 3 }}>
            {q ? `${filteredTools.length} tool(s) found` : 'Click any tool to get started instantly'}
          </p>
        </div>
      </div>

      {/* ─── Grid ────────────────────────────────────── */}
      {filteredTools.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
          <h3 style={{ fontWeight: 700, marginBottom: 6 }}>No tools found for "{searchQuery}"</h3>
          <p style={{ fontSize: '.9rem' }}>Try "PDF", "Image", "Compress" or "Photo".</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {filteredTools.map((tool, i) => {
            const accentColor = TOOL_COLORS[i % TOOL_COLORS.length];
            const badge = BADGE_COLOR[tool.badge];
            return (
              <Link to={tool.path} key={tool.id} className="tool-card">
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `${accentColor}18`,
                    color: accentColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <tool.icon size={22} />
                  </div>
                  {tool.badge && badge && (
                    <span style={{
                      fontSize: '.72rem', fontWeight: 800,
                      background: badge.bg, color: badge.color,
                      padding: '3px 9px', borderRadius: 99,
                    }}>
                      {tool.badge}
                    </span>
                  )}
                </div>

                {/* Text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <h3 className="tool-card-title">{tool.name}</h3>
                  <p className="tool-card-desc">{tool.description}</p>
                </div>

                {/* CTA */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: '.82rem', fontWeight: 700,
                  color: accentColor,
                  marginTop: 'auto',
                }}>
                  Open Tool <ArrowRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
