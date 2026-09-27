/**
 * Client-side image handling.
 *
 * The original app converted WebP to JPEG on the server with `sharp`; that is
 * not available on Cloudflare Workers, so every frame is normalised to a JPEG
 * data URL in the browser instead. This also caps the long edge and strips
 * EXIF, which keeps the payload small and the photo's location private.
 */

const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_QUALITY = 0.9;

function drawToJpegDataUrl(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxEdge: number,
  quality: number,
): string {
  if (!width || !height) {
    throw new Error("That image has no size.");
  }

  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Grab the current video frame as a JPEG data URL. */
export function videoFrameToDataUrl(
  video: HTMLVideoElement,
  maxEdge = DEFAULT_MAX_EDGE,
  quality = DEFAULT_QUALITY,
): string {
  return drawToJpegDataUrl(
    video,
    video.videoWidth,
    video.videoHeight,
    maxEdge,
    quality,
  );
}

/** Read a user-selected image file as a JPEG data URL. */
export function fileToDataUrl(
  file: File,
  maxEdge = DEFAULT_MAX_EDGE,
  quality = DEFAULT_QUALITY,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    const cleanup = () => URL.revokeObjectURL(url);

    image.onload = () => {
      try {
        const dataUrl = drawToJpegDataUrl(
          image,
          image.naturalWidth,
          image.naturalHeight,
          maxEdge,
          quality,
        );
        cleanup();
        resolve(dataUrl);
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };
    image.onerror = () => {
      cleanup();
      reject(new Error("That file could not be read as an image."));
    };

    image.src = url;
  });
}
