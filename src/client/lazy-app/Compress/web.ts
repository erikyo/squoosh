import {
  blobToImg,
  blobToText,
  builtinDecodeWeb,
  sniffMimeType,
  canDecodeImageType,
  ImageMimeTypes,
} from '../util';

import {
  PreprocessorState,
  ProcessorState,
  EncoderState,
  encoderMap,
  defaultPreprocessorState,
  defaultProcessorState,
  EncoderType,
  EncoderOptions,
} from '../feature-meta/web';

import ResultCache from './result-cache';

import { cleanMerge, cleanSet } from '../util/clean-modify';

import workerBridge from "../worker-bridge";


import { drawableToImageData } from '../util/canvas';

import { default as browserAVIFDecode} from 'features/decoders/avif/worker/avifDecode';
import { default as browserJXRDecode} from 'features/decoders/jxl/worker/jxlDecode';
import { default as browserWEBPDecode} from 'features/decoders/webp/worker/webpDecode';
import { default as browserWP2Decode} from 'features/decoders/wp2/worker/wp2Decode';
import { default as browserMOZJPEGDecode } from 'features/decoders/mozjpeg/worker/mozjpegDecode';

import { avifWebEncode } from 'features/encoders/avif/client';
import { gifWebEncode} from 'features/encoders/browserGIF/client';
import { jpegWebEncode } from 'features/encoders/browserJPEG/client';
import { pngWebEncode } from 'features/encoders/browserPNG/client';
import { jxlWebEncode } from 'features/encoders/jxl/client';
import { mozpegWebEncode} from 'features/encoders/mozJPEG/client';
import { oxipngWebEncode } from 'features/encoders/oxiPNG/client';
import { webpWebEncode } from 'features/encoders/webP/client';
import { wp2WebEncode } from 'features/encoders/wp2/client';

import { webResize as resize } from '../../../features/processors/resize/client';
import { default as quantize } from 'features/processors/quantize/worker/quantize';
import { default as rotate } from "features/preprocessors/rotate/worker/rotate";

export interface SourceImage {
  file: File;
  decoded: ImageData;
  preprocessed: ImageData;
  vectorImage?: HTMLImageElement;
}

interface Setting {
  preprocessorState: PreprocessorState;
  processorState: ProcessorState;
  encoderState: EncoderState;
}

interface SideSettings {
  processorState: ProcessorState;
  encoderState?: EncoderState;
}

interface Side {
  processed?: ImageData;
  file?: File;
  downloadUrl?: string;
  data?: ImageData;
  latestSettings: SideSettings;
  encodedSettings?: SideSettings;
  loading: boolean;
}

interface Props {
  file: File;
  onBack: () => void;
}

interface State {
  source?: SourceImage;
  sides: [Side, Side];
  /** Source image load */
  loading: boolean;
  preprocessorState: PreprocessorState;
  encodedPreprocessorState?: PreprocessorState;
}

interface MainJob {
  file: File;
  preprocessorState: PreprocessorState;
}

interface SideJob {
  processorState: ProcessorState;
  encoderState?: EncoderState;
}

async function decodeImage(
  blob: Blob,
): Promise<ImageData> {
  const mimeType = await sniffMimeType(blob);
  const canDecode = await canDecodeImageType(mimeType);
  if (!canDecode) {
    switch (mimeType) {
      // TODO: fix Uncaught (in promise) ReferenceError: process is not defined
      // case 'image/jpeg':
      //   return await browserMOZJPEGDecode(blob);
      case 'image/avif':
        return await browserAVIFDecode(blob);
      case 'image/webp':
        return await browserJXRDecode(blob);
      case 'image/jxl':
        return await browserWEBPDecode(blob);
      case 'image/webp2':
        return await browserWP2Decode(blob);
      default:
        break;
    }
  }
  // Otherwise fall through and try built-in decoding for a laugh.
  return await builtinDecodeWeb(blob, mimeType);
}

async function preprocessImage(
  data: ImageData,
  preprocessorState: PreprocessorState,
): Promise<ImageData> {
  let processedData = data;

  if (preprocessorState.rotate.rotate !== 0) {
    processedData = await rotate(
      processedData,
      preprocessorState.rotate,
    );
  }

  return processedData;
}

