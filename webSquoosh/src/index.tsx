import { PreprocessorState, ProcessorState, EncoderState } from "../../src/client/lazy-app/feature-meta/web";

import {Compress} from "../../src/client/lazy-app/Compress/web";

import "style.scss";

interface Setting {
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

  encodeLog(filesize : File, data : Setting | undefined = undefined) {
    console.log('Squoosh Browser');
    console.log(new Date() + `Filename: ${filesize.size}  (size ${filesize.size})`);
    if (data) console.log('data', data);
  },

  // Encode to Avif
  encoder: async function (data: { file: File, args: Setting }) {

    this.encodeLog(data.file, data.args);

    const img = await new Compress( {'file': data.file, onBack: () => true} );

    img.queueUpdateImage({immediate: true});

    // compress.process().then(() => console.log(data.file));

    // this.encodeLog(compressFile);

    return img;
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


  async changeCallback(uploadedFile: Event) {

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


  async readImage( image : File, args : Setting = options) :  Promise<ImageData> {
    const respSquoosh = await squooshBrowser.encoder({file: image, args: args} );
    const reader = new FileReader()
    // await reader.readAsDataURL(respSquoosh)

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
