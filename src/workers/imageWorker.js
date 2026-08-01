/**
 * imageWorker.js
 * Web Worker for CPU-intensive image compression and resizing.
 * Uses OffscreenCanvas to avoid blocking the main UI thread.
 */

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'COMPRESS_IMAGE') {
    await handleCompressImage(payload);
  } else if (type === 'RESIZE_PHOTO') {
    await handleResizePhoto(payload);
  }
};

async function handleCompressImage({ imageBitmap, originalSize, mode, targetSizeKb, qualitySlider }) {
  try {
    const targetMaxBytes = targetSizeKb * 1024;
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');

    let width = imageBitmap.width;
    let height = imageBitmap.height;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    let blob;
    let sizeBytes;

    if (mode === 'target') {
      let quality = 0.92;
      let scale = 1.0;

      // Initial render
      blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
      sizeBytes = blob.size;

      // Upscale if image is tiny
      while (sizeBytes < targetMaxBytes * 0.85 && scale < 3.0) {
        scale = Math.min(3.0, scale + 0.2);
        const newW = Math.round(imageBitmap.width * scale);
        const newH = Math.round(imageBitmap.height * scale);
        canvas.width = newW;
        canvas.height = newH;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newW, newH);
        ctx.drawImage(imageBitmap, 0, 0, newW, newH);
        blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
        sizeBytes = blob.size;
      }

      // Compress down to target
      while (sizeBytes > targetMaxBytes && quality >= 0.1) {
        quality -= 0.08;
        if (quality < 0.4 && scale > 0.4) {
          scale -= 0.15;
          quality = 0.80;
          const newW = Math.round(imageBitmap.width * scale);
          const newH = Math.round(imageBitmap.height * scale);
          canvas.width = newW;
          canvas.height = newH;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, newW, newH);
          ctx.drawImage(imageBitmap, 0, 0, newW, newH);
        }
        blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
        sizeBytes = blob.size;
      }
    } else {
      // Manual quality slider
      blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: qualitySlider / 100 });
      sizeBytes = blob.size;
    }

    const savingsPercent = Math.max(0, Math.round(((originalSize - sizeBytes) / originalSize) * 100));
    const arrayBuffer = await blob.arrayBuffer();

    self.postMessage({
      type: 'COMPRESS_DONE',
      payload: {
        buffer: arrayBuffer,
        sizeKb: (sizeBytes / 1024).toFixed(0) + ' KB',
        savings: savingsPercent,
      }
    }, [arrayBuffer]);

  } catch (err) {
    self.postMessage({ type: 'ERROR', payload: { message: err.message } });
  }
}

async function handleResizePhoto({ imageBitmap, targetW, targetH, maxKb }) {
  try {
    const canvas = new OffscreenCanvas(targetW, targetH);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(imageBitmap, 0, 0, targetW, targetH);

    const targetMaxBytes = maxKb * 1024;
    let quality = 0.95;
    let blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });

    while (blob.size > targetMaxBytes && quality >= 0.2) {
      quality -= 0.05;
      blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    }

    const sizeBytes = blob.size;
    const arrayBuffer = await blob.arrayBuffer();

    self.postMessage({
      type: 'RESIZE_DONE',
      payload: {
        buffer: arrayBuffer,
        width: targetW,
        height: targetH,
        sizeKb: (sizeBytes / 1024).toFixed(0) + ' KB',
      }
    }, [arrayBuffer]);

  } catch (err) {
    self.postMessage({ type: 'ERROR', payload: { message: err.message } });
  }
}
