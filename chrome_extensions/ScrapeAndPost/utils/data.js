// code to create a dictionary from options list in selected
// employers from the html page

const fs = require("fs");
const data = require("./employers");
const dict = {};

data
  .trim()
  .split("\n")
  .forEach((line) => {
    const match = line.match(/<option value="(\d+)">([^<]+)<\/option>/);
    if (match) {
      const value = match[1];
      const text = match[2].trim().replace("&amp;", "&");

      dict[text] = value;
    }
  });

const jsonData = JSON.stringify(dict, null, 2);

// Write the JSON data to a file
fs.writeFileSync("output.json", jsonData, "utf-8");
