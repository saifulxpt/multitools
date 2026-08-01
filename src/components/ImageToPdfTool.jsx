import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, FileImage, Download, RefreshCw, Layers, ArrowUp, ArrowDown, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import SEOHead from './SEOHead';

const ImageToPdfTool = () => {
  const [images, setImages] = useState([]);
  const [pageSize, setPageSize] = useState('a4'); // 'a4' | 'fit'
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files) => {
    const validImages = Array.from(files).filter(f => f.type.startsWith('image/'));
    const invalidCount = Array.from(files).length - validImages.length;
    if (invalidCount > 0) toast.error(`${invalidCount} file(s) skipped — only images are supported.`);
    if (validImages.length === 0) return;
    const newItems = validImages.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024).toFixed(0) + ' KB'
    }));
    setImages(prev => [...prev, ...newItems]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const moveImage = (index, direction) => {
    const updated = [...images];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImages(updated);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    const toastId = toast.loading('Generating PDF...');

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        const imageBytes = await item.file.arrayBuffer();
        let embeddedImage;

        if (item.file.type === 'image/png') {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
          // Default to JPG for jpg/jpeg/webp
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        if (pageSize === 'fit') {
          const page = pdfDoc.addPage([imgWidth, imgHeight]);
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: imgWidth,
            height: imgHeight,
          });
        } else {
          // Standard A4 dimensions (595.28 x 841.89 points)
          let pageW = 595.28;
          let pageH = 841.89;
          if (orientation === 'landscape') {
            [pageW, pageH] = [pageH, pageW];
          }

          const page = pdfDoc.addPage([pageW, pageH]);
          
          // Fit image within page preserving aspect ratio with margin
          const margin = 20;
          const maxW = pageW - margin * 2;
          const maxH = pageH - margin * 2;

          const scale = Math.min(maxW / imgWidth, maxH / imgHeight);
          const drawW = imgWidth * scale;
          const drawH = imgHeight * scale;

          const x = (pageW - drawW) / 2;
          const y = (pageH - drawH) / 2;

          page.drawImage(embeddedImage, {
            x,
            y,
            width: drawW,
            height: drawH,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Converted_Document_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF generated and downloaded!', { id: toastId });
    } catch (err) {
      console.error('PDF Generation error:', err);
      toast.error('Failed to generate PDF. Make sure all images are valid JPG/PNG files.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in tool-container">
      <SEOHead
        title="Images to PDF Converter - Combine Multiple Images into PDF Free"
        description="Convert multiple JPG, PNG images into a single professional PDF document online for free. Supports A4 and custom page sizes. Works entirely in your browser."
        keywords="image to pdf, jpg to pdf, png to pdf, combine images pdf, photos to pdf, convert images to pdf online free"
      />
      <div>
        <span className="tool-header-badge">
          <FileImage size={14} /> Image to PDF Converter
        </span>
        <h2 className="page-title text-gradient">Convert Images to PDF</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
          Combine multiple JPG/PNG images into a single professional PDF document.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: images.length > 0 ? '1fr 320px' : '1fr', gap: '32px' }}>
        <div className="main-tool-area">
          <div 
            className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('img-upload').click()}
          >
            <input 
              type="file" 
              id="img-upload" 
              multiple 
              accept="image/png, image/jpeg, image/jpg" 
              style={{ display: 'none' }} 
              onChange={(e) => handleFiles(e.target.files)}
            />
            <UploadCloud className="upload-icon" />
            <div className="upload-text">
              <h3>Select or Drag Multiple Images</h3>
              <p>Supports PNG, JPG, and JPEG images</p>
            </div>
          </div>

          {images.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Selected Images ({images.length})
                </h3>
                <button className="btn-secondary" onClick={() => setImages([])}>
                  Clear All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {images.map((img, index) => (
                  <div key={img.id} className="glass-panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img src={img.preview} alt={img.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)' }}>{img.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Page {index + 1} • {img.size}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => moveImage(index, -1)} disabled={index === 0}>
                        <ArrowUp size={16} />
                      </button>
                      <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>
                        <ArrowDown size={16} />
                      </button>
                      <button className="btn-secondary" style={{ padding: '6px 10px', color: '#ef4444', borderColor: '#fecaca' }} onClick={() => removeImage(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="sidebar-settings">
            <div className="settings-panel">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>Document Layout</h3>
              
              <div className="settings-group">
                <h4>Page Size</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className={`btn-secondary ${pageSize === 'a4' ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setPageSize('a4')}
                  >
                    A4 Size
                  </button>
                  <button 
                    className={`btn-secondary ${pageSize === 'fit' ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setPageSize('fit')}
                  >
                    Fit Image
                  </button>
                </div>
              </div>

              {pageSize === 'a4' && (
                <div className="settings-group">
                  <h4>Orientation</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className={`btn-secondary ${orientation === 'portrait' ? 'active' : ''}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => setOrientation('portrait')}
                    >
                      Portrait
                    </button>
                    <button 
                      className={`btn-secondary ${orientation === 'landscape' ? 'active' : ''}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => setOrientation('landscape')}
                    >
                      Landscape
                    </button>
                  </div>
                </div>
              )}

              <hr style={{ borderColor: 'var(--border-color)' }} />

              <button className="btn-primary" onClick={generatePdf} disabled={isProcessing}>
                {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageToPdfTool;
