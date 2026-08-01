import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Download, RefreshCw, UserCheck, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import SEOHead from './SEOHead';

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
  const [dragActive, setDragActive] = useState(false);

  const workerRef = useRef(null);
  const offscreenSupported = typeof OffscreenCanvas !== 'undefined';

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    setSelectedFile(file);
    setOriginalPreview(URL.createObjectURL(file));
    setResultImage(null);
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const resizeInWorker = (imageBitmap, targetW, targetH, maxKb) => {
    return new Promise((resolve, reject) => {
      if (workerRef.current) workerRef.current.terminate();

      const worker = new Worker(
        new URL('../workers/imageWorker.js', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === 'RESIZE_DONE') {
          resolve(payload);
          worker.terminate();
          workerRef.current = null;
        } else if (type === 'ERROR') {
          reject(new Error(payload.message));
          worker.terminate();
          workerRef.current = null;
        }
      };

      worker.onerror = (err) => {
        reject(err);
        worker.terminate();
        workerRef.current = null;
      };

      worker.postMessage({
        type: 'RESIZE_PHOTO',
        payload: { imageBitmap, targetW, targetH, maxKb }
      }, [imageBitmap]);
    });
  };

  // Fallback resize for browsers without OffscreenCanvas
  const resizeFallback = async (targetW, targetH, maxKb) => {
    const img = new Image();
    img.src = originalPreview;
    await new Promise((res) => (img.onload = res));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = targetW;
    canvas.height = targetH;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const targetMaxBytes = maxKb * 1024;
    let quality = 0.95;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    let sizeBytes = ((dataUrl.length - (dataUrl.indexOf(',') + 1)) * 3) / 4;

    while (sizeBytes > targetMaxBytes && quality >= 0.2) {
      quality -= 0.05;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
      sizeBytes = ((dataUrl.length - (dataUrl.indexOf(',') + 1)) * 3) / 4;
    }

    return { dataUrl, width: targetW, height: targetH, sizeKb: (sizeBytes / 1024).toFixed(0) + ' KB' };
  };

  const processPhoto = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    const toastId = toast.loading('Resizing photo...');

    try {
      const targetW = selectedPreset.id === 'custom' ? customW : selectedPreset.width;
      const targetH = selectedPreset.id === 'custom' ? customH : selectedPreset.height;
      const maxKb = selectedPreset.id === 'custom' ? customKb : selectedPreset.maxKb;

      let result;

      if (offscreenSupported) {
        const blob = await fetch(originalPreview).then(r => r.blob());
        const imageBitmap = await createImageBitmap(blob);
        const workerResult = await resizeInWorker(imageBitmap, targetW, targetH, maxKb);

        // Convert ArrayBuffer to dataURL
        const resultBlob = new Blob([workerResult.buffer], { type: 'image/jpeg' });
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(resultBlob);
        });

        result = { dataUrl, width: workerResult.width, height: workerResult.height, sizeKb: workerResult.sizeKb };
      } else {
        result = await resizeFallback(targetW, targetH, maxKb);
      }

      setResultImage(result);
      toast.success(`Photo resized to ${result.width}×${result.height}px (${result.sizeKb})`, { id: toastId });
    } catch (err) {
      console.error('Photo processing error:', err);
      toast.error('Error resizing photo. Please try again.', { id: toastId });
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
    toast.success('Photo downloaded successfully!');
  };

  return (
    <div className="animate-fade-in tool-container">
      <SEOHead
        title="Passport & Job Photo Resizer - BD Govt Standard Online Free"
        description="Resize photos and signatures for Bangladesh government job applications online. Supports 300x300px photo and 300x80px signature under 100KB. Works entirely in your browser."
        keywords="passport photo resize, bd govt job photo, 300x300 photo, 300x80 signature, job application photo, passport size photo bangladesh"
      />

      <div>
        <span className="tool-header-badge">
          <UserCheck size={14} /> Official Job & Passport Photo Tool
        </span>
        <h2 className="page-title text-gradient">Passport & Job Photo Resizer</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
          Instantly crop and resize photos & signatures for BD Govt job applications (300x300 & 300x80 px).
          {offscreenSupported && <span style={{ marginLeft: '8px', fontSize: '0.82rem', color: '#16a34a', fontWeight: '700' }}>⚡ Web Worker Enabled</span>}
        </p>
      </div>

      <div className={`tool-page-grid ${selectedFile ? 'has-sidebar' : 'no-sidebar'}`}>
        <div>
          {!selectedFile ? (
            <div
              className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('photo-upload').click()}
            >
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
                <p>Select or drag your image file to resize according to official rules</p>
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
                {isProcessing ? 'Processing...' : 'Generate & Resize Photo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassportPhotoTool;
