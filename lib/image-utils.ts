export function compressImage(dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
  
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
  
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(dataUrl); return; }
  
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
  
  export function createThumbnail(dataUrl: string): Promise<string> {
    return compressImage(dataUrl, 200, 0.5);
  }