# browser-automation

A sandbox for experimenting with cloud and AI-powered browser automation. The project contains two independent approaches: **Browserbase** (cloud-hosted Playwright sessions) and **browser-use** (local AI agent that controls your real browser).

---

## Project Structure

```
browser-automation/
├── browserbase-playwright/       # Cloud browser automation via Browserbase + Playwright (Node.js)
│   ├── browserbase-runner.js     # Launches a Browserbase session and navigates to a target page
│   └── package.json
│
├── browser-use-agent/            # Local AI browser agent using browser-use + Gemini (Python)
│   ├── reddit-browser-agent.py   # AI agent configured to perform tasks on Reddit / web apps
│   ├── reddit-user-scraper.py    # Fetches posts from a Reddit user via the JSON API
│   └── api-server/               # FastAPI + ngrok server that exposes the agent as an HTTP API
│       └── server.py
│
├── reddit-sample-data.json       # Sample Reddit post data for testing/dev
├── playwright.config.ts          # Playwright test configuration (Chromium, Firefox, WebKit)
└── package.json                  # Root Node.js project (Playwright test runner)
```

---

## Approach 1: Browserbase + Playwright (`browserbase-playwright/`)

Runs a Playwright browser session in the cloud using [Browserbase](https://browserbase.com). Toggle `RUN_LOCAL` in `browserbase-runner.js` to switch between a local Chromium window and a remote Browserbase session.

### Setup

```bash
cd browserbase-playwright
npm install
```

Create a `.env` file:

```env
BROWSERBASE_API_KEY=your_api_key_here
BROWSERBASE_PROJECT_ID=your_project_id_here
```

### Run

```bash
node browserbase-runner.js
```

---

## Approach 2: browser-use AI Agent (`browser-use-agent/`)

Uses [browser-use](https://docs.browser-use.com) to drive a locally installed Chrome browser with an AI agent powered by Google Gemini. The agent receives a natural-language task and executes it autonomously.

### Setup

```bash
pip install browser-use python-dotenv
```

Create a `.env` file in `browser-use-agent/`:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

### Run the agent directly

```bash
cd browser-use-agent
python reddit-browser-agent.py
```

### Run via the API server (`api-server/`)

Exposes the agent as a secured HTTP endpoint via FastAPI and ngrok, so it can be triggered remotely (e.g. from an n8n workflow or webhook).

```bash
pip install fastapi uvicorn ngrok
```

Add to your `.env`:

```env
NGROK_AUTH_TOKEN=your_ngrok_token_here
APP_API_KEY=your_chosen_api_key_here
```

```bash
cd browser-use-agent/api-server
python server.py
```

Endpoints:

| Method | Path  | Description                          |
|--------|-------|--------------------------------------|
| GET    | `/`   | Health check (requires `X-API-KEY` header) |
| GET    | `/run` | Triggers the browser agent task      |

---

## Environment Variables Summary

| Variable               | Used in                    | Description                        |
|------------------------|----------------------------|------------------------------------|
| `BROWSERBASE_API_KEY`  | `browserbase-playwright/`  | Browserbase API key                |
| `BROWSERBASE_PROJECT_ID` | `browserbase-playwright/` | Browserbase project ID             |
| `GOOGLE_API_KEY`       | `browser-use-agent/`       | Gemini API key for the AI agent    |
| `NGROK_AUTH_TOKEN`     | `browser-use-agent/api-server/` | ngrok authentication token    |
| `APP_API_KEY`          | `browser-use-agent/api-server/` | API key for securing the server endpoints |

> All secrets are loaded from `.env` files and are never hardcoded. Make sure `.env` is listed in `.gitignore` before committing.
