import { EncodeOptions, defaultOptions } from '../shared/meta';
import {default as encodeWeb} from '../worker/avifEncode';

export const avifWebEncode = (
  imageData: ImageData,
  options: EncodeOptions,
) => encodeWeb(imageData, options);


interface State {
  options: EncodeOptions;
  lossless: boolean;
  quality: number;
  showAdvanced: boolean;
  separateAlpha: boolean;
  alphaQuality: number;
  chromaDeltaQ: boolean;
  subsample: number;
  tileRows: number;
  tileCols: number;
  effort: number;
  sharpness: number;
  denoiseLevel: number;
  aqMode: number;
  tune: 'auto';
}

