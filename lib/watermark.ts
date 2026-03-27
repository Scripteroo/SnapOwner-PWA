let logoCache: HTMLImageElement | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function addWatermark(photoUrl: string): Promise<string> {
  try {
    const photo = await loadImage(photoUrl);
    if (!logoCache) {
      try { logoCache = await loadImage("/logo.png"); } catch {}
    }

    const canvas = document.createElement("canvas");
    canvas.width = photo.naturalWidth;
    canvas.height = photo.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return photoUrl;

    // Draw photo
    ctx.drawImage(photo, 0, 0);

    // Dark gradient bar at bottom
    const barHeight = 40;
    const barY = canvas.height - barHeight;
    const grad = ctx.createLinearGradient(0, barY - 10, 0, canvas.height);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.3, "rgba(0,0,0,0.6)");
    grad.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, barY - 10, canvas.width, barHeight + 10);

    const centerY = barY + barHeight / 2;

    // Logo on left
    if (logoCache) {
      ctx.drawImage(logoCache, 12, centerY - 12, 24, 24);
    }

    // "snapowner.com" text
    ctx.font = "bold 14px -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.textBaseline = "middle";
    ctx.fillText("snapowner.com", logoCache ? 42 : 12, centerY);

    // Tagline on right
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.textAlign = "right";
    ctx.fillText("Snap any house. See the owner.", canvas.width - 12, centerY);

    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return photoUrl;
  }
}
