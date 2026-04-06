## Notes for nerds

What you need to run this project:

- A chromium based browser (preferably Google Chrome)

How to:
- git clone this repository
- enable dev tools in the extension section
- load the extension
  
Permissions used: storage, tabs. 
  
### Service worker: background.js.
- The service worker will run in the background. 
- Checks the current page in browser
- If the page is the hnj website, insert the content script on the page. 
- The service worker sends messages to the content script. 
  
### Content Script
- Insert job form on the hnj site
- Fill in job details on FUZU
  
### Popup
- Displayed when the extension is clicked on the top right of your browser. 