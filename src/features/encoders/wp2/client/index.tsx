import {default as webEncode} from 'features/encoders/wp2/worker/wp2Encode';
import type { EncodeOptions } from '../../../../../codecs/wp2/enc/wp2_enc';

export const wp2WebEncode = (
  imageData: ImageData,
  options: EncodeOptions,
) => webEncode(imageData, options);
