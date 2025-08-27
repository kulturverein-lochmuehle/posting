import type { ApplicableFilters } from './filter.utils.js';
import { renderImage } from './render.utils.js';

/**
 * Previews an image file on a canvas.
 * @param file The image file to preview.
 * @param canvas The canvas element to draw the image on.
 * @param filters The filters to apply to the image.
 * @param abortCtrl The abort controller to signal when to stop rendering.
 */
export function previewImage(
  file: File,
  canvas: HTMLCanvasElement,
  filters: ApplicableFilters,
  abortCtrl: AbortController,
): void {
  // get the canvas context
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // draw image from file
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderImage(img, canvas, filters, abortCtrl);
  };
  // URL.revokeObjectURL(img.src);
  img.src = URL.createObjectURL(file);

  // revoke object URL on abort
  abortCtrl.signal.addEventListener('abort', () => {
    URL.revokeObjectURL(img.src);
  });
}

/**
 * Previews a video file on a canvas.
 * This uses a simpler solution using requestVideoFrameCallback,
 * but one could go much deeper into it using a video decoder.
 * @see https://stackoverflow.com/a/32708998/1146207
 * @param file The video file to preview.
 * @param canvas The canvas element to draw the video on.
 * @param filters The filters to apply to the video.
 * @param abortCtrl The abort controller to signal when to stop rendering.
 */
export function previewVideo(
  file: File,
  canvas: HTMLCanvasElement,
  filters: ApplicableFilters,
  abortCtrl: AbortController,
): void {
  // get the canvas context
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // clear the image first
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // recursive canvas update handler
  const updateCanvas = async () => {
    // do not go on, once aborted
    if (abortCtrl.signal.aborted) return;
    // read the current frame and draw it
    const bitmap = await createImageBitmap(video);
    renderImage(bitmap, canvas, filters, abortCtrl);
    // request the next frame
    video.requestVideoFrameCallback(updateCanvas);
  };

  // initialize canvas when video metadata is loaded
  const initCanvas = () => {
    video.requestVideoFrameCallback(updateCanvas);
  };

  // draw frames from video continuously
  const video = document.createElement('video');
  video.addEventListener('loadedmetadata', initCanvas);
  // URL.revokeObjectURL(video.src);
  video.src = URL.createObjectURL(file);

  // play the muted video in a loop
  video.muted = true;
  video.loop = true;
  video.play();

  // revoke latest object URL on abort
  abortCtrl.signal.addEventListener('abort', () => {
    URL.revokeObjectURL(video.src);
  });
}

/**
 * Previews a file on a canvas.
 * @param file The file to preview.
 * @param canvas The canvas element to draw the preview on.
 */
export function previewFile(
  file: File,
  canvas: HTMLCanvasElement,
  filters: ApplicableFilters,
): AbortController {
  const abortCtrl = new AbortController();

  switch (file.type) {
    case 'image/png':
    case 'image/jpeg':
    case 'image/gif':
      previewImage(file, canvas, filters, abortCtrl);
      break;

    case 'video/mp4':
    case 'video/webm':
    case 'video/quicktime':
      previewVideo(file, canvas, filters, abortCtrl);
      break;

    default:
      // TODO: show some unknown file hint
      break;
  }

  return abortCtrl;
}
