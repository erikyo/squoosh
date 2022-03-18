import { EncodeOptions } from '../shared/meta';
import {default as encodeWeb} from '../worker/jxlEncode';

export const jxlWebEncode = (
  imageData: ImageData,
  options: EncodeOptions,
) => encodeWeb(imageData, options);
