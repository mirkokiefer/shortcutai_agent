import express from 'express';
// json body parser
import bodyParser from 'body-parser';
import { chromium, webkit } from "playwright";
// uuid package
import { v4 as uuidv4 } from 'uuid';
import { runOCR } from './ocr.js';
import { promises as fs } from "fs";
import pdf from 'pdf-parse-deno';
import { fetchTweets } from './twitter.js';
import { exec } from 'child_process';
import { createHash } from 'crypto';
import { run } from "@mermaid-js/mermaid-cli"

const browsers = [];
const contexts = [];
const pages = [];

function createSHA1(input) {
    return createHash('sha256').update(input).digest('hex');
}

const app = express();

app.use(bodyParser.text());
app.use(bodyParser.json());

async function launchBrowser() {
    console.log('Launching browser...');

    const browserObj = await webkit.launch();

    const browser_id = (browsers.length + 1).toString();

    const browser = {
        id: browser_id,
        obj: browserObj,
    };

    browsers.push(browser);

    return browser_id;
}

async function closeBrowser(browser_id) {
    console.log('Closing browser...');

    const browser = browsers.find(browser => browser.id === browser_id);

    if (!browser) {
        return;
    }

    await browser.obj.close();

    browsers.splice(browsers.indexOf(browser), 1);
}

async function newContext(browser_id, opts) {
    console.log('Creating new context...');

    const browser = browsers.find(browser => browser.id === browser_id);

    if (!browser) {
        return null;
    }

    const defaultOpts = {
        viewport: {
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: false,
        },
        // recordVideo: { dir: "videos/" },
    };

    const filledOps = {
        ...defaultOpts,
        ...opts,
    };

    const contextObj = await browser.obj.newContext(filledOps);

    const context_id = (contexts.length + 1).toString();
    const context = {
        id: context_id,
        browser_id,
        obj: contextObj
    };

    contexts.push(context);

    return context_id;
}

async function closeContext(context_id) {
    console.log('Closing context...');

    const context = contexts.find(context => context.id === context_id);

    if (!context) {
        return;
    }

    await context.obj.close();

    contexts.splice(contexts.indexOf(context), 1);
}

async function newPage(context_id) {
    console.log('Creating new page...');
    const context = contexts.find(context => context.id === context_id);

    if (!context) {
        return null;
    }

    const pageObj = await context.obj.newPage();

    const page_id = (pages.length + 1).toString();

    const page = {
        id: page_id,
        context_id,
        obj: pageObj
    };

    pages.push(page);

    return page_id;
}

async function goto(page_id, url) {
    console.log(`Going to page ${url}...`);

    const page = pages.find(page => page.id === page_id);

    if (!page) {
        return;
    }

    await page.obj.goto(url);
}

async function getHTML(page_id, selector) {
    console.log(`Evaluating on page...`);

    const page = pages.find(page => page.id === page_id);

    if (!page) {
        return;
    }

    // html for each element
    const html = await page.obj.evaluate((selector) => {
        const elements = document.querySelectorAll(selector);
        const html = [];

        elements.forEach(element => {
            html.push(element.outerHTML);
        });

        return html;
    }, selector);

    return html;
}

async function screenshot(page_id, selector, name) {
    console.log('Taking screenshot...');

    const page = pages.find(page => page.id === page_id);

    if (!page) {
        return null;
    }

    const fileName = `${name || uuidv4()}.png`;
    const path = `screenshots/${fileName}`;

    if (selector) {
        // wait for selector
        try {
            await page.obj.waitForSelector(selector);
        } catch (error) {
            console.log(error);
            return null;
        }

        const el = await page.obj.$(selector);
        await el.screenshot({ path });
        return fileName;
    }

    await page.obj.screenshot({ path });

    return fileName;
}

async function ocr(fileName) {
    console.log('Performing OCR...');

    const path = `screenshots/${fileName}`;

    const imageData = await fs.readFile(path);

    const result = await runOCR(imageData);
    console.log(result);

    return result;
}

async function pdf2txt(url) {
    console.log('Converting PDF to TXT...');

    const res = await fetch(url);

    // nodejs buffer from res
    const buffer = await res.arrayBuffer();
    const data = await pdf(buffer);

    const text = data.text;

    return text;
}

app.get('/', (req, res) => {
    const status = {
        running: true,
        browsers: browsers.length,
        contexts: contexts.length,
        pages: pages.length,
    };

    res.send(status);
});

app.post('/launch', async (req, res) => {
    const browser_id = await launchBrowser();

    const resBody = {
        browser_id
    };

    res.send(resBody);
});

app.post('/close', async (req, res) => {
    const browser_id = req.body.browser_id;

    await closeBrowser(browser_id);

    const resBody = {
        browser_id
    };

    res.send(resBody);
});

app.post('/new_context', async (req, res) => {
    const browser_id = req.body.browser_id;
    const opts = req.body.opts || {};

    const context_id = await newContext(browser_id, opts);

    const resBody = {
        browser_id,
        context_id
    };

    res.send(resBody);
});

app.post('/close_context', async (req, res) => {
    const context_id = req.body.context_id;

    await closeContext(context_id);

    const resBody = {
        context_id
    };

    res.send(resBody);
});

