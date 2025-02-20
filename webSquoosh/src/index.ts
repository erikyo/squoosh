import {default as Compress} from "client/lazy-app/Compress/web";
import {defaultPreprocessorState, defaultProcessorState, encoderMap, EncoderState, EncoderType, PreprocessorState, ProcessorState} from "client/lazy-app/feature-meta/web";
import {workerResizeMethods} from "features/processors/resize/shared/meta";

import "./style.scss";

// https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
function formatBytes(bytes : number, decimals :number = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 256;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Squoosh Browser API
// later will be rearranged, cleaned up, commented etc... now I am in the creative phase :)
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

export const api = {

  encodeLog(filesize : File, data : opt ) {
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
    const targetElement = document.querySelector(target)
      targetElement?.replaceWith(img)  // reader.result为获取结果
  },


  changeCallback: async function (uploadedFile: Event) {

    const images = uploadedFile.target as HTMLInputElement;

    // return if something went wrong
    if (!images.files?.length) {
      return;
    }

     [...images.files].forEach((image) => {
       progress(fileInputLabel, "Load Image")
       api.readImage(image)
         .then((res) => {
           // load the original image
           api.loadOriginal(image);
           // process and show the encoded image
           api.setImage(res.imageSrc as string, "#encoded img")
           progress(fileInputLabel, "Success!")
           console.log(res);
         })

    })
  },

  async loadOriginal(image: Blob) {
    var originalFile = new FileReader();
    originalFile.onload = function (e) {
      api.setImage(e.target?.result as string, "#original img")
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
    args = {...options, ...args};
    console.log("encode args", {url: url, args: args})

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
          api.setImage(e.target?.result as string, "#original img")
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
        api.setImage(blob.imageSrc as string, "#encoded img")

        data.optimized = data.original.size - data.compressed.size;
        data.optimizedRatio = `before ${formatBytes(data.original.size)} - after ${formatBytes(data.compressed.size)} - (${Math.round(100 - ((data.compressed.size / data.original.size) * 100))}% Squooshed - saves ${formatBytes(data.optimized / 1024 )})` ;
        console.log("compress results", data);
      })

  }
};

// input type onChange trigger conversion
const fileinput : HTMLElement | null | undefined = document.getElementById('file')
const fileInputLabel = fileinput?.nextElementSibling;

fileinput?.addEventListener('change',(input:Event) => {

    console.log(input.target)
    progress(fileInputLabel, "Please Wait")

    api.changeCallback(input)

  }
)


const progress = function (el = fileInputLabel, message = "Choose file") {
  if (el) el.textContent = message;
}


// Controls
const selectChangeHandle = ({target}: {target: EventTarget | null | any }) => {

  const selectedValue : EncoderType = < "browserPNG" | "browserJPEG" | "wp2" | "mozJPEG" | "webP" | "browserGIF" | "oxiPNG" | "avif" | "jxl" > target?.value;

  document.getElementById("controlWrapOptions")?.childNodes[0].replaceWith(
      [
      Object.entries(encoderMap[selectedValue].meta.defaultOptions).map(elem => elem[0] + ": " + elem[1]).join(",\n"),
        Object.entries(options.preprocessorState.rotate).map(elem => elem[0] + ": " + elem[1]).join(",\n"),
        Object.entries(options.processorState.quantize).map(elem => elem[0] + ": " + elem[1]).join(",\n"),
        Object.entries(options.processorState.resize).map(elem => elem[0] + ": " + elem[1]).join(",\n")
      ].join("\n\n")
    )

  options.encoderState.type = selectedValue;
  options.encoderState.options = encoderMap[selectedValue].meta.defaultOptions
};

function buildOptions(type:EncoderType) {

  // file options (like encoder format and options)
  var selectOpt = document.createElement("select");
  selectOpt.className = "imageFormats";

  Object.keys(encoderMap).forEach((type: string, i) => {
    var el = document.createElement("option");
    el.textContent = el.value = type;
    selectOpt.appendChild(el);
  })
  selectOpt.onchange = selectChangeHandle;
  document.getElementById("controlWrap")?.append(selectOpt);

  // print options for info purpose
  document.getElementById("controlWrapOptions")?.append(
    [
      Object.entries(encoderMap[type].meta.defaultOptions).map(elem => elem[0] + ": " + elem[1]).join(",\n"),
      Object.entries(options.encoderState.options).map(elem => elem[0] + ": " + elem[1]).join(",\n"),
      Object.entries(options.preprocessorState.rotate).map(elem => elem[0] + ": " + elem[1]).join(",\n"),
      Object.entries(options.processorState.quantize).map(elem => elem[0] + ": " + elem[1]).join(",\n"),
      Object.entries(options.processorState.resize).map(elem => elem[0] + ": " + elem[1]).join(",\n")
    ].join("\n\n")
  )

  // Rotate : PreProcess image
  var selectProcessRotate = document.createElement("select");
  selectProcessRotate.id = "preprocess";
  const selectProcessRotateLabel = document.createElement("label");
  selectProcessRotateLabel.textContent = "Rotate";

  Object.values([0 , 90 , 180 , 270]).forEach((rotation) => {
    var el = document.createElement("option");
    el.textContent = el.value = rotation.toString();
    selectProcessRotate.appendChild(el);
  })

  document.getElementById("controlWrap")?.append(selectProcessRotate);
  selectProcessRotate.before( selectProcessRotateLabel);

  // Resize : PreProcess image
  const selectPreProcessResize = document.createElement("select");
  selectPreProcessResize.id = "preprocessResize";
  const selectPreProcessResizeLabel = document.createElement("label");
  selectPreProcessResizeLabel.textContent = "Resize";

  Object.values(workerResizeMethods).forEach((type) => {
    var el = document.createElement("option");
    el.textContent = el.value = type;
    selectPreProcessResize.appendChild(el);
  })
  document.getElementById("controlWrap")?.append(selectPreProcessResize);
  selectPreProcessResize.before( selectPreProcessResizeLabel);


  // Size : PreProcessSize image
  const selectPreProcessSize = document.createElement("select");
  selectPreProcessSize.id = "preProcessSize";
  const selectPreProcessSizeLabel = document.createElement("label");
  selectPreProcessSizeLabel.textContent = "Size";

  Object.entries({100:"100x100", 400:"400x400", 1000:"1000x1000", 5000:"5000x5000"}).forEach((type) => {
    var el = document.createElement("option");
    el.textContent = type[1];
    el.value = type[0];
    selectPreProcessSize.appendChild(el);
  })
  document.getElementById("controlWrap")?.append(selectPreProcessSize);
  selectPreProcessSize.before(selectPreProcessSizeLabel);

}
buildOptions("avif");

