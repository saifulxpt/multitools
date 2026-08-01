import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, FileText, Settings, Image as ImageIcon, Download, RefreshCw, Layers, Eye, X } from 'lucide-react';

// Configure pdfjs worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

const PdfToImageTool = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageSize, setImageSize] = useState('original'); // 'original' | 'compressed'
  const [imageFormat, setImageFormat] = useState('png'); // 'png' | 'jpeg'
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedImages, setConvertedImages] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Modal for inspecting converted image quality
  const [previewImage, setPreviewImage] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setConvertedImages([]);
        setErrorMsg(null);
      } else {
        setErrorMsg('Please upload a valid PDF file.');
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setConvertedImages([]);
        setErrorMsg(null);
      } else {
        setErrorMsg('Please upload a valid PDF file.');
      }
    }
  };

  // Render a page at given scale and JPEG/PNG quality
  const renderPage = async (page, scale, format, quality) => {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: context, viewport }).promise;

    const dataUrl = canvas.toDataURL(format, quality);
    const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
    const sizeInBytes = (base64Length * 3) / 4;

    return {
      dataUrl,
      sizeInBytes,
      width: canvas.width,
      height: canvas.height
    };
  };

  const convertPdfToImages = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);
    setConvertedImages([]);
    setErrorMsg(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      
      const numPages = pdfDoc.numPages;
      const images = [];

      const targetMaxBytes = 1024 * 1024; // 1 MB (1000 KB limit)

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);

        let initialScale = 2.5; // High resolution (Ultra HD crisp quality)
        let format = imageSize === 'compressed' ? 'image/jpeg' : (imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png');
        let initialQuality = 0.95;

        // Render initially at crisp quality
        let result = await renderPage(page, initialScale, format, initialQuality);

        // Smart Compression: Only compress if image exceeds 1MB limit
        if (imageSize === 'compressed' && result.sizeInBytes > targetMaxBytes) {
          let currentScale = 2.2;
          let currentQuality = 0.88;

          // Step down gradually until just under 1 MB (~900-1000 KB) without sacrificing sharp text
          while (result.sizeInBytes > targetMaxBytes && currentQuality >= 0.5) {
            result = await renderPage(page, currentScale, 'image/jpeg', currentQuality);
            if (result.sizeInBytes > targetMaxBytes) {
              currentQuality -= 0.08;
              if (currentQuality < 0.65 && currentScale > 1.5) {
                currentScale -= 0.3;
                currentQuality = 0.85;
              }
            }
          }
        }

        const sizeFormatted = result.sizeInBytes > 1024 * 1024 
          ? `${(result.sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
          : `${(result.sizeInBytes / 1024).toFixed(0)} KB`;

        const isJpg = format === 'image/jpeg' || (imageSize === 'compressed');

        images.push({
          pageNumber: i,
          dataUrl: result.dataUrl,
          size: sizeFormatted,
          dimensions: `${result.width} × ${result.height} px`,
          extension: isJpg ? 'jpg' : 'png'
        });

        setProgress(Math.round((i / numPages) * 100));
      }

      setConvertedImages(images);
    } catch (err) {
      console.error('PDF Conversion error:', err);
      setErrorMsg(`Error processing PDF: ${err.message || 'Check if the file is password protected.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (dataUrl, pageNum, ext) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_page_${pageNum}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = () => {
    convertedImages.forEach(img => {
      downloadImage(img.dataUrl, img.pageNumber, img.extension);
    });
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setConvertedImages([]);
    setProgress(0);
    setErrorMsg(null);
  };

  return (
    <div className="animate-fade-in tool-container">
      <div>
        <span className="tool-header-badge">
          <Layers size={14} /> High-Definition PDF Converter
        </span>
        <h2 className="page-title text-gradient">PDF to Image Converter</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
          Extract ultra-sharp HD images from your PDF documents in seconds.
        </p>
      </div>

      {errorMsg && (
        <div style={{ padding: '14px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#dc2626', fontSize: '0.92rem', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: convertedImages.length > 0 ? '1fr' : '1fr 340px', gap: '32px' }}>
        
        {/* Main Upload / Conversion Area */}
        <div className="main-tool-area">
          {!selectedFile ? (
            <div 
              className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('pdf-upload').click()}
            >
              <input 
                type="file" 
                id="pdf-upload" 
                accept=".pdf" 
                style={{ display: 'none' }} 
                onChange={handleChange}
              />
              <UploadCloud className="upload-icon" />
              <div className="upload-text">
                <h3>Select or Drop PDF File</h3>
                <p>Upload a PDF document to convert its pages to crisp images</p>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '12px', background: '#fee2e2', color: '#ef4444', borderRadius: '12px' }}>
                    <FileText size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedFile.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for conversion
                    </p>
                  </div>
                </div>
                <button className="btn-secondary" onClick={resetSelection}>
                  <RefreshCw size={16} /> Choose Another
                </button>
              </div>

              {isProcessing && (
                <div className="progress-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    <span>Rendering high-resolution pages...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Display Converted Images Result Grid */}
          {convertedImages.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <div className="results-header">
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    Converted Pages ({convertedImages.length})
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Click an image to preview in HD or download individual pages.
                  </p>
                </div>
                <button className="btn-primary" onClick={downloadAllImages} style={{ width: 'auto' }}>
                  <Download size={18} /> Download All Pages
                </button>
              </div>

              <div className="results-grid">
                {convertedImages.map((img) => (
                  <div key={img.pageNumber} className="result-card">
                    <div className="result-img-wrapper" onClick={() => setPreviewImage(img)} style={{ cursor: 'pointer' }}>
                      <img src={img.dataUrl} alt={`Page ${img.pageNumber}`} className="result-img" />
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px', borderRadius: '8px' }}>
                        <Eye size={16} />
                      </div>
                    </div>
                    <div className="result-info">
                      <div>
                        <span className="result-page-num">Page {img.pageNumber}</span>
                        <div className="result-size">{img.size} • {img.extension.toUpperCase()} • {img.dimensions}</div>
                      </div>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '8px 12px' }}
                        onClick={() => downloadImage(img.dataUrl, img.pageNumber, img.extension)}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Settings Options */}
        {convertedImages.length === 0 && (
          <div className="sidebar-settings">
            <div className="settings-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={20} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Conversion Settings</h3>
              </div>
              
              <div className="settings-group">
                <h4>Image Size & Quality</h4>
                <div className="radio-options">
                  <div 
                    className={`radio-card ${imageSize === 'original' ? 'active' : ''}`}
                    onClick={() => setImageSize('original')}
                  >
                    <input 
                      type="radio" 
                      name="size" 
                      checked={imageSize === 'original'}
                      onChange={() => setImageSize('original')}
                    />
                    <div>
                      <div className="radio-title">Original (Maximum Clarity)</div>
                      <div className="radio-subtitle">Ultra HD 2.5x Scale resolution</div>
                    </div>
                  </div>

                  <div 
                    className={`radio-card ${imageSize === 'compressed' ? 'active' : ''}`}
                    onClick={() => setImageSize('compressed')}
                  >
                    <input 
                      type="radio" 
                      name="size" 
                      checked={imageSize === 'compressed'}
                      onChange={() => setImageSize('compressed')}
                    />
                    <div>
                      <div className="radio-title">Smart Target Size (Max 1 MB)</div>
                      <div className="radio-subtitle">Keeps maximum quality, reduces only if over 1000 KB</div>
                    </div>
                  </div>
                </div>
              </div>

              {imageSize === 'original' && (
                <div className="settings-group">
                  <h4>Format</h4>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      className={`btn-secondary ${imageFormat === 'png' ? 'active' : ''}`}
                      style={{ flex: 1, justifyContent: 'center', borderColor: imageFormat === 'png' ? 'var(--accent-primary)' : '' }}
                      onClick={() => setImageFormat('png')}
                    >
                      PNG (Crisp)
                    </button>
                    <button 
                      className={`btn-secondary ${imageFormat === 'jpeg' ? 'active' : ''}`}
                      style={{ flex: 1, justifyContent: 'center', borderColor: imageFormat === 'jpeg' ? 'var(--accent-primary)' : '' }}
                      onClick={() => setImageFormat('jpeg')}
                    >
                      JPEG
                    </button>
                  </div>
                </div>
              )}

              <hr style={{ borderColor: 'var(--border-color)' }} />

              <button 
                className="btn-primary" 
                disabled={!selectedFile || isProcessing}
                onClick={convertPdfToImages}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Converting...
                  </>
                ) : (
                  <>
                    <ImageIcon size={18} /> Convert PDF Now
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Full Resolution Image Preview Modal */}
      {previewImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => downloadImage(previewImage.dataUrl, previewImage.pageNumber, previewImage.extension)}>
              <Download size={18} /> Download
            </button>
            <button className="btn-secondary" onClick={() => setPreviewImage(null)} style={{ background: 'white' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ maxWidth: '90%', maxHeight: '85%', overflow: 'auto', background: 'white', borderRadius: '12px', padding: '16px' }}>
            <img src={previewImage.dataUrl} alt="HD Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToImageTool;
