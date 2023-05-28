import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

import fetch from "node-fetch";
import { createOCRClient } from "tesseract-wasm/node";
import sharp from "sharp";

async function loadImage(buffer) {
    const image = await sharp(buffer).ensureAlpha();
    const { width, height } = await image.metadata();
    return {
        data: await image.raw().toBuffer(),
        width,
        height,
    };
}

async function loadModel() {
    const modelPath = "eng.traineddata";
    if (!existsSync(modelPath)) {
        console.log("Downloading text recognition model...");
        const modelURL = "https://github.com/tesseract-ocr/tessdata_best/raw/main/eng.traineddata";
        // const modelURL = "https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata";
        
        const response = await fetch(modelURL);
        if (!response.ok) {
            process.stderr.write(`Failed to download model from ${modelURL}`);
            process.exit(1);
        }

        const data = await response.arrayBuffer();
        await writeFile(modelPath, new Uint8Array(data));
    }
    return readFile("eng.traineddata");
}

export async function runOCR(imageData) {
    const client = createOCRClient();

    // Load model concurrently with reading image.
    const modelLoaded = loadModel().then((model) => client.loadModel(model));

    const image = await loadImage(imageData);

    await modelLoaded;
    await client.loadImage(image);
    const text = await client.getText();

    // Shut down the OCR worker thread.
    client.destroy();

    return text;
};
