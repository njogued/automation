# automation

A collection of scripts, integrations, and automations built across different tools and platforms. Covers API integrations, browser automation, scheduled jobs, workflow automation, and productivity tooling.

---

## Folders

### `monday/`
Monday.com app development and automation via the GraphQL API (Python + Node.js). Includes **Connected Items Sync**, a production integration app that propagates updates across connected board items in real time, plus standalone scripts for CRM enrichment, contact exports, and monthly invoice management.

### `n8n/`
Exported n8n workflow JSON files, synced automatically for version control and backup. Covers integrations across CRM tools, communication platforms, and data processing tasks.

### `apps_script/`
Google Apps Script automations for Gmail, Docs, Sheets, and Forms. Includes a Markdown-to-Google-Doc converter (Web App), a daily follow-up reminder, a form registration mailer, a sent-messages exporter, and **light_crm** — a full Gmail-native CRM with mail merge, email tracking, and GPT-powered lead analysis.

### `ai-browser-automation/`
AI-directed browser automation using [browser-use](https://github.com/browser-use/browser-use) and [Browserbase](https://www.browserbase.com/). Two approaches: a cloud-hosted Playwright session via Browserbase, and a local AI agent powered by Google Gemini that controls the browser from natural-language instructions. Includes a FastAPI + ngrok server for remote triggering.

### `playwright_bidding_automation/`
Playwright scripts that automate order bidding on EssayShark. Includes a continuous bidding bot, a batch bidder for catching up on a backlog, and a login/cookie-management prototype.

### `chrome_extensions/`
Chrome extensions for automating job listing workflows. **ScrapeAndPost** scrapes listings from HNJ and auto-fills the equivalent form on FUZU. **ScrapeAndPost-KE** is a Kenya-market variant with localised employer and location data.

### `crons/`
Scheduled Python scripts designed to run on a timer. Currently includes a daily BTC/USD and BTC/KES price fetcher that emails a summary via Gmail SMTP.

### `z_other_scripts/`
Standalone utility scripts. A concurrent image downloader with automatic compression, and a Zoom cloud recordings bulk downloader using the Zoom OAuth API.

---

## Setup

Most scripts read credentials from environment variables. Common ones:

```bash
export MONDAY_API_KEY="..."         # Monday.com personal API token
export OPENAI_API_KEY="..."         # OpenAI API key
export OPENAI_ORG_ID="..."
export OPENAI_PROJECT_ID="..."
```

See the README in each folder for script-specific setup, dependencies, and scheduling examples.

---

## Tech

Python · Node.js · JavaScript · Google Apps Script · Playwright · n8n · browser-use · Browserbase · Monday.com GraphQL API · OpenAI API · Zoom API · Gmail API
