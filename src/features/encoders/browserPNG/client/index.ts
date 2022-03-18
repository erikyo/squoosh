import { canvasEncode } from 'client/lazy-app/util/canvas';
import WorkerBridge from 'client/lazy-app/worker-bridge';
import { EncodeOptions, mimeType } from '../shared/meta';

export const pngWebEncode = (
  imageData: ImageData,
  options: EncodeOptions,
) => canvasEncode(imageData, mimeType);

export const encode = (
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
) => canvasEncode(imageData, mimeType);
