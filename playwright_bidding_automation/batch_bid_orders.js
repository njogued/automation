const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  // Load the cookies from the file
  const cookies = JSON.parse(fs.readFileSync("login_cookies.json"));
  await context.addCookies(cookies);
  await page.goto("https://essayshark.com/writer/orders/");

  // const table = await page.$('table tbody');
  // const tableRows = await table.$$('tr')
  // const rows = await page.locator('tr.normal_order').all();
  // // const rows = page.locator("//table//tbody//tr").all();
  // // const rows = await page.$$('table tbody tr td');
  // for (const row of rows) {
  //   // Retrieve the href value from the <a> tag
  //   // const href = await row.$eval('td.order_number a', (a) => a.getAttribute('href'));
  //   // const href = await row.query_selector('a');
  //   const linkElements = await row.$$('a');  // Select all <a> elements within the row

  //   // Click on the first link within the row
  //   await linkElements[0].click();

  //   // console.log(href);
  // };
  await page.waitForTimeout(5000);
  // await page.locator("#table_orders_load_qty").selectOption("200");
  // await page.waitForTimeout(10000);
  const hrefs = await page.$$eval("table tr td.order_number a", (links) =>
    links.map((link) => link.href)
  );
  console.log(hrefs);
  for (const href of hrefs) {
    const page2 = await context.newPage();
    await page2.goto(href);
    try {
      await page2.fill("#id_bid", "0");
      await page2.click("body");
      const minBid = await page2.$eval("#id_bid-error", (element) => {
        const text = element.textContent.trim();
        const valueStartIndex = text.indexOf("$") + 1;
        return text.substring(valueStartIndex);
      });
      await page2.fill("#id_bid", minBid);
      // const elements = await page2.locator("div.paper_instructions_view").all();
      // for (const elem of elements) {
      //   if (await elem.isVisible()) {
      //     try {
      //       const url1 = await elem.getByRole("link").first().click();
      //     }
      //     catch  (error) {
      //       console.log("No materials")
      //     };
      //   };
      // };
      const file_links = await page2.$$eval(
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
          // console.log(error);
        }
      }

      await page2.click("input#apply_order", { timeout: 155000 });

      await page2.fill(
        "#id_body",
        "Hello, I am a competent and diligent writer determined to ensure my client's success."
      );
      await page2.click("input#id_send_message");
      await page2.fill(
        "#id_body",
        "I would be delighted to work on this task for you."
      );
      await page2.click("input#id_send_message");
      await page2.close();
    } catch (error) {
      console.log(`Could not bid for order link: ${href}`);
      console.log(error.name);
      await page2.close();
    }
  }
  await page.waitForTimeout(10000);
  // ---------------------
  await context.close();
  await browser.close();
})();
