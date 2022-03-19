import {default as Compress} from "client/lazy-app/Compress/web";
import {PreprocessorState, ProcessorState, EncoderState, encoderMap, EncoderType, defaultProcessorState, defaultPreprocessorState, EncoderOptions} from "client/lazy-app/feature-meta/web";

import "./style.scss";

// Controls
const selectChangeHandle = ({target}: {target: EventTarget | null | any }) => {
  const selected : EncoderType = <"browserPNG" | "browserJPEG" | "wp2" | "mozJPEG" | "webP" | "browserGIF" | "oxiPNG" | "avif" | "jxl"> target?.value;

  document.getElementById("controlWrapOptions")?.childNodes[0].replaceWith(Object.entries(encoderMap[selected].meta.defaultOptions).map(elem => elem[0] + ": " + elem[1]).join(",\n"))

  options.encoderState.type = selected;
  options.encoderState.options = encoderMap[selected].meta.defaultOptions
};
function buildOptions(type:EncoderType) {
  var select = document.createElement("select");
  select.className = "imageFormats";

  Object.keys(encoderMap).forEach((type: string, i) => {
    var el = document.createElement("option");
    el.textContent = el.value = type;
    select.appendChild(el);
  })
  select.onchange = selectChangeHandle;
  document.getElementById("controlWrap")?.append(select);
  document.getElementById("controlWrapOptions")?.append(
    Object.entries(encoderMap[type].meta.defaultOptions).map(elem => elem[0] + ": " + elem[1]).join(",\n")
  )
}
buildOptions("avif");


const options : opt = {
  "encoderState": {
    type: 'avif',
    options: encoderMap.avif.meta.defaultOptions,
  },
  "processorState": defaultProcessorState,
  "preprocessorState": defaultPreprocessorState
}

interface opt {
  encoderState: EncoderState;
  preprocessorState: PreprocessorState;
  processorState: ProcessorState;
}

interface ImageData {
  imageSrc: string | ArrayBuffer | null;
  name: string;
}

// Create Squoosh Browser object into window
const squooshBrowser = {

  encodeLog(filesize : File, data : opt | undefined = undefined) {
    console.log('Squoosh Browser');
    console.log(new Date() + `Filename: ${filesize.name}  (size ${filesize.size})`);
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
          name: ImageData.name
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
