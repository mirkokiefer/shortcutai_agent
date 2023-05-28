const { chromium, webkit } = require("playwright");

let result = [];

async function createBrowser() {
  const browser = await webkit.launch(); // Or 'firefox' or 'webkit'.

  const context = await browser.newContext({
    viewport: {
      width: 375,
      height: 812,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      isLandscape: false,
    },
    recordVideo: { dir: "videos/" },
  });
  const page = await context.newPage();

  // URL to search twitter for runwayml
  const url = "https://twitter.com/search?q=runwayml&src=typed_query";
  await page.goto(url);

  // Wait for the tweets to load
  await page.waitForSelector('*[data-testid="tweet"]');

  // Get the tweets
  const tweets = await page.$$("article");
  console.log(`Found ${tweets.length} tweets!`);

  for (let i = 0; i < tweets.length; i++) {
    let tweet = {
      url: "",
      author: "",
      text: "",
      likes: 0,
      retweets: 0,
      image_url: "",
      video_url: "",
    };
    await tweets[i].scrollIntoViewIfNeeded();

    console.log(`Tweet ${i + 1} of ${tweets.length}`);

    // Get the actual tweet content
    const text = await tweets[i].$eval(
      "*[data-testid='tweetText']",
      (tweet) => tweet.innerText,
    );
    console.log(text);
    tweet.text = text;

    try {
      // Get the tweet author - a href starting with /[username]
      const author = await tweets[i].$eval(
        "a[href^='/']",
        (a) => a.href,
      );

      tweet.author = author;
      console.log(author);
    } catch (err) {
      console.log("No author");
    }

    try {
      // Get the tweet permalink - a href starting with /[author]/[tweet]
      const url = await tweets[i].$eval(
        "a[href^='/'][href*='/status/']",
        (a) => a.href,
      );

      tweet.url = url;
      console.log(url);
    } catch (err) {
      console.log("No url");
    }

    // Get likes
    const likes = await tweets[i].$eval(
      "*[data-testid='like']",
      (like) => like.innerText,
    );

    console.log("likes", likes);
    tweet.likes = likes;

    // Get retweets
    const retweets = await tweets[i].$eval(
      "*[data-testid='retweet']",
      (retweet) => retweet.innerText,
    );
    tweet.retweets = retweets;
    console.log("retweets", retweets);

    try {
      // Get any a href with target blank
      const href = await tweets[i].$eval(
        "a[target='_blank']",
        (a) => a.href,
      );

      console.log(href);
    } catch (e) {
      console.log("No link");
    }

    // Get the src for any images
    const src = await tweets[i].$eval(
      "img[src]",
      (img) => img.src,
    );

    console.log(src);
    tweet.image_url = src;

    // Get the src for any videos
    try {
      const src2 = await tweets[i].$eval(
        "video[src]",
        (video) => video.src,
      );

      console.log(src2);
      tweet.video_url = src2;
    } catch (e) {
      console.log("No video");
    }

    result.push(tweet);
    await page.waitForTimeout(1000);
  }

  console.log(result);

  // Wait for the tweets to load
  // Wait for tweets count to change
  await page.waitForFunction(
    (tweets) =>
      tweets.length !==
        document.querySelectorAll('*[data-testid="tweet"]').length,
    {},
    tweets,
  );

  // Get the tweets
  const tweets2 = await page.$$('*[data-testid="tweet"]');

  console.log(`Found ${tweets2.length} tweets!`);

  // Scroll one by one to each new tweet
  for (let i = tweets.length; i < tweets2.length; i++) {
    await tweets2[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }

  // Click the last tweet
  console.log("Clicking last tweet");

  await tweets2[tweets2.length - 1].click();

  // Wait for the tweet to load
  //   await page.waitForSelector('*[data-testid="tweet"]');
  await page.waitForTimeout(3000);

  // Go back to the search results
  await page.goBack();

  await page.waitForSelector('*[data-testid="tweet"]');

  // Get the tweets
  const tweets3 = await page.$$('*[data-testid="tweet"]');

  // Click on second last tweet
  console.log("Clicking second last tweet");

  await tweets3[tweets3.length - 2].click();

  // Wait for the tweet to load
  //   await page.waitForSelector('*[data-testid="tweet"]');
  await page.waitForTimeout(6000);

  // Stop the video recording
  await context.close();
  await browser.close();
}
