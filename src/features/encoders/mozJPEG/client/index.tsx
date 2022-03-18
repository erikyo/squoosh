import {default as encodeWeb} from '../worker/mozjpegEncode';
import {EncodeOptions} from "../../../../../codecs/mozjpeg/enc/mozjpeg_enc";

export function mozpegWebEncode(
  imageData: ImageData,
  options: EncodeOptions,
) {
  return encodeWeb(imageData, options);
}
