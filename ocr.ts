import { OCRClient } from 'npm:tesseract-wasm';
import sharp from "npm:sharp";

async function runOCR() {
    // Fetch document image and decode it into an ImageBitmap.
    
    const imageBlob = await Deno.readFile('screenshot.png');

    // decode it into an ImageBitmap.
    const image = await sharp(imageBlob).toBuffer();
    // const image = await createImageBitmap(image);

    // Initialize the OCR engine. This will start a Web Worker to do the
    // work in the background.
    const ocr = new OCRClient();

    try {
        // Load the appropriate OCR training data for the image(s) we want to
        // process.
        await ocr.loadModel('eng.traineddata');

        await ocr.loadImage(image);

        // Perform text recognition and return text in reading order.
        const text = await ocr.getText();

        console.log('OCR text: ', text);
    } finally {
        // Once all OCR-ing has been done, shut down the Web Worker and free up
        // resources.
        ocr.destroy();
    }
}

runOCR();
