import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Download, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import SEOHead from './SEOHead';

const ImageCompressorTool = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [compressedResult, setCompressedResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [targetSizeKb, setTargetSizeKb] = useState(100);
  const [qualitySlider, setQualitySlider] = useState(80);
  const [mode, setMode] = useState('target'); // 'target' | 'manual'
  const [isCompressing, setIsCompressing] = useState(false);

  // Web Worker ref — persists across renders
  const workerRef = useRef(null);

  // Check if OffscreenCanvas is supported (Safari < 16.4 doesn't support it fully)
  const offscreenSupported = typeof OffscreenCanvas !== 'undefined';

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    setSelectedFile(file);
    setOriginalPreview(URL.createObjectURL(file));
    setCompressedResult(null);
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

  useEffect(() => {
    if (selectedFile && originalPreview) {
      const timer = setTimeout(() => {
        compressImage();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [targetSizeKb, qualitySlider, mode, selectedFile, originalPreview]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const compressImageInWorker = (imageBitmap) => {
    return new Promise((resolve, reject) => {
      // Terminate any previous worker
      if (workerRef.current) workerRef.current.terminate();

      const worker = new Worker(
        new URL('../workers/imageWorker.js', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === 'COMPRESS_DONE') {
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
        type: 'COMPRESS_IMAGE',
        payload: {
          imageBitmap,
          originalSize: selectedFile.size,
          mode,
          targetSizeKb,
          qualitySlider
        }
      }, [imageBitmap]);
    });
  };

  // Fallback: compress on main thread (for browsers without OffscreenCanvas)
  const compressImageFallback = async () => {
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

      dataUrl = canvas.toDataURL('image/jpeg', quality);
      sizeBytes = ((dataUrl.length - (dataUrl.indexOf(',') + 1)) * 3) / 4;

      while (sizeBytes < targetMaxBytes * 0.85 && scale < 3.0) {
        scale = Math.min(3.0, scale + 0.2);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        sizeBytes = ((dataUrl.length - (dataUrl.indexOf(',') + 1)) * 3) / 4;
      }

      while (sizeBytes > targetMaxBytes && quality >= 0.1) {
        quality -= 0.08;
        if (quality < 0.4 && scale > 0.4) {
          scale -= 0.15;
          quality = 0.80;
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        sizeBytes = ((dataUrl.length - (dataUrl.indexOf(',') + 1)) * 3) / 4;
      }
    } else {
      dataUrl = canvas.toDataURL('image/jpeg', qualitySlider / 100);
      sizeBytes = ((dataUrl.length - (dataUrl.indexOf(',') + 1)) * 3) / 4;
    }

    const savingsPercent = Math.max(0, Math.round(((selectedFile.size - sizeBytes) / selectedFile.size) * 100));
    return { dataUrl, sizeKb: (sizeBytes / 1024).toFixed(0) + ' KB', savings: savingsPercent };
  };

  const compressImage = async () => {
    if (!selectedFile || !originalPreview) return;
    setIsCompressing(true);

    try {
      let result;

      if (offscreenSupported) {
        // Use Web Worker with OffscreenCanvas
        const blob = await fetch(originalPreview).then(r => r.blob());
        const imageBitmap = await createImageBitmap(blob);
        const workerResult = await compressImageInWorker(imageBitmap);

        // Convert ArrayBuffer back to dataURL for preview
        const resultBlob = new Blob([workerResult.buffer], { type: 'image/jpeg' });
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(resultBlob);
        });

        result = { dataUrl, sizeKb: workerResult.sizeKb, savings: workerResult.savings };
      } else {
        // Fallback for Safari and older browsers
        result = await compressImageFallback();
      }

      setCompressedResult(result);
    } catch (err) {
      console.error('Compression error:', err);
      toast.error('Error compressing image. Please try again.');
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
    toast.success('Image downloaded successfully!');
  };

  return (
    <div className="animate-fade-in tool-container">
      <SEOHead
        title="Image Compressor - Reduce Image File Size Online Free"
        description="Compress JPG, PNG and WebP images online for free. Reduce image file size while preserving maximum visual quality. Set target KB or use quality slider. Works 100% in browser."
        keywords="image compressor, reduce image size, compress jpg, compress png, image optimizer, reduce photo size, kb reducer"
      />

      <div>
        <span className="tool-header-badge">
          <ImageIcon size={14} /> Image Optimizer
        </span>
        <h2 className="page-title text-gradient">Image Compressor</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
          Reduce image file sizes (KB/MB) while preserving maximum visual quality.
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
              onClick={() => document.getElementById('comp-upload').click()}
            >
              <input
                type="file"
                id="comp-upload"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />
              <UploadCloud className="upload-icon" />
              <div className="upload-text">
                <h3>Select or Drop Image to Compress</h3>
                <p>Supports JPG, PNG, WebP images • Drag & drop or click to browse</p>
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
                  <RefreshCw size={16} className="animate-spin" />
                  {offscreenSupported ? 'Compressing in background...' : 'Compressing...'}
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
