import 'dotenv/config';
import { chromium } from "playwright-core"; // Note: you might need 'playwright' for local
import { Browserbase } from "@browserbasehq/sdk";

const RUN_LOCAL = false; // Toggle this to false to use Browserbase

async function run() {
  let browser;
  let session;

  // console.log("Requesting session with Project ID:", process.env.BROWSERBASE_PROJECT_ID);

  if (RUN_LOCAL) {
    console.log("🚀 Running locally...");
    // For local, we use launch()
    browser = await chromium.launch({ 
      headless: false // Set to true if you don't want to see the window pop up
    });
  } else {
    try {
      console.log("☁️ Running on Browserbase...");
      const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });
      // try {
      //   session = await bb.createSession({
      //   projectId: process.env.BROWSERBASE_PROJECT_ID,
      //   });
      //   console.log("Full Session Response:", JSON.stringify(session, null, 2));
      // } catch (e) {
      //   console.error("The API returned an error:", e.message);
      // }
      // console.log("Available methods:", Object.keys(bb));
      session = await bb.createSession({ projectId: process.env.BROWSERBASE_PROJECT_ID });
      // session = await bb.createSession({
      //   projectId: process.env.BROWSERBASE_PROJECT_ID,
      //   browserSettings: {
      //     advancedStealth: true,
      //   },
      //   proxies: true,
      // });
      // console.log("Available methods:", Object.keys(session));
      // browser = await bb.connect(session.id);
      // 3. Use a fallback to make sure we have a URL
      console.log(`Session Created: ${session.id}`);
      // Generate the URL using the SDK helper
      const url = session.connectUrl; 
      console.log("Connecting to CDP...");
      browser = await chromium.connectOverCDP(url);
    } catch (e) {
      console.error("The API returned an error:", e.message);
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://news.ycombinator.com/");
  console.log("Title:", await page.title());

  await browser.close();
  
  if (session) {
    console.log(`Replay: https://browserbase.com/sessions/${session.id}`);
  }
}

run().catch(console.error);