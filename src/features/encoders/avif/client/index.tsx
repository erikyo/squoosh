import { EncodeOptions, defaultOptions } from '../shared/meta';
import {default as encodeWeb} from '../worker/avifEncode';

export const avifWebEncode = (
  imageData: ImageData,
  options: EncodeOptions,
) => encodeWeb(imageData, options);
