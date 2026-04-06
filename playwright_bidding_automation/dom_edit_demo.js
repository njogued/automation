const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Define a flag to keep track of whether the text has been changed
  let textChanged = false;

  // Function to change the button text
  async function changeButtonText() {
    const luckyButton = await page
      .locator('input[value="I\'m Feeling Lucky"]')
      .last();
    await luckyButton.evaluate((btn) => {
      btn.setAttribute("value", "Hello Ed");
    });
    textChanged = true;
  }

  // Intercept page navigation and change button text if needed
  page.on("request", async (request) => {
    if (request.url() === "https://www.google.com/" && !textChanged) {
      await changeButtonText();
    }
  });

  // Load Google homepage
  await page.goto("https://www.google.com");
  textChanged = false;

  // Wait for a moment to see the initial change
  await page.waitForTimeout(10000);

  // Go back to Google homepage
  await page.goBack();
  await page.waitForTimeout(10000);
  await page.goto("https://www.google.com");

  // Wait for a moment to see the change after going back
  await page.waitForTimeout(20000);

  await browser.close();
})();
