const { chromium } = require("playwright");
const fs = require("fs");

async function performOrderBidding(page, context) {
  await page.fill("#id_bid", "0");
  await page.waitForTimeout(2000);
  await page.click("body");
  const minBid = await page.$eval("#id_bid-error", (element) => {
    const text = element.textContent.trim();
    const valueStartIndex = text.indexOf("$") + 1;
    return text.substring(valueStartIndex);
  });
  await page.fill("#id_bid", minBid);
  const file_links = await page.$$eval(
    "div.paper_instructions_view a",
    (links) => links.map((link) => link.href)
  );
  if (file_links.length > 1) {
    const page3 = await context.newPage();
    try {
      await page3.goto(file_links.pop());
      await page3.close();
    } catch (error) {
      // {}
      await page3.close();
    }
  }
  await page.click("input#apply_order", { timeout: 155000 });
  await page.fill(
    "#id_body",
    "Hello, I am a competent and diligent writer determined to ensure my client's success."
  );
  await page.click("input#id_send_message");
  await page.fill(
    "#id_body",
    "I would be delighted to work on this task for you."
  );
  await page.click("input#id_send_message");
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const cookies = JSON.parse(fs.readFileSync("login_cookies.json"));
  await context.addCookies(cookies);

  let shouldContinue = false;

  while (true) {
    await page.goto("https://essayshark.com/writer/orders/");
    const elements = await page.locator("tr.normal_order td a");
    page.on("dialog", async (dialog) => {
      console.log(
        "+++++++++++++++++++++\nDialog appeared.\nLine 56 Triggered\n+++++++++++++++++++++"
      );
      await dialog.accept();
      await performOrderBidding(page, context);
      shouldContinue = true;
    });

    if (shouldContinue) {
      shouldContinue = false;
      continue;
    }

    // await page.keyboard.down("Control");
    await elements.first().click({ timeout: 0 });
    try {
      await performOrderBidding(page, context);
    } catch (error) {
      console.log("Could not bid for order");
      console.log(error);
      continue;
    }
  }
  // await page.waitForTimeout(5000);
  // await context.close();
  // await browser.close();
})();
