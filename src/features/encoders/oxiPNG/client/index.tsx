import {default as encodeWeb} from '../worker/oxipngEncode';
import { EncodeOptions } from '../shared/meta';
import { canvasEncode } from 'client/lazy-app/util/canvas';
import {blobToArrayBuffer} from 'client/lazy-app/util';

export async function oxipngWebEncode(
  imageData: ImageData,
  options: EncodeOptions,
) {
  const pngBlob = await canvasEncode(imageData, 'image/png');
  const pngBuffer = await blobToArrayBuffer(pngBlob);
  return encodeWeb(pngBuffer, options);
}