async function processImage(
  source: SourceImage,
  processorState: ProcessorState,
): Promise<ImageData> {
  let result = source.preprocessed;
  if (processorState.resize.enabled) {
    result = await resize(source, processorState.resize);
  }
  if (processorState.quantize.enabled) {
    result = await quantize(
      result,
      processorState.quantize,
    );
  }
  return result;
}

async function compressImage(
  image: ImageData,
  encodeData: EncoderState,
  sourceFilename: string,
): Promise<File> {
  const encoder = encoderMap[encodeData.type];
  let compressedData: Blob | ArrayBuffer;

  switch (encodeData.type) {
    case "avif":
      compressedData = await avifWebEncode(image, encodeData.options)
      break;
    case "browserGIF":
      compressedData = await gifWebEncode(image, encodeData.options)
      break;
    case "browserJPEG":
      compressedData = await jpegWebEncode(image, encodeData.options)
      break;
    case "browserPNG":
      compressedData = await pngWebEncode(image, encodeData.options)
      break;
    case "jxl":
      compressedData = await jxlWebEncode(image, encodeData.options)
      break;
    case "mozJPEG":
      compressedData = await mozpegWebEncode(image, encodeData.options)
      break;
    case "oxiPNG":
      compressedData = await oxipngWebEncode(image, encodeData.options)
      break;
    case "webP":
      compressedData = await webpWebEncode(image, encodeData.options)
      break;
    case "wp2":
      compressedData = await wp2WebEncode(image, encodeData.options)
      break;
    default:
      compressedData = new Blob();
      break;
  }

  // This type ensures the image mimetype is consistent with our mimetype sniffer
  const type: ImageMimeTypes = encoder.meta.mimeType;

  return new File(
    [compressedData],
    sourceFilename.replace(/.[^.]*$/, `.${encoder.meta.extension}`),
    { type },
  );
}

function stateForNewSourceData(state: State): State {
  let newState = { ...state };

  for (const i of [0, 1]) {
    // Ditch previous encodings
    const downloadUrl = state.sides[i].downloadUrl;
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);

    newState = cleanMerge(state, `sides.${i}`, {
      preprocessed: undefined,
      file: undefined,
      downloadUrl: undefined,
      data: undefined,
      encodedSettings: undefined,
    });
  }

  return newState;
}

async function processSvg(
  blob: Blob,
): Promise<HTMLImageElement> {
  // Firefox throws if you try to draw an SVG to canvas that doesn't have width/height.
  // In Chrome it loads, but drawImage behaves weirdly.
  // This function sets width/height if it isn't already set.
  const parser = new DOMParser();
  const text = await blobToText(blob);
  const document = parser.parseFromString(text, 'image/svg+xml');
  const svg = document.documentElement!;

  if (svg.hasAttribute('width') && svg.hasAttribute('height')) {
    return blobToImg(blob);
  }

  const viewBox = svg.getAttribute('viewBox');
  if (viewBox === null) throw Error('SVG must have width/height or viewBox');

  const viewboxParts = viewBox.split(/\s+/);
  svg.setAttribute('width', viewboxParts[2]);
  svg.setAttribute('height', viewboxParts[3]);

  const serializer = new XMLSerializer();
  const newSource = serializer.serializeToString(document);
  return blobToImg(new Blob([newSource], { type: 'image/svg+xml' }));
}


export default class Compress {

  private file: File;

  private setting: Setting = {
    "encoderState": {
      type: 'webP',
      options: encoderMap.webP.meta.defaultOptions,
    },
    "processorState": defaultProcessorState,
    "preprocessorState": defaultPreprocessorState
  };

  constructor(file: File, setting?: Setting) {
    this.file = file;
    if (setting) {
      this.setting = setting;
    }
  }

  async process(): Promise<File> {
    let decoded: ImageData;
    let vectorImage: HTMLImageElement | undefined;

    if (this.file.type.startsWith('image/svg+xml')) {
      vectorImage = await processSvg(this.file);
      decoded = drawableToImageData(vectorImage);
    } else {
      decoded = await decodeImage(this.file);
    }

    const preprocessed = await preprocessImage(decoded, this.setting.preprocessorState);

    const source: SourceImage = { "file": this.file, decoded, vectorImage, preprocessed };
    const processed = await processImage(source, this.setting.processorState);

    return await compressImage(
      processed,
      this.setting.encoderState,
      this.file.name,
    );
  }
}