app.post('/new_page', async (req, res) => {
    const context_id = req.body.context_id;

    const page_id = await newPage(context_id);

    const resBody = {
        context_id,
        page_id
    };

    res.send(resBody);
});

app.post('/goto', async (req, res) => {
    const page_id = req.body.page_id;
    const url = req.body.url;

    await goto(page_id, url);

    const resBody = {
        page_id,
        url
    };

    res.send(resBody);
});

app.post('/html', async (req, res) => {
    const page_id = req.body.page_id;
    const selector = req.body.selector;

    const result = await getHTML(page_id, selector);

    const resBody = {
        page_id,
        selector,
        result
    };

    res.send(resBody);
});

app.post('/screenshot', async (req, res) => {
    const page_id = req.body.page_id;

    const fileName = await screenshot(page_id);

    const resBody = {
        page_id,
        fileName
    };

    res.send(resBody);
});

app.get('/screenshots/:fileName', (req, res) => {
    const fileName = req.params.fileName;

    const path = `screenshots/${fileName}`;

    res.sendFile(path, { root: './' });
});

app.post('/ocr', async (req, res) => {
    const page_id = req.body.page_id;
    const fileName = await screenshot(page_id);

    const result = await ocr(fileName);

    const resBody = {
        page_id,
        fileName,
        result
    };

    res.send(resBody);
});

app.get('/pdf2txt', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        res.send('No url provided');
        return;
    }

    const result = await pdf2txt(url);

    const resBody = {
        url,
        result
    };

    res.send(resBody);
});

app.get('/twitter', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        res.send('No url provided');
        return;
    }

    const result = await fetchTweets(url);

    const resBody = {
        url,
        result
    };

    res.send(resBody);
});

app.get('/videos', async (req, res) => {
    const params = req.query;

    // run bash command as child process
    // cd shrtct_video && yarn build
    const id = createSHA1(JSON.stringify(params));
    const cmd = `npx remotion render MyComp out/${id}.mp4 --props '${JSON.stringify(params)}'`;

    console.info(cmd);

    const cwd = `shrtct_video`;
    const child = exec(cmd, { cwd }, (error, stdout, stderr) => {
        console.log(error);
        console.log(stdout);
    });

    child.on('exit', async () => {
        const id = uuidv4();

        console.log('Completed video...');
        console.log(id);
    });

    const resBody = {
        id,
        params
    };

    res.send(resBody);
});

app.get('/videos/:id', (req, res) => {
    const id = req.params.id;

    const path = `shrtct_video/out/${id}.mp4`;

    res.sendFile(path, { root: './' });
});

app.get('voice', async (req, res) => {
    const audio_url = req.query.url;

    // download to local tmp file
    const file_name = createSHA1(audio_url);
    const local_path = `audio/${file_name}.mp3`;
    const audioRes = await fetch(audio_url);
    // pipe to local file
    const ws = fs.createWriteStream(local_path);
    audioRes.body.pipe(ws);

    // convert to text
    const cmd = `stable-ts ${file_name}.mp3 -o ${file_name}.json`;
    const cwd = `audio`;
    const child = exec(cmd, { cwd }, (error, stdout, stderr) => {
        console.log(error);
        console.log(stdout);
    });

    child.on('exit', async () => {
        console.info('Completed voice...');
        console.info(file_name);
    });

    const resBody = {
        file_name,
        audio_url,
    };

    res.send(resBody);
});


const code1 = `
flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
`;
app.get('/mermaid_html', async (req, res) => {
    const code = req.query.code;

    console.info('mermaid', code);

    const fd = await fs.open('mermaid.html', 'r');
    const htmlTemplate = await fd.readFile('utf8');

    const html = htmlTemplate.replace('{{code}}', code);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

let mermaid_browser_id = null;
let mermaid_context_id = null;
app.post('/mermaid', async (req, res) => {
    // get request body text
    const code = req.body;
    console.info('mermaid body', code);

    const id = createSHA1(code);

    const file_name = `${id}.png`;
    const file_path = `screenshots/${file_name}`;

    // check if file exists
    try {
        const fd = await fs.open(file_path, 'r');

        await fd.close();

        console.info('File exists, sending...');

        const resBody = {
            fileName: file_name
        };

        res.send(resBody);
        return;
    } catch (err) {
        console.info('File does not exist, creating...');
    }

    let browser_id = mermaid_browser_id;
    let context_id = mermaid_context_id;

    if (!browser_id) {
        browser_id = await launchBrowser();
        context_id = await newContext(browser_id);

        mermaid_browser_id = browser_id;
        mermaid_context_id = context_id;
    } else {
        console.info("Using existing mermaid browser and context");
    }

    const page_id = await newPage(context_id);

    const url = `http://localhost/mermaid_html?code=${encodeURIComponent(code)}`;

    await goto(page_id, url);

    // take screenshot
    const fileName = await screenshot(page_id, "#mermaid svg", id);

    const resBody = {
        fileName
    };

    res.send(resBody);
});

const port = 80;
app.listen(80, () => {
    console.log(`Listening on port ${port}...`);
});