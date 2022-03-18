import {default as webEncode} from '../worker/webpEncode';
import { EncodeOptions } from '../shared/meta';

export const webpWebEncode = (
  imageData: ImageData,
  options: EncodeOptions,
) => webEncode(imageData, options);
