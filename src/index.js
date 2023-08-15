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
import { spawn } from 'node:child_process';
// express cors
import cors from 'cors';

const time_lauched = Date.now();

const browsers = [];
const contexts = [];
const pages = [];

const DURATION_WINDOW = 10;
const metrics = {
    google: {
        total: 0,
        average_duration: 0,
    },
    twitter: {
        total: 0,
        average_duration: 0,
    },
    mermaid: {
        total: 0,
        average_duration: 0,
    },
    pdf2txt: {
        total: 0,
        average_duration: 0,
    }
}

function createSHA1(input) {
    return createHash('sha256').update(input).digest('hex');
}

const app = express();

app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(cors());

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
            // 4k screen
            width: 2560,
            height: 2160,
            deviceScaleFactor: 2,
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

async function closePage(page_id) {
    console.log('Closing page...');

    const page = pages.find(page => page.id === page_id);

    if (!page) {
        return;
    }

    await page.obj.close();

    pages.splice(pages.indexOf(page), 1);

    return page.context_id;
}

async function goto(page_id, url) {
    console.log(`Going to page ${url}...`);

    const page = pages.find(page => page.id === page_id);

    if (!page) {
        return;
    }

    await page.obj.goto(url);
}

function getPage(page_id) {
    console.log(`Getting page...`);

    const page = pages.find(page => page.id === page_id);

    if (!page) {
        return;
    }

    return page.obj;
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

    const start = Date.now();

    const res = await fetch(url);

    // nodejs buffer from res
    const buffer = await res.arrayBuffer();
    const data = await pdf(buffer);

    const text = data.text;

    const end = Date.now();

    const duration = (end - start) / 1000;

    updateMetric(metrics.pdf2txt, duration);

    return text;
}

app.get('/', (req, res) => {
    const status = {
        running: true,
        browsers: browsers.length,
        contexts: contexts.length,
        pages: pages.length,
        seconds_running: Math.floor((Date.now() - time_lauched) / 1000)
    };

    res.send(status);
});

app.get('/metrics', (req, res) => {
    res.send({
        browser: {
            browsers: browsers.length,
            contexts: contexts.length,
            pages: pages.length,
        },
        ...metrics
    });
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

    const start = Date.now();

    if (!url) {
        res.send('No url provided');
        return;
    }

    const result = await fetchTweets(url);

    const resBody = {
        url,
        result
    };

    const end = Date.now();

    const duration = (end - start) / 1000;

    updateMetric(metrics.twitter, duration);
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

    const start = Date.now();
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

    const end = Date.now();
    const duration = end - start;

    const resBody = {
        fileName,
        duration
    };

    updateMetric(metrics.mermaid, duration);

    res.send(resBody);
});

function updateMetric(metric, duration) {
    metric.total++;
    if (!metric.average_duration) {
        metric.average_duration = duration;
        return;
    } else {
        const window_size = Math.min(metric.total, DURATION_WINDOW);
        metric.average_duration = (metric.average_duration * (window_size - 1) + duration) / window_size;
    }
}

let google_browser_id = null;
let google_context_id = null;
app.get('/google', async (req, res) => {

    const start = Date.now();
    // get request body text
    const query = req.query.q;

    // timeframe (optional) - h, d, w, m, y
    const timeframe = req.query.t;

    let timeFrameQuery = "";
    if (timeframe) {
        timeFrameQuery = `&tbs=qdr:${timeframe}`;
    }

    if (!google_browser_id) {
        google_browser_id = await launchBrowser();
        google_context_id = await newContext(google_browser_id);
    }

    const page_id = await newPage(google_context_id);

    const locale_query = "&hl=en";

    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}${timeFrameQuery}${locale_query}`;

    await goto(page_id, url);

    // take screenshot
    // const fileName = await screenshot(page_id, "#search", query);

    const page = getPage(page_id);

    // wait for results
    await page.waitForSelector(".g");

    if (!page) {
        console.error("Page not found");
        res.send("Error");
        return;
    }

    console.info("Got results");

    const items = [];

    const results = await page.$$(".g");

    for (const result of results) {
        const title = await result.$eval("h3", (el) => el.innerText);
        const link = await result.$eval("a", (el) => el.href);
        const description = await result.innerText();

        let related_links = await result.$$eval("a", (els) => {
            const links = [];

            for (const el of els) {
                const link = el.href;
                const title = el.innerText;

                links.push({ link, title });
            }

            return links;
        });

        // remove first
        related_links.shift();

        items.push({
            title,
            link,
            description,
            related_links
        });
    }

    // close page
    await closePage(page_id);

    const end = Date.now();

    const duration = end - start;

    updateMetric(metrics.google, duration);

    res.send({ items, duration });
});

app.get('/yt-dlp', async (req, res) => {
    const url = req.query.url;
    const format = req.query.format || 'webm';
    // const from = req.query.from || 0;
    // const to = req.query.to || -1;

    const id = createSHA1(url + format);

    try {
        const path = `videos/${id}.${format}`
        const stat = await fs.stat(path);
        const total = stat.size;

        const fd = await fs.open(path, 'r');

        if (req.headers.range) { // meaning client (browser) has moved the forward/back slider
            const range = req.headers.range;
            const parts = range.replace(/bytes=/, "").split("-");
            const partialstart = parts[0];
            const partialend = parts[1];

            const start = parseInt(partialstart, 10);
            const end = partialend ? parseInt(partialend, 10) : total - 1;
            const chunksize = (end - start) + 1;

            console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

            res.writeHead(206, {
                'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': `video/${format}`
            });

            await fd.createReadStream({ start, end }).pipe(res);
            return;
        }

        res.setHeader('Content-Type', `video/${format}`);
        res.setHeader('Content-Length', total);
        await fd.createReadStream().pipe(res);

        console.info('File exists, sending...');
        return;
    } catch (err) {
        console.error(err);
        console.info('File does not exist, creating...');
    }

    const cmd = `yt-dlp -o "videos/${id}.%(ext)s" --merge-output-format ${format} ${url}`;

    const child = exec(cmd, (error, stdout, stderr) => {
        console.log(error);
        console.log(stdout);
    });

    child.on('exit', async () => {
        console.info('Completed yt-dlp...');

        // send file
        const file_name = `${id}.${format}`;
        const file_path = `videos/${file_name}`;

        const fd = await fs.open(file_path, 'r');

        res.setHeader('Content-Type', `video/${format}`);
        await fd.createReadStream().pipe(res);
    });
});

app.get('/restart', async (req, res) => {
    // restart pm2 process

    const cmd = `pm2 restart shortcutai`;

    const child = exec(cmd, (error, stdout, stderr) => {
        console.log(error);
        console.log(stdout);
    });

    child.on('exit', async () => {
        console.info('Completed restart...');
    });

    res.send("Restarting...");
});


const port = 80;
app.listen(80, () => {
    console.log(`Listening on port ${port}...`);
});