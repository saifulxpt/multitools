import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, Download, RefreshCw, UserCheck, Edit3 } from 'lucide-react';

const presets = [
  { id: 'bd-photo', name: '📸 Govt Job Photo', width: 300, height: 300, maxKb: 100, desc: '300 × 300 px (Max 100 KB)' },
  { id: 'bd-sig', name: '✍️ Govt Job Signature', width: 300, height: 80, maxKb: 60, desc: '300 × 80 px (Max 60 KB)' },
  { id: 'passport', name: '🛂 Passport Photo (35x45mm)', width: 413, height: 531, maxKb: 300, desc: '413 × 531 px (Standard Passport)' },
  { id: 'custom', name: '⚙️ Custom Dimensions', width: 300, height: 300, maxKb: 100, desc: 'Set custom width, height & KB' }
];

const PassportPhotoTool = () => {
  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [customW, setCustomW] = useState(300);
  const [customH, setCustomH] = useState(300);
  const [customKb, setCustomKb] = useState(100);

  const [selectedFile, setSelectedFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setSelectedFile(file);
    setOriginalPreview(URL.createObjectURL(file));
    setResultImage(null);
  };

  const processPhoto = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      const targetW = selectedPreset.id === 'custom' ? customW : selectedPreset.width;
      const targetH = selectedPreset.id === 'custom' ? customH : selectedPreset.height;
      const maxKb = selectedPreset.id === 'custom' ? customKb : selectedPreset.maxKb;

      const img = new Image();
      img.src = originalPreview;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = targetW;
      canvas.height = targetH;

      // Fill white background for signature/photo clarity
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);

      // Draw image scaled to fit target dimensions
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Enforce Max KB size
      const targetMaxBytes = maxKb * 1024;
      let quality = 0.95;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      let base64Len = dataUrl.length - (dataUrl.indexOf(',') + 1);
      let sizeBytes = (base64Len * 3) / 4;

      while (sizeBytes > targetMaxBytes && quality >= 0.2) {
        quality -= 0.05;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        base64Len = dataUrl.length - (dataUrl.indexOf(',') + 1);
        sizeBytes = (base64Len * 3) / 4;
      }

      setResultImage({
        dataUrl,
        width: targetW,
        height: targetH,
        sizeKb: (sizeBytes / 1024).toFixed(0) + ' KB'
      });
    } catch (err) {
      console.error('Photo processing error:', err);
      alert('Error resizing photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPhoto = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage.dataUrl;
    link.download = `${selectedPreset.id}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in tool-container">
      <div>
        <span className="tool-header-badge">
          <UserCheck size={14} /> Official Job & Passport Photo Tool
        </span>
        <h2 className="page-title text-gradient">Passport & Job Photo Resizer</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
          Instantly crop and resize photos & signatures for BD Govt job applications (300x300 & 300x80 px).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedFile ? '1fr 340px' : '1fr', gap: '32px' }}>
        <div>
          {!selectedFile ? (
            <div className="upload-zone" onClick={() => document.getElementById('photo-upload').click()}>
              <input 
                type="file" 
                id="photo-upload" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />
              <UploadCloud className="upload-icon" />
              <div className="upload-text">
                <h3>Upload Photo or Signature Image</h3>
                <p>Select your image file to resize according to official rules</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src={originalPreview} alt="Original" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px' }} />
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{selectedFile.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Original Size: <strong>{(selectedFile.size / 1024).toFixed(0)} KB</strong>
                    </p>
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => { setSelectedFile(null); setResultImage(null); }}>
                  Choose Another
                </button>
              </div>

              {/* Render Resized Photo Output */}
              {resultImage && (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      Ready: {resultImage.width} × {resultImage.height} px ({resultImage.sizeKb})
                    </div>
                    <button className="btn-primary" onClick={downloadPhoto} style={{ width: 'auto' }}>
                      <Download size={18} /> Download Resized Image
                    </button>
                  </div>

                  <div style={{ display: 'inline-block', padding: '12px', background: '#f1f5f9', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                    <img 
                      src={resultImage.dataUrl} 
                      alt="Resized Output" 
                      style={{ 
                        maxWidth: '100%', 
                        height: 'auto',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        background: '#ffffff'
                      }} 
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="sidebar-settings">
            <div className="settings-panel">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Select Preset</h3>

              <div className="radio-options">
                {presets.map((preset) => (
                  <div 
                    key={preset.id}
                    className={`radio-card ${selectedPreset.id === preset.id ? 'active' : ''}`}
                    onClick={() => setSelectedPreset(preset)}
                  >
                    <input type="radio" checked={selectedPreset.id === preset.id} onChange={() => setSelectedPreset(preset)} />
                    <div>
                      <div className="radio-title">{preset.name}</div>
                      <div className="radio-subtitle">{preset.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedPreset.id === 'custom' && (
                <div className="settings-group" style={{ marginTop: '12px' }}>
                  <h4>Custom Dimensions</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Width (px)</label>
                      <input 
                        type="number" 
                        value={customW} 
                        onChange={(e) => setCustomW(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Height (px)</label>
                      <input 
                        type="number" 
                        value={customH} 
                        onChange={(e) => setCustomH(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Max Size (KB)</label>
                    <input 
                      type="number" 
                      value={customKb} 
                      onChange={(e) => setCustomKb(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                </div>
              )}

              <hr style={{ borderColor: 'var(--border-color)' }} />

              <button className="btn-primary" onClick={processPhoto} disabled={isProcessing}>
                {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Edit3 size={18} />}
                Generate & Resize Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassportPhotoTool;
