import React, { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadCloud, FileText, Download, RefreshCw, Layers, ArrowLeft, ArrowRight, Trash2, RotateCw, CheckSquare, Square, Scissors, GripVertical } from 'lucide-react';

// Configure PDF.js worker for local Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

const PdfMergeSplitTool = () => {
  const [activeTab, setActiveTab] = useState('organizer'); // 'organizer' | 'range_split'

  // PDF Page Organizer State
  const [pdfFiles, setPdfFiles] = useState([]);
  const [pagesList, setPagesList] = useState([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Drag and Drop reordering state
  const [draggedPageIndex, setDraggedPageIndex] = useState(null);

  // Range Split State
  const [splitFile, setSplitFile] = useState(null);
  const [splitPdfDoc, setSplitPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);

  // --- PDF ORGANIZER LOGIC ---
  const handleAddPdfs = async (files) => {
    const validFiles = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (validFiles.length === 0) return;

    setIsLoadingPages(true);

    try {
      const newPages = [];
      const updatedFiles = [...pdfFiles, ...validFiles];
      setPdfFiles(updatedFiles);

      for (let fileIdx = 0; fileIdx < validFiles.length; fileIdx++) {
        const file = validFiles[fileIdx];
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        
        for (let p = 1; p <= pdfDoc.numPages; p++) {
          const page = await pdfDoc.getPage(p);
          const viewport = page.getViewport({ scale: 0.35 });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: context, viewport }).promise;

          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);

          newPages.push({
            id: `page-${Date.now()}-${fileIdx}-${p}-${Math.random()}`,
            file,
            fileIndex: pdfFiles.length + fileIdx,
            pageNumber: p,
            fileName: file.name,
            thumbnailUrl,
            rotation: 0,
            selected: true
          });
        }
      }

      setPagesList(prev => [...prev, ...newPages]);
    } catch (err) {
      console.error('Error loading PDF pages:', err);
      alert('Error loading PDF files. Please ensure files are not encrypted.');
    } finally {
      setIsLoadingPages(false);
    }
  };

  const removePage = (id) => {
    setPagesList(prev => prev.filter(p => p.id !== id));
  };

  const rotatePage = (id) => {
    setPagesList(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, rotation: (p.rotation + 90) % 360 };
      }
      return p;
    }));
  };

  const movePage = (index, dir) => {
    const updated = [...pagesList];
    const target = index + dir;
    if (target < 0 || target >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setPagesList(updated);
  };

  // Drag and Drop Reordering Handlers
  const handlePageDragStart = (e, index) => {
    setDraggedPageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePageDragEnter = (index) => {
    if (draggedPageIndex === null || draggedPageIndex === index) return;
    const updated = [...pagesList];
    const itemToMove = updated[draggedPageIndex];
    updated.splice(draggedPageIndex, 1);
    updated.splice(index, 0, itemToMove);
    setDraggedPageIndex(index);
    setPagesList(updated);
  };

  const handlePageDragEnd = () => {
    setDraggedPageIndex(null);
  };

  const toggleSelectPage = (id) => {
    setPagesList(prev => prev.map(p => {
      if (p.id === id) return { ...p, selected: !p.selected };
      return p;
    }));
  };

  const exportOrganizedPdf = async () => {
    const activePages = pagesList.filter(p => p.selected);
    if (activePages.length === 0) {
      alert('Please keep at least 1 page selected.');
      return;
    }

    setIsExporting(true);

    try {
      const mergedPdf = await PDFDocument.create();
      const loadedDocsMap = new Map();

      for (const item of activePages) {
        let pdfLibDoc = loadedDocsMap.get(item.file);
        if (!pdfLibDoc) {
          const bytes = await item.file.arrayBuffer();
          pdfLibDoc = await PDFDocument.load(bytes);
          loadedDocsMap.set(item.file, pdfLibDoc);
        }

        const [copiedPage] = await mergedPdf.copyPages(pdfLibDoc, [item.pageNumber - 1]);
        
        if (item.rotation > 0) {
          const currentRot = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRot + item.rotation) % 360));
        }

        mergedPdf.addPage(copiedPage);
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Organized_Document_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const clearAllPages = () => {
    setPdfFiles([]);
    setPagesList([]);
  };

  // --- RANGE SPLIT LOGIC ---
  const handleSplitFile = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) return;
    setSplitFile(file);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      setSplitPdfDoc(pdf);
      const total = pdf.getPageCount();
      setNumPages(total);
      setSelectedPages(`1-${total}`);
    } catch (err) {
      console.error('Failed to load PDF for split:', err);
      alert('Could not read PDF file.');
    }
  };

  const processSplit = async () => {
    if (!splitPdfDoc || !selectedPages) return;
    setIsSplitting(true);

    try {
      const pageNumbers = new Set();
      const parts = selectedPages.split(',');

      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.max(1, start); i <= Math.min(numPages, end); i++) {
              pageNumbers.add(i - 1);
            }
          }
        } else {
          const p = Number(trimmed);
          if (!isNaN(p) && p >= 1 && p <= numPages) {
            pageNumbers.add(p - 1);
          }
        }
      });

      const indices = Array.from(pageNumbers).sort((a, b) => a - b);
      if (indices.length === 0) {
        alert('Invalid page range selected.');
        setIsSplitting(false);
        return;
      }

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(splitPdfDoc, indices);
      copiedPages.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Extracted_Pages_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Split error:', err);
      alert('Error extracting PDF pages.');
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <div className="animate-fade-in tool-container">
      <div>
        <span className="tool-header-badge">
          <Layers size={14} /> PDF Studio & Drag Page Organizer
        </span>
        <h2 className="page-title text-gradient">PDF Page Organizer & Merger</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
          Drag and drop page cards to reorder, delete unwanted pages, rotate, and combine multiple PDFs.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <button 
          className={`btn-secondary ${activeTab === 'organizer' ? 'active' : ''}`}
          onClick={() => setActiveTab('organizer')}
        >
          <Layers size={18} /> Drag Page Organizer
        </button>
        <button 
          className={`btn-secondary ${activeTab === 'range_split' ? 'active' : ''}`}
          onClick={() => setActiveTab('range_split')}
        >
          <Scissors size={18} /> Quick Range Split
        </button>
      </div>

      {/* ORGANIZER TAB */}
      {activeTab === 'organizer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Add PDF Upload Area */}
          <div 
            className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); handleAddPdfs(e.dataTransfer.files); }}
            onClick={() => document.getElementById('organizer-upload').click()}
            style={{ padding: pagesList.length > 0 ? '30px 20px' : '50px 32px' }}
          >
            <input 
              type="file" 
              id="organizer-upload" 
              multiple 
              accept=".pdf" 
              style={{ display: 'none' }} 
              onChange={(e) => handleAddPdfs(e.target.files)}
            />
            <UploadCloud className="upload-icon" style={{ width: pagesList.length > 0 ? '40px' : '56px', height: pagesList.length > 0 ? '40px' : '56px' }} />
            <div className="upload-text">
              <h3>{pagesList.length > 0 ? 'Add More PDF Files' : 'Select or Drop PDF Files'}</h3>
              <p>Upload 1 or multiple PDFs to view, drag, remove, rotate and combine pages</p>
            </div>
          </div>

          {isLoadingPages && (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px display: block' }} />
              <div>Rendering page thumbnails...</div>
            </div>
          )}

          {/* Interactive Page Thumbnail Grid with Drag & Drop */}
          {pagesList.length > 0 && (
            <div>
              <div className="results-header">
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    Document Pages ({pagesList.filter(p => p.selected).length} / {pagesList.length} Active)
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    💡 <strong>Drag & Drop</strong> any page card to reorder! Click trash icon to delete pages.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-secondary" onClick={clearAllPages}>
                    Clear All
                  </button>
                  <button className="btn-primary" onClick={exportOrganizedPdf} disabled={isExporting}>
                    {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                    Merge & Download PDF
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {pagesList.map((pageItem, index) => (
                  <div 
                    key={pageItem.id} 
                    className="result-card"
                    draggable
                    onDragStart={(e) => handlePageDragStart(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={() => handlePageDragEnter(index)}
                    onDragEnd={handlePageDragEnd}
                    style={{ 
                      opacity: draggedPageIndex === index ? 0.4 : (pageItem.selected ? 1 : 0.4), 
                      borderColor: pageItem.selected ? 'var(--border-color)' : '#ef4444',
                      cursor: 'grab',
                      transform: draggedPageIndex === index ? 'scale(0.95)' : 'none',
                      transition: 'transform 0.15s ease, opacity 0.15s ease'
                    }}
                  >
                    <div className="result-img-wrapper" style={{ height: '230px', position: 'relative' }}>
                      <img 
                        src={pageItem.thumbnailUrl} 
                        alt={`Page ${pageItem.pageNumber}`} 
                        className="result-img"
                        style={{ transform: `rotate(${pageItem.rotation}deg)`, transition: 'transform 0.2s ease' }}
                      />

                      {/* Drag Handle Icon Indicator */}
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem'
                      }}>
                        <GripVertical size={14} /> Drag
                      </div>

                      {/* Checkbox */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleSelectPage(pageItem.id); }}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '60px',
                          background: pageItem.selected ? 'var(--accent-primary)' : 'rgba(0,0,0,0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px',
                          cursor: 'pointer'
                        }}
                        title={pageItem.selected ? 'Include in PDF' : 'Excluded from PDF'}
                      >
                        {pageItem.selected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>

                      {/* Delete Page Button */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); removePage(pageItem.id); }}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                        title="Remove page from PDF"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="result-info" style={{ flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: '700' }}>Page {pageItem.pageNumber}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                          {pageItem.fileName}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
                        <button className="btn-secondary" style={{ padding: '4px 8px', flex: 1, justifyContent: 'center' }} onClick={() => movePage(index, -1)} disabled={index === 0}>
                          <ArrowLeft size={14} />
                        </button>
                        <button className="btn-secondary" style={{ padding: '4px 8px', flex: 1, justifyContent: 'center' }} onClick={() => rotatePage(pageItem.id)}>
                          <RotateCw size={14} />
                        </button>
                        <button className="btn-secondary" style={{ padding: '4px 8px', flex: 1, justifyContent: 'center' }} onClick={() => movePage(index, 1)} disabled={index === pagesList.length - 1}>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* QUICK RANGE SPLIT TAB */}
      {activeTab === 'range_split' && (
        <div style={{ display: 'grid', gridTemplateColumns: splitFile ? '1fr 340px' : '1fr', gap: '32px' }}>
          <div>
            {!splitFile ? (
              <div className="upload-zone" onClick={() => document.getElementById('split-upload').click()}>
                <input 
                  type="file" 
                  id="split-upload" 
                  accept=".pdf" 
                  style={{ display: 'none' }} 
                  onChange={(e) => e.target.files[0] && handleSplitFile(e.target.files[0])}
                />
                <UploadCloud className="upload-icon" />
                <div className="upload-text">
                  <h3>Select PDF File to Split</h3>
                  <p>Extract specific pages or page ranges into a new PDF</p>
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <FileText size={32} style={{ color: '#ef4444' }} />
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{splitFile.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Pages: <strong>{numPages}</strong></p>
                    </div>
                  </div>
                  <button className="btn-secondary" onClick={() => { setSplitFile(null); setSplitPdfDoc(null); }}>
                    Choose Another
                  </button>
                </div>
              </div>
            )}
          </div>

          {splitFile && (
            <div className="sidebar-settings">
              <div className="settings-panel">
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Split Options</h3>
                
                <div className="settings-group">
                  <h4>Pages to Extract</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Example: <code>1-3, 5, 7-10</code>
                  </p>
                  <input 
                    type="text" 
                    value={selectedPages}
                    onChange={(e) => setSelectedPages(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <button className="btn-primary" onClick={processSplit} disabled={isSplitting || !selectedPages}>
                  {isSplitting ? <RefreshCw size={18} className="animate-spin" /> : <Scissors size={18} />}
                  Extract & Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfMergeSplitTool;
