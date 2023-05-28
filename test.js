import { chromium, webkit } from "playwright";

console.log('Launching browser...');

const browser = await chromium.launch();
const page = await browser.newPage();
const searchTerm = 'runwayml release';
const googleSearchURL = `https://www.google.com/search?q=${searchTerm}`;
await page.goto(googleSearchURL);
console.log(await page.title());
await page.screenshot({ path: "example.png" });
await browser.close();

