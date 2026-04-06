# chrome_extensions

Chrome extensions for automating job listing workflows across job boards.

---

## Extensions

### `ScrapeAndPost/`

Scrapes job listings from the HNJ job site and auto-fills the equivalent posting form on FUZU. A background service worker detects when the user is on the HNJ site, injects a content script to extract job details, and populates the FUZU form automatically. Includes a popup UI for status and controls.

### `ScrapeAndPost-KE/`

A Kenya-market variant of ScrapeAndPost (`-KE`). Same core architecture with localised employer data, company lists, and location mappings specific to the Kenyan job market.

---

## Setup

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the extension folder (`ScrapeAndPost/` or `ScrapeAndPost-KE/`)

Permissions required: `storage`, `tabs`.
