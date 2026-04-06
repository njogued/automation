# n8n Workflows

Version-controlled backups of n8n workflows. The sync process runs automatically, checks for new or modified workflows via the n8n API, and commits them to this folder. See `n8n_Workflows_to_Github.json` for the sync workflow itself.

---

## Workflows (24)

### AI & Automation

- **Auto Rename n8n Workflow Nodes with AI** — Uses Gemini to automatically rename nodes in an n8n workflow to be more descriptive. Triggered via a form or manually.
- **Analyze files with Gemini** — Multi-step AI pipeline (71 nodes) that processes uploaded files using Gemini and structured extraction. Sends results via Gmail.
- **Gemini File Search** — AI agent that searches Google Drive files and answers questions about them using Gemini with conversation memory.
- **Demo: RAG in n8n** — Clean demo of a Retrieval-Augmented Generation (RAG) pipeline: loads documents into an in-memory vector store and answers questions via a chat interface.
- **Pinecone POST** — Ingests documents into a Pinecone vector store with OpenAI embeddings for later retrieval.
- **Pinecone FETCH** — Retrieval-only workflow: answers questions against a Pinecone vector store using a chat trigger.

### AI Agents

- **Monday Subagent** — AI agent that can read and write Monday.com items. Designed to be called from a parent orchestrator workflow.
- **Slack Subagent** — AI agent with Slack tool access. Reads and posts messages; called from a parent workflow.
- **Notion Sub-Workflow** — Sub-workflow that queries and returns Notion database content for use by a parent agent.

### Social & Scraping

- **LinkedIn Job Scraper** — Scrapes LinkedIn job listings via Apify, extracts structured data using AI, and writes results to a Google Sheet.
- **LinkedIn Posts Scraper** — Scrapes LinkedIn posts on a schedule using Apify and saves them to Notion.

### Communication & CRM

- **Learning Tips — 1. Daily Dispatch** — Fetches a learning tip via HTTP, generates a personalised version with OpenAI, and emails + Slacks it daily.
- **Learning Tips — 2. Reminder Loop** — Scheduled reminder that nudges recipients who haven't acknowledged the daily tip.
- **Learning Tips — 3. Acknowledge** — Webhook-triggered acknowledgement handler; updates tracking state and posts a Slack confirmation.
- **Error Monitoring (LL)** — Error trigger that emails a notification whenever a workflow in the instance fails.
- **Check Disk Storage** — Runs a shell command to check server disk usage and sends an alert to Slack if usage is high.

### Business Operations

- **WooCommerce Orders Tracking** — Polls WooCommerce for new orders on a schedule, fetches order details, and syncs them to a Google Sheet and Google Doc tracker.
- **Following Up on Orders (LL)** — Checks for orders that need follow-up and sends reminder emails via Gmail.
- **ConvertKit Stats - Weekly** — Fetches weekly subscriber stats from Kit/ConvertKit and posts a summary to Slack.
- **Kajabi / Sheets / Slack** — Monitors new Kajabi product downloads, syncs records to a Google Sheet, and posts a Slack notification.
- **Kit Flows** — Tracks Kit subscriber stats across multiple flows; sub-workflow used by other reporting pipelines.

### Infrastructure & Meta

- **n8n Workflows to Github** — Pulls all workflows from the n8n instance via the n8n API, compares against the GitHub repo, and commits new or changed workflows. This is the sync workflow that maintains this folder.
- **n8n auto-update** — Checks for n8n version updates on a schedule and posts a Slack notification when a new version is available.
- **n8n Level 2** — Learning/reference workflow covering advanced n8n patterns: Airtable reads, date handling, HTML generation, and multi-step Gmail flows.
