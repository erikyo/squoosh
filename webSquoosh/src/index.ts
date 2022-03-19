import {default as Compress} from "client/lazy-app/Compress/web";
import {defaultPreprocessorState, defaultProcessorState, encoderMap, EncoderState, EncoderType, PreprocessorState, ProcessorState} from "client/lazy-app/feature-meta/web";

import "./style.scss";
import {compress} from "client/lazy-app/Compress/style.css";

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
// later will be rearranged, cleaned up, commented etc... now I am in the creative phase :)
export const api = {

  encodeLog(filesize : File, data : opt | undefined = undefined) {
    console.log('Squoosh Browser');
    console.log(new Date() + `Filename: ${filesize.name}  (size ${filesize.size})`);
    // if (data) console.log('data', data);
  },

  // Encode to Avif
  async encoder(image: File, args: opt = options) : Promise<File> {

    this.encodeLog(image, args);

    const compress = new Compress(image, args);

    return await compress.process();
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

       api.readImage(image)
         .then((res) => {
           // load the original image
           api.loadOriginal(image);
           // process and show the encoded image
           if (typeof res.imageSrc == "string") {
             api.setImage(res.imageSrc, "encoded")
             console.log(res);
           }
         })
    })
  },

  async loadOriginal(image: Blob) {
    var originalFile = new FileReader();
    originalFile.onload = function (e) {
      api.setImage(e.target?.result as string, "original")
    }
    originalFile.readAsDataURL(image);
  },


  async readImage( image : File ) {
    const respSquoosh = await api.encoder(image);
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
  },

  encodeFromUrl(url : string, args: opt = options) {
    console.log(url)

    let data : any = {};

    const res = fetch(url)
      .then((response) => {
        console.log("please wait!");
        return response.blob();
      }).then((blob) => {
        data.original = {
          size: blob.size,
          type: blob.type
        }
        return new File([blob], 'imageBLOB', {type: blob.type});
      }).then((file) => {
        const originalFile = new FileReader();
        originalFile.onload = function (e) {
          api.setImage(e.target?.result as string, "original")
        }
        originalFile.readAsDataURL(file);
        return new Compress(file, args);
      }).then((fileCompressed) => {
        return fileCompressed.process()
      }).then((image) => {
        data.compressed = {
          size: image.size,
          type: image.type
        }
        return  api.readImage(image);
      }).then(blob => {
        api.setImage(blob.imageSrc as string, "encoded")

        data.optimized = data.original.size - data.compressed.size;
        data.optimizedRatio = `saved ${Math.round(100 - ((data.compressed.size / data.original.size) * 100))}% (saved ${Math.round(data.optimized / 1024 )}kb)` ;
        console.log("compress results", data);
      })

  }
};


// input type onChange trigger conversion
const fileinput : HTMLElement | null = document.getElementById('file')

if (fileinput) fileinput.addEventListener('change',(input:Event) => {
  const encodedImage = api.changeCallback(input)
  console.log(encodedImage)
  }
)


