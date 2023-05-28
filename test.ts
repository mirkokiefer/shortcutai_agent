import {
    DOMParser,
    Element,
  } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
  
const serverURL = "http://localhost:3000";

async function main() {
    // Launch a new browser instance
    const launchResponse = await fetch(`${serverURL}/launch`, {
        method: "POST",
    });
    const { browser_id } = await launchResponse.json();

    console.info(`Launched browser instance with session ID: ${browser_id}`);

    const contextOpts = {
        browser_id,
        opts: {
            viewport: {
                width: 860,
                height: 860 * 3,
                deviceScaleFactor: 1,
            },
        }
    };
    // Create a new context in the browser instance
    const newContextResponse = await fetch(`${serverURL}/new_context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contextOpts),
    });

    const { context_id } = await newContextResponse.json();

    // Create a new page in the context
    const newPageResponse = await fetch(`${serverURL}/new_page`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context_id }),
    });
    const { page_id } = await newPageResponse.json();

    // Navigate to a URL on the new page
    const searchTerm = 'discotalk ai app';
    const googleSearchURL = `https://www.google.com/search?q=${searchTerm}`;

    await fetch(`${serverURL}/goto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id, url: googleSearchURL }),
    });

    // Get search results
    const linksResponse = await fetch(`${serverURL}/html`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            page_id,
            selector: 'div.g > div > div > div > a',
        }),
    });

    const { result: links } = await linksResponse.json();

        // parse href and titles
    const parsedLinks = links.map((link) => {
        const doc = new DOMParser().parseFromString(link,
            "text/html",
          )!;
          
        const anchor = doc.querySelector("a") as Element;
        const href = anchor.getAttribute("href");
        const title = anchor.textContent;
        return { href, title };
    });

    console.info(`Found ${links.length} links`);
    console.info(parsedLinks);

    // Take a screenshot of the page
    const screenshotResponse = await fetch(`${serverURL}/screenshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id }),
    });
    const { fileName } = await screenshotResponse.json();

    // Retrieve the saved screenshot
    const imageResponse = await fetch(`${serverURL}/screenshots/${fileName}`);

    const diskWritableStream = await Deno.open('screenshot.png', {
        create: true,
        write: true,
    });

    // Run OCR on the page
    const ocrResponse = await fetch(`${serverURL}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id }),
    });

    const ocrBody = await ocrResponse.json();
    console.info('ocr', ocrBody);

    const readableStream = imageResponse.body;
    await readableStream.pipeTo(diskWritableStream.writable);

    // navigate to a new page
    const twitterLink = 'https://twitter.com/nathanbaugh27/status/1648311407098621953';

    await fetch(`${serverURL}/goto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id, url: twitterLink }),
    });

    // wait 10 seconds
    console.info('Waiting 10 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Take a screenshot of the page
    const screenshotResponse2 = await fetch(`${serverURL}/screenshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id }),
    });

    const { fileName: fileName2 } = await screenshotResponse2.json();

    // Retrieve the saved screenshot
    const imageResponse2 = await fetch(`${serverURL}/screenshots/${fileName2}`);

    const diskWritableStream2 = await Deno.open('screenshot2.png', {
        create: true,
        write: true,
    });

    const readableStream2 = imageResponse2.body;
    await readableStream2.pipeTo(diskWritableStream2.writable);

    // Close context
    await fetch(`${serverURL}/close_context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context_id }),
    });

    // Close browser instance
    await fetch(`${serverURL}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ browser_id }),
    });
}

main();