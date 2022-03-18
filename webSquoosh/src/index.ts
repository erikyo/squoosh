import {default as Compress} from "client/lazy-app/Compress/web";
import { PreprocessorState, ProcessorState, EncoderState } from "client/lazy-app/feature-meta/web";

import "./style.scss";

const options: opt = {
  encoderState: {
    type: "avif",
    options: {
      cqLevel: 30,
      cqAlphaLevel: -1,
      denoiseLevel: 0,
      tileColsLog2: 0,
      tileRowsLog2: 0,
      speed: 7,
      subsample: 2,
      chromaDeltaQ: false,
      sharpness: 0,
      tune: 1,
    }
  },
  preprocessorState: {
    rotate: {
      rotate: 0
    }
  },
  processorState: {
    quantize: { enabled: false, ...{
        zx: 0,
        maxNumColors: 256,
        dither: 1.0,
      } },
    resize: { enabled: false, ...{
        // Width and height will always default to the image size.
        // This is set elsewhere.
        width: 1,
        height: 1,
        // This will be set to 'vector' if the input is SVG.
        method: 'lanczos3',
        fitMethod: 'stretch',
        premultiply: true,
        linearRGB: true,
      } },
  }
}

interface opt {
  preprocessorState: PreprocessorState;
  processorState: ProcessorState;
  encoderState: EncoderState;
}

interface ImageData {
  imageSrc: string | ArrayBuffer | null;
  name: string;
}

// Create Squoosh Browser object into window
const squooshBrowser = {

  encodeLog(filesize : File, data : opt | undefined = undefined) {
    console.log('Squoosh Browser');
    console.log(new Date() + `Filename: ${filesize.size}  (size ${filesize.size})`);
    if (data) console.log('data', data);
  },

  // Encode to Avif
  async encoder(image: File, args: opt = options) {

    this.encodeLog(image, args);

    const compress = new Compress(image, args);

    const compressFile : File = await compress.process();

    return compressFile;
  },


  // utility to download base64 data
  downloadBase64Data(fileName : string, base64Data : string) {
    const downloadLink = document.createElement("a");
    downloadLink.href = base64Data;
    downloadLink.download = fileName;
  },

  setImage(src : string, target : string) {
    const img = new Image()
    img.src = src
    const targetElement = document.getElementById(target)
      targetElement?.appendChild(img)  // reader.result为获取结果
  },


  changeCallback: async function (uploadedFile: Event) {

    const images = uploadedFile.target as HTMLInputElement;

    // return if something went wrong
    if (!images.files?.length) {
      return;
    }

     [...images.files].forEach((image) => {
       squooshBrowser.readImage(image)
         .then((res) => {

           // load the original image
           squooshBrowser.loadOriginal(image);

           // process and show the encoded image
           if (typeof res.imageSrc == "string") {
             squooshBrowser.setImage(res.imageSrc, "encoded")
             console.log(res);
           }
         })
    })
  },

  async loadOriginal(image: Blob) {
    var originalFile = new FileReader();
    originalFile.onload = function (e) {
      squooshBrowser.setImage(e.target?.result as string, "original")
    }
    originalFile.readAsDataURL(image);
  },


  async readImage( image : File ) {
    const respSquoosh = await squooshBrowser.encoder(image);
    const reader = new FileReader()
    await reader.readAsDataURL(respSquoosh)

    return new Promise<ImageData>(function (resolve) {
      reader.onload = () => {
        resolve({
          imageSrc: reader.result,
          name: ''
        })
      }
    });
  }
};



// input type onChange trigger conversion
const fileinput : HTMLElement | null = document.getElementById('file')

if (fileinput) fileinput.addEventListener('change',(input:Event) => {
  const encodedImage = squooshBrowser.changeCallback(input)
  console.log(encodedImage)
  }
)

export default squooshBrowser;
