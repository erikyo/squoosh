
import { ImagePool } from '../../src';
import os from 'os';
const imagePool = new ImagePool(os.cpus().length);

import fs from 'fs/promises';
const file = await fs.readFile('./test.jpg');
const image = imagePool.ingestImage(file);

const preprocessOptions = {
  //When both width and height are specified, the image resized to specified size.
  resize: {
    width: 100,
    height: 100,
  }
};
await image.preprocess(preprocessOptions);

const encodeOptions = {
  mozjpeg: {}, //an empty object means 'use default settings'
  jxl: {quality: 90,},
};
const result = await image.encode(encodeOptions);

console.log(result);

const newImagePath = '/encoded.'; //extension is added automatically

for (const encodedImage of Object.values(image.encodedWith)) {
  fs.writeFile(newImagePath + "-" + encodedImage.extension, encodedImage.binary);
}

await imagePool.close();
