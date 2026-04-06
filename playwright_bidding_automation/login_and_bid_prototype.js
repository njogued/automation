const assert = require("node:assert");
const { chromium, devices } = require("playwright");
const fs = require("fs");

(async () => {
  // Setup
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // const browser2 = await chromium.launch({ headless: false });
  // const context2 = await browser2.newContext();
  // const page2 = await context2.newPage();

  // Login using email and password and save the cookies to a file
  await page.goto('https://essayshark.com/auth_required.html?role=writer&url=%2Fwriter%2F');
  await page.fill('input[name="login"]', 'xxxxx@gmail.com');
  await page.fill('input[name="password"]', 'xxxx');
  await page.getByRole('button', { name: 'Login' }).click();

  const cookies = await context.cookies();
  fs.writeFileSync('login_cookies.json', JSON.stringify(cookies));

  // Load the cookies from the file
  const cookies2 = JSON.parse(fs.readFileSync("login_cookies.json"));
  await context2.addCookies(cookies2);

  // Navigate to the page and assert

  await page2.goto("https://essayshark.com/writer/orders/255964428.html");
  await page2.fill("#id_bid", "0");
  await page2.click("body");
  const minBid = await page2.$eval("#id_bid-error", (element) => {
    const text = element.textContent.trim();
    const valueStartIndex = text.indexOf("$") + 1;
    return text.substring(valueStartIndex);
  });
  await page2.fill("#id_bid", minBid);
  // const divElement = await page2.$("div.d50.right");
  // const linkElement = await divElement.$("div.paper_instructions_view a");
  // const href = await linkElement.getAttribute("href");
  // const elements = await page2.locator("div.paper_instructions_view");
  // // const count = await elements.count();
  // const count_elements = await elements.count();
  // console.log(count_elements);
  // // if (count_elements > 1) {
  // //   const url1 = await elements.getByRole("link").nth(1).click();
  // // };

  try {
    const element = await page
      .locator(
        'xpath=//*[@id="c"]/div/div[4]/div[4]/div[2]/div[2]/dl[2]/dd/div/a[1]'
      )
      .first()
      .click();
  } catch (error) {
    console.log("No links I guess");
  }
  // let z = 0;
  // for (const elem of elements) {
  //   if (await elem.isVisible()) {
  //     try {
  //       const url1 = await elem.getByRole("link").first().click();
  //       z += 1;
  //     }
  //     catch  (error) {
  //       console.log("No materials")
  //     };
  //   };
  // };
  // console.log(z);

  // const divElement = await page2.$("div.d50.right");
  // const linkElement = await divElement.$("div.paper_instructions_view a");
  // const href = await linkElement.getAttribute("href");
  // console.log(href.length);

  try {
    const dtElement = await page2.getByText("Uploaded additional materials:", {
      exact: true,
      timeout: 5000,
    });
  } catch (error) {
    console.log("No materials");
  }
  // const dtText = await dtElement.innerText();
  // if (dtText.includes("Uploaded additional materials:")) {
  //   const aElement = await page2.locator("div.d50.right a").first();
  //   const url = await aElement.getAttribute("href");
  //   console.log(url);
  // }

  const hrefs = await page2.$$eval("div.paper_instructions_view a", (links) =>
    links.map((link) => link.href)
  );
  if (hrefs.length > 1) {
    const page3 = await context2.newPage();
    try {
      await page3.goto(hrefs.pop());
      await page3.close();
    } catch (error) {
      console.log("Something happened");
      await page3.close();
    };
  };

  // await hrefs[1].click();

  await page2.click("input#apply_order", { timeout: 32000 });

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

  //   await page.waitForTimeout(30000);
  await page2.waitForTimeout(10000);

  // assert(await page.title() === 'Example Domain'); // 👎 not a Web First assertion

  // Teardown
  //   await context.close();
  await context2.close();
  //   await browser.close();
  await browser2.close();
})();
