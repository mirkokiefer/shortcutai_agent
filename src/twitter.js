import { chromium, webkit } from "playwright";

let result = [];

let twitter_context = null;
// const url = "https://twitter.com/elonmusk/status/1662654838398697472";
// await fetchTweets(url);

export async function fetchTweets(url) {
  console.log("Fetching tweets...");

  let context = twitter_context;

  if (!context) {
    console.log("Launching browser...");

    const browser = await webkit.launch(); // Or 'firefox' or 'webkit'.

    context = await browser.newContext({
      viewport: {
        width: 375,
        height: 1600,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        isLandscape: false,
      },
      // recordVideo: { dir: "videos/" },
    });
  }

  const page = await context.newPage();

  console.log("Navigating to twitter...");

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
    try {
      await tweets[i].scrollIntoViewIfNeeded();
    } catch (err) {
      console.log("Could not scroll into view");
      continue;
    }

    console.log(`Tweet ${i + 1} of ${tweets.length}`);

    try {
      // Get the actual tweet content
      const text = await tweets[i].$eval(
        "*[data-testid='tweetText']",
        (tweet) => tweet.innerText,
      );
      console.log(text);
      tweet.text = text;
    } catch (err) {
      console.log("No text");
      tweet.text = "";
    }

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

    try {
      // Get likes
      const likesTxt = await tweets[i].$eval(
        "*[data-testid='like']",
        (like) => like.innerText,
      );

      console.log("likes", likes);

      // parse likes
      // Exmaple: '6,435\n'
      const likes = parseInt(likesTxt.replace(",", "").trim());
      tweet.likes = likes;
    } catch (err) {
      console.log("No likes");
      tweet.likes = 0;
    }

    try {
      // Get retweets
      const retweetsTxt = await tweets[i].$eval(
        "*[data-testid='retweet']",
        (retweet) => retweet.innerText,
      );

      const retweets = parseInt(retweetsTxt.replace(",", "").trim());
      tweet.retweets = retweets;
    } catch (err) {
      console.log("No retweets");
      tweet.retweets = 0;
    }


    // Get tweet date
    try {
      // Example:
      // <a href="/gmoneyNFT/status/1662655083694178305" dir="ltr" aria-label="14 hours ago" role="link" class="css-4rbku5 css-18t94o4 css-901oao r-1bwzh9t r-1loqt21 r-xoduu5 r-1q142lx r-1w6e6rj r-37j5jr r-a023e6 r-16dba41 r-9aw3ui r-rjixqe r-bcqeeo r-3s2u2q r-qvutc0"><time datetime="2023-05-28T03:00:37.000Z">14h</time></a>
      const date = await tweets[i].$eval(
        "time",
        (time) => time.dateTime,
      );

      tweet.date = date;
    } catch (e) {
      console.log("No date");
    }

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

    // Get the src for any images - match multiple img[src]
    try {
      const src = await tweets[i].$$eval(
        "img[src]",
        (imgs) => imgs.map((img) => img.src),
      );

      let profile_images = [];
      let images = [];

      for (let item in src) {
        if (src[item].includes("profile_images")) {
          profile_images.push(src[item]);
        } else {
          images.push(src[item]);
        }
      }

      tweet.profile_images = profile_images;
      tweet.images = images;
    } catch {
      console.log("No image");
    }

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
    // await page.waitForTimeout(1000);
  }

  console.log(result);

  await page.close();

  return result;
}
