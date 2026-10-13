const PRINT_IMAGE_MAX_DIM = 512;
const PRINT_IMAGE_JPEG_QUALITY = 0.85;

const installPrintImageDownscale = (img, maxDim = PRINT_IMAGE_MAX_DIM) => {
  if (!img) return () => {};
  let cachedSrc = null;
  let cachedDataUrl = null;
  let swappedSrc = null;

  const generate = () => {
    cachedSrc = null;
    cachedDataUrl = null;
    try {
      if (img.classList.contains("hidden")) return;
      const src = img.getAttribute("src");
      if (!src) return;
      if (!img.complete || !img.naturalWidth || !img.naturalHeight) return;
      if (img.naturalWidth <= maxDim && img.naturalHeight <= maxDim) return;
      const scale = maxDim / Math.max(img.naturalWidth, img.naturalHeight);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", PRINT_IMAGE_JPEG_QUALITY);
      if (!dataUrl || dataUrl === "data:,") return;
      cachedSrc = src;
      cachedDataUrl = dataUrl;
    } catch {
      // Generation failure: no cache, original prints unmodified.
    }
  };

  const onBeforePrint = () => {
    if (!cachedDataUrl) return;
    if (img.getAttribute("src") !== cachedSrc) return;
    swappedSrc = cachedSrc;
    img.setAttribute("src", cachedDataUrl);
  };

  const onAfterPrint = () => {
    if (swappedSrc == null) return;
    if (img.getAttribute("src") === cachedDataUrl) {
      img.setAttribute("src", swappedSrc);
    }
    swappedSrc = null;
  };

  img.addEventListener("load", generate);
  window.addEventListener("beforeprint", onBeforePrint);
  window.addEventListener("afterprint", onAfterPrint);
  generate();

  return () => {
    img.removeEventListener("load", generate);
    window.removeEventListener("beforeprint", onBeforePrint);
    window.removeEventListener("afterprint", onAfterPrint);
  };
};

export { installPrintImageDownscale };
