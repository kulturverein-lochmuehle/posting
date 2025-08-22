import type { ApplicableFilters } from './filter.utils.js';
import { applyFilters } from './filter.utils.js';

/**
 * Draws an image on a canvas, scaling it to fit while maintaining aspect ratio.
 * @param image The image to draw, can be an ImageBitmap or HTMLImageElement.
 * @param canvas The canvas element to draw on.
 */
export function drawScaledImage(
  image: ImageBitmap | HTMLImageElement,
  canvas: HTMLCanvasElement,
  filters: ApplicableFilters,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  applyFilters(canvas, filters);

  const hRatio = canvas.width / image.width;
  const vRatio = canvas.height / image.height;
  const ratio = Math.max(hRatio, vRatio);

  const centerShiftX = (canvas.width - image.width * ratio) / 2;
  const centerShiftY = (canvas.height - image.height * ratio) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    image,
    0,
    0,
    image.width,
    image.height,
    centerShiftX,
    centerShiftY,
    image.width * ratio,
    image.height * ratio,
  );
}
