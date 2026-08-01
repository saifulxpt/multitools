import React, { useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Download, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';

const ImageCompressorTool = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [compressedResult, setCompressedResult] = useState(null);

  const [targetSizeKb, setTargetSizeKb] = useState(100); // Max size in KB (e.g., 100, 200, 500)
  const [qualitySlider, setQualitySlider] = useState(80); // 10 to 100%
  const [mode, setMode] = useState('target'); // 'target' | 'manual'
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setSelectedFile(file);
    setOriginalPreview(URL.createObjectURL(file));
    setCompressedResult(null);
  };

  useEffect(() => {
    if (selectedFile && originalPreview) {
      const timer = setTimeout(() => {
        compressImage();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [targetSizeKb, qualitySlider, mode, selectedFile, originalPreview]);

  const compressImage = async () => {
    if (!selectedFile || !originalPreview) return;
    setIsCompressing(true);

    try {
      const img = new Image();
      img.src = originalPreview;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let width = img.width;
      let height = img.height;

      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let dataUrl;
      let sizeBytes;

      if (mode === 'target') {
        const targetMaxBytes = targetSizeKb * 1024;
        let quality = 0.92;
        let scale = 1.0;

        // Upscale if the image is too small for the requested target size
        while (sizeBytes < targetMaxBytes * 0.85) {
          if (quality < 1.0) {
            quality = Math.min(1.0, quality + 0.05);
          } else if (scale < 3.0) {
            scale += 0.2;
          } else {
            break;
          }
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64Len = dataUrl.length - (dataUrl.indexOf(',') + 1);
          sizeBytes = (base64Len * 3) / 4;
        }

        // Iterative compression loop to stay right under target size if it's too big
        while (sizeBytes > targetMaxBytes && quality >= 0.1) {
          quality -= 0.08;
          if (quality < 0.4 && scale > 0.4) {
            scale -= 0.15;
            quality = 0.80;
          }

          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64Len = dataUrl.length - (dataUrl.indexOf(',') + 1);
          sizeBytes = (base64Len * 3) / 4;
        }
      } else {
        // Manual quality slider
        dataUrl = canvas.toDataURL('image/jpeg', qualitySlider / 100);
        const base64Len = dataUrl.length - (dataUrl.indexOf(',') + 1);
        sizeBytes = (base64Len * 3) / 4;
      }

      const savingsPercent = Math.max(0, Math.round(((selectedFile.size - sizeBytes) / selectedFile.size) * 100));

      setCompressedResult({
        dataUrl,
        sizeKb: (sizeBytes / 1024).toFixed(0) + ' KB',
        savings: savingsPercent
      });
    } catch (err) {
      console.error('Compression error:', err);
      alert('Error compressing image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadCompressed = () => {
    if (!compressedResult) return;
    const link = document.createElement('a');
    link.href = compressedResult.dataUrl;
    link.download = `Compressed_${selectedFile.name.replace(/\.[^/.]+$/, '')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in tool-container">
      <div>
        <span className="tool-header-badge">
          <ImageIcon size={14} /> Image Optimizer
        </span>
        <h2 className="page-title text-gradient">Image Compressor</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
          Reduce image file sizes (KB/MB) while preserving maximum visual quality.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedFile ? '1fr 340px' : '1fr', gap: '32px' }}>
        <div>
          {!selectedFile ? (
            <div className="upload-zone" onClick={() => document.getElementById('comp-upload').click()}>
              <input 
                type="file" 
                id="comp-upload" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />
              <UploadCloud className="upload-icon" />
              <div className="upload-text">
                <h3>Select Image to Compress</h3>
                <p>Supports JPG, PNG, WebP images</p>
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
                <button className="btn-secondary" onClick={() => { setSelectedFile(null); setCompressedResult(null); }}>
                  Choose Another
                </button>
              </div>

              {/* Live Result Preview */}
              {compressedResult && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: '700' }}>
                      <CheckCircle2 size={20} /> Compressed Successfully ({compressedResult.savings}% smaller)
                    </div>
                    <button className="btn-primary" onClick={downloadCompressed} style={{ width: 'auto' }}>
                      <Download size={18} /> Download ({compressedResult.sizeKb})
                    </button>
                  </div>

                  <div style={{ height: '320px', background: '#f1f5f9', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={compressedResult.dataUrl} alt="Compressed" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="sidebar-settings">
            <div className="settings-panel">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Compression Settings</h3>

              <div className="settings-group">
                <h4>Mode</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className={`btn-secondary ${mode === 'target' ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setMode('target')}
                  >
                    Target Size
                  </button>
                  <button 
                    className={`btn-secondary ${mode === 'manual' ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setMode('manual')}
                  >
                    Quality Slider
                  </button>
                </div>
              </div>

              {mode === 'target' ? (
                <div className="settings-group">
                  <h4>Target File Size (KB)</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {[100, 300, 500, 1000].map(kb => (
                      <button 
                        key={kb} 
                        className={`btn-secondary ${targetSizeKb === kb ? 'active' : ''}`} 
                        style={{ padding: '6px 12px', flex: 1, minWidth: '60px' }} 
                        onClick={() => setTargetSizeKb(kb)}
                      >
                        {kb}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="number" 
                      value={targetSizeKb} 
                      onChange={(e) => setTargetSizeKb(Number(e.target.value) || 10)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                      min="10"
                    />
                    <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>KB</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Type any custom size (e.g. 750, 1500). Preview updates automatically.
                  </p>
                </div>
              ) : (
                <div className="settings-group">
                  <h4>Quality: {qualitySlider}%</h4>
                  <input 
                    type="range" 
                    min="10" 
                    max="95" 
                    value={qualitySlider}
                    onChange={(e) => setQualitySlider(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Preview updates automatically as you slide.
                  </p>
                </div>
              )}

              {isCompressing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '0.9rem', marginTop: '16px', fontWeight: '600' }}>
                  <RefreshCw size={16} className="animate-spin" /> Compressing...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCompressorTool;
