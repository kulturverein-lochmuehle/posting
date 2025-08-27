import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  CanvasSource,
  Input,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  VideoSampleSink,
} from 'mediabunny';

import type { MediaSize } from './file.utils.js';
import { saveFileContents } from './file.utils.js';
import type { ApplicableFilters } from './filter.utils.js';
import { applyFilters } from './filter.utils.js';

/**
 * Represents the dimensions of a video frame
 * to be used for drawing into a canvas.
 */
export type Dimensions = [
  sx: number,
  sy: number,
  sWidth: number,
  sHeight: number,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number,
];

/**
 * Calculates the dimensions for drawing an image onto a canvas.
 * @param frameWidth The width of the image or video frame.
 * @param frameHeight The height of the image or video frame.
 * @param canvas The canvas element to draw on.
 * @returns The calculated dimensions for drawing the frame.
 */
export function calcDimensions(
  frameWidth: number,
  frameHeight: number,
  canvas: HTMLCanvasElement | OffscreenCanvas,
): Dimensions {
  const hRatio = canvas.width / frameWidth;
  const vRatio = canvas.height / frameHeight;
  const ratio = Math.max(hRatio, vRatio);

  const centerShiftX = (canvas.width - frameWidth * ratio) / 2;
  const centerShiftY = (canvas.height - frameHeight * ratio) / 2;

  return [
    0,
    0,
    frameWidth,
    frameHeight,
    centerShiftX,
    centerShiftY,
    frameWidth * ratio,
    frameHeight * ratio,
  ];
}

/**
 * Draws an image on a canvas, scaling it to fit while maintaining aspect ratio.
 * @param image The image to draw, can be an ImageBitmap or HTMLImageElement.
 * @param canvas The canvas element to draw on.
 * @param filters The filters to apply to the image.
 * @param abortCtrl The abort controller to signal when to stop rendering.
 */
export async function renderImage(
  image: ImageBitmap | HTMLImageElement,
  canvas: HTMLCanvasElement | OffscreenCanvas,
  filters: ApplicableFilters,
  abortCtrl: AbortController,
): Promise<string | undefined> {
  if (abortCtrl.signal.aborted) return;

  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  applyFilters(canvas, filters);

  const dimensions = calcDimensions(image.width, image.height, canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, ...dimensions);

  if (canvas instanceof OffscreenCanvas) {
    const blob = await canvas.convertToBlob();
    return URL.createObjectURL(blob);
  } else {
    return canvas.toDataURL('image/png');
  }
}

/**
 * Renders a filtered video.
 * Takes a video file and renders it frame by frame whilst applying given filters.
 * Thus, the conversion feature of the magnificent mediabunny library can not be used,
 * but the individual frames are rendered in a canvas and then stitched together.
 * @see https://github.com/Vanilagy/mediabunny/blob/main/examples/procedural-generation/procedural-generation.ts
 * @see https://mediabunny.dev/guide/reading-media-files#examples
 * @param canvas The canvas element to use as the video source.
 * @param filters The filters to apply to the video.
 * @param abortCtrl The abort controller to signal when to stop rendering.
 * @param onUpdate A callback function to call with the progress of the video creation.
 * @returns A promise that resolves to file buffer.
 */
export async function renderVideo(
  file: File,
  size: MediaSize,
  filters: ApplicableFilters,
  abortCtrl: AbortController,
  onUpdate?: (progress: number) => void,
): Promise<ArrayBuffer | undefined> {
  // prepare input and output
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });
  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });

  // read meta data
  const duration = await input.computeDuration();
  const videoTrack = await input.getPrimaryVideoTrack();
  if (videoTrack === null) return;

  // prepare a canvas for rendering
  const renderCanvas = new OffscreenCanvas(size[1], size[0]);
  const renderCtx = renderCanvas.getContext('2d', { alpha: false });
  if (renderCtx === null) return;
  const canvasSource = new CanvasSource(renderCanvas, {
    codec: 'avc',
    bitrate: QUALITY_HIGH,
  });
  applyFilters(renderCanvas, filters);
  const dimensions = calcDimensions(
    videoTrack.displayWidth,
    videoTrack.displayHeight,
    renderCanvas,
  );

  // prepare the output
  output.addVideoTrack(canvasSource);
  await output.start();

  // Iterate through all frames in a tight loop and render them as fast as possible
  const sink = new VideoSampleSink(videoTrack);
  for await (const sample of sink.samples()) {
    // check for abort
    if (abortCtrl.signal.aborted) return Promise.reject();

    // draw the sample to a canvas
    sample.draw(renderCtx, ...dimensions);

    // Add the current state of the canvas as a frame to the video. Using `await` here is crucial to
    // automatically slow down the rendering loop when the encoder can't keep up.
    await canvasSource.add(sample.timestamp, sample.duration);

    // Feedback status
    onUpdate?.(sample.timestamp / duration);

    // Free the sample
    sample.close();
  }

  // Signal to the output that no more video frames are coming (not necessary, but recommended)
  canvasSource.close();

  // Finalize the file
  await output.finalize();
  onUpdate?.(1);

  // Output the file
  if (output.target.buffer === null) return;
  return output.target.buffer;
}

/**
 * Renders a file on a canvas.
 * @param file The file to render.
 * @param canvas The canvas element to render the file on.
 * @param filters The filters to apply to the file.
 * @returns An abort controller to signal when to stop rendering.
 */
export async function renderFile(
  file: File,
  size: MediaSize,
  filters: ApplicableFilters,
  onUpdate?: (progress: number) => void,
): Promise<AbortController> {
  const suffix = `-${size[1]}x${size[0]}`;
  const abortCtrl = new AbortController();
  let filename: string | undefined;
  let rendered: string | undefined;

  switch (file.type) {
    case 'image/png':
    case 'image/jpeg':
    case 'image/gif': {
      const image = await createImageBitmap(file);
      const canvas = new OffscreenCanvas(size[0], size[1]);
      rendered = await renderImage(image, canvas, filters, abortCtrl);
      filename = file.name.replace(/\.[^/.]+$/, `${suffix}.png`);
      break;
    }

    case 'video/mp4':
    case 'video/webm':
    case 'video/quicktime': {
      const buffer = await renderVideo(file, size, filters, abortCtrl, onUpdate);
      const blob = new Blob([buffer ?? '']);
      rendered = URL.createObjectURL(blob);

      filename = file.name.replace(/\.[^/.]+$/, `${suffix}.mp4`);
      break;
    }

    default:
      // TODO: show some unknown file hint
      break;
  }

  if (rendered !== undefined && filename !== undefined) {
    saveFileContents(rendered, filename);
  }

  return abortCtrl;
}
