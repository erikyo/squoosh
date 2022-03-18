import { canvasEncode } from 'client/lazy-app/util/canvas';
import { mimeType, EncodeOptions } from '../shared/meta';

export const jpegWebEncode = (
  imageData: ImageData,
  options: EncodeOptions,
) => canvasEncode(imageData, mimeType, options.quality);
