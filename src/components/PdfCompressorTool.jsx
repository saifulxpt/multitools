import React, { useState } from 'react';
import { UploadCloud, FileText, Download, RefreshCw, CheckCircle2, FileArchive } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import toast from 'react-hot-toast';
import SEOHead from './SEOHead';

// Configure pdfjs worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

const PdfCompressorTool = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [compressedPdfBytes, setCompressedPdfBytes] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [mode, setMode] = useState('target'); // 'target', 'level'
  const [compressionLevel, setCompressionLevel] = useState('recommended');
  const [targetSizeKb, setTargetSizeKb] = useState(500);
  const [resultStats, setResultStats] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please select a valid PDF file.');
      return;
    }
    setSelectedFile(file);
    setCompressedPdfBytes(null);
    setResultStats(null);
    setProgress(0);
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

  const compressPdf = async () => {
    if (!selectedFile) return;
    setIsCompressing(true);
    setProgress(0);
    const toastId = toast.loading('Compressing PDF, please wait...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfjsDoc = await loadingTask.promise;
      const numPages = pdfjsDoc.numPages;

      const newPdfDoc = await PDFDocument.create();

      let targetBytes = selectedFile.size;
      if (mode === 'target') {
        targetBytes = targetSizeKb * 1024;
      } else {
        const mockRatio = compressionLevel === 'extreme' ? 0.35 : compressionLevel === 'recommended' ? 0.60 : 0.85;
        targetBytes = Math.floor(selectedFile.size * mockRatio);
      }

      const minBytesPerPage = 20 * 1024;
      targetBytes = Math.max(targetBytes, numPages * minBytesPerPage);
      const bytesPerPage = targetBytes / numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfjsDoc.getPage(i);

        let scale = 2.0;
        let quality = 0.85;

        if (mode === 'target') {
          if (targetSizeKb <= 150) { scale = 1.0; quality = 0.4; }
          else if (targetSizeKb <= 300) { scale = 1.5; quality = 0.6; }
          else if (targetSizeKb <= 500) { scale = 2.0; quality = 0.75; }
          else if (targetSizeKb <= 1000) { scale = 2.5; quality = 0.85; }
          else { scale = 3.0; quality = 0.95; }
        } else {
          if (compressionLevel === 'extreme') { scale = 1.0; quality = 0.4; }
          else if (compressionLevel === 'recommended') { scale = 2.0; quality = 0.75; }
          else { scale = 3.0; quality = 0.95; }
        }

        let viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: context, viewport }).promise;

        // Yield to the browser between pages to prevent UI freeze
        await new Promise(resolve => setTimeout(resolve, 0));

        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let base64Len = dataUrl.length - (dataUrl.indexOf(',') + 1);
        let sizeBytes = (base64Len * 3) / 4;

        while (sizeBytes > bytesPerPage && quality >= 0.15) {
          quality -= 0.15;
          if (quality < 0.4 && scale > 1.0) {
            scale -= 0.3;
            viewport = page.getViewport({ scale });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: context, viewport }).promise;
            quality = 0.7;
          }
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          base64Len = dataUrl.length - (dataUrl.indexOf(',') + 1);
          sizeBytes = (base64Len * 3) / 4;
        }

        const imgBytes = Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0));
        const pdfImage = await newPdfDoc.embedJpg(imgBytes);

        const originalViewport = page.getViewport({ scale: 1.0 });
        const newPage = newPdfDoc.addPage([originalViewport.width, originalViewport.height]);

        newPage.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: originalViewport.width,
          height: originalViewport.height
        });

        setProgress(Math.round((i / numPages) * 100));
      }

      const compressedBytes = await newPdfDoc.save({ useObjectStreams: true });
      const finalSize = compressedBytes.byteLength;
      const originalSize = selectedFile.size;
      const savingsPercent = Math.max(0, Math.round(((originalSize - finalSize) / originalSize) * 100));

      setCompressedPdfBytes(compressedBytes);
      setResultStats({
        originalSizeKb: (originalSize / 1024).toFixed(0),
        newSizeKb: (finalSize / 1024).toFixed(0),
        savings: savingsPercent
      });

      toast.success(`PDF compressed! Saved ${savingsPercent}% space.`, { id: toastId });

    } catch (err) {
      console.error('PDF Compression error:', err);
      toast.error('Error compressing PDF. Check if the file is encrypted or corrupted.', { id: toastId });
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadPdf = () => {
    if (!compressedPdfBytes) return;
    const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Compressed_${selectedFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('PDF downloaded successfully!');
  };

  return (
    <div className="animate-fade-in tool-container">
      <SEOHead
        title="PDF Compressor - Reduce PDF File Size Online Free"
        description="Compress PDF files online for free. Reduce PDF size for email attachments and uploads without losing quality. Works entirely in your browser — no upload needed."
        keywords="pdf compressor, reduce pdf size, compress pdf online, pdf optimizer, shrink pdf, pdf file size reducer"
      />

      <div>
        <span className="tool-header-badge">
          <FileArchive size={14} /> PDF Optimizer
        </span>
        <h2 className="page-title text-gradient">PDF Compressor</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
          Reduce PDF file sizes while maintaining quality. Ideal for email attachments and web uploads.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedFile ? '1fr 340px' : '1fr', gap: '32px' }}>
        <div>
          {!selectedFile ? (
            <div
              className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('pdf-compressor-upload').click()}
            >
              <input
                type="file"
                id="pdf-compressor-upload"
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />
              <UploadCloud className="upload-icon" />
              <div className="upload-text">
                <h3>Select or Drop PDF to Compress</h3>
                <p>Max file size: 50MB • Drag & drop or click to browse</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '56px', height: '56px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', wordBreak: 'break-all' }}>{selectedFile.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Original Size: <strong>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</strong>
                    </p>
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => { setSelectedFile(null); setCompressedPdfBytes(null); setResultStats(null); setProgress(0); }}>
                  Choose Another
                </button>
              </div>

              {isCompressing && (
                <div className="progress-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    <span>Compressing pages...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}

              {resultStats && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: '700' }}>
                      <CheckCircle2 size={20} /> Compressed Successfully
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>New Size</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {resultStats.newSizeKb > 1024 ? (resultStats.newSizeKb / 1024).toFixed(2) + ' MB' : resultStats.newSizeKb + ' KB'}
                      </div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>Space Saved</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16a34a' }}>
                        {resultStats.savings}%
                      </div>
                    </div>
                  </div>

                  <button className="btn-primary" onClick={downloadPdf} style={{ width: '100%', justifyContent: 'center' }}>
                    <Download size={18} /> Download Compressed PDF
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedFile && !resultStats && (
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
                    className={`btn-secondary ${mode === 'level' ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setMode('level')}
                  >
                    Auto Level
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
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', marginTop: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Output Size</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                      ~{targetSizeKb} KB
                    </div>
                  </div>
                </div>
              ) : (
                <div className="settings-group">
                  <div className="radio-options">
                    {[
                      { id: 'extreme', title: 'Extreme Compression', desc: 'Less quality, high compression' },
                      { id: 'recommended', title: 'Recommended', desc: 'Good quality, good compression' },
                      { id: 'less', title: 'Less Compression', desc: 'High quality, less compression' }
                    ].map((level) => (
                      <div
                        key={level.id}
                        className={`radio-card ${compressionLevel === level.id ? 'active' : ''}`}
                        onClick={() => setCompressionLevel(level.id)}
                      >
                        <input type="radio" checked={compressionLevel === level.id} onChange={() => setCompressionLevel(level.id)} />
                        <div>
                          <div className="radio-title">{level.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{level.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <hr style={{ borderColor: 'var(--border-color)' }} />

              <button className="btn-primary" onClick={compressPdf} disabled={isCompressing}>
                {isCompressing ? <RefreshCw size={18} className="animate-spin" /> : <FileArchive size={18} />}
                {isCompressing ? `Compressing... ${progress}%` : 'Compress PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfCompressorTool;
