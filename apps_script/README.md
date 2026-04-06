# apps_script

Google Apps Script automations for Gmail, Google Docs, Google Sheets, and Google Forms.

---

## Standalone Scripts

- **`aiScript.js`** — Reusable GPT-4o helper for Apps Script. Wraps the OpenAI Chat Completions API so any other script can call `gpt(prompt, context)` and get a structured response back.

- **`createGoogleDocFromTemplate.js`** — Web App endpoint that converts Markdown to a fully formatted Google Doc. Accepts a JSON POST with `actionType: "Create" | "Update"`, a title, and Markdown content. Handles headings, bold/italic, bullet lists, and styled tables. Supports multiple document templates.

- **`dailyFollowUpReminder.js`** — Reads a "Personal Outreach" Google Sheet and sends a daily digest email of contacts whose next touch-point is due today or overdue.

- **`exportSentMessages.js`** — Exports all Gmail messages sent in a given year to a Google Sheet and a JSON file. Filters out internal/self-addressed emails.

- **`formRegAppsScript.js`** — Google Forms `onSubmit` trigger that sends a personalised confirmation email to registrants.

---

## `light_crm/`

A Gmail-native lightweight CRM built entirely in Google Apps Script, bound to a Google Sheet.

- **`globals.js`** — Shared constants and column-header definitions used across the CRM scripts.
- **`settings.js`** — User-configurable settings (sheet names, email aliases, etc.).
- **`emailTracking.js`** — Polls Gmail every ~11 minutes to update "Last Contacted" and "Last Incoming" fields for each lead.
- **`mailmerge.js`** — Mail merge from the Leads sheet. Presents a template picker dialog and sends or drafts personalised emails.
- **`aiscript.js`** — GPT-4o powered lead analysis. Reads email threads and returns structured notes and recommended next actions per contact.
- **`triggerScripts.js`** — Installs and manages time-based triggers for the CRM (email tracking, reminders, etc.).
- **`sidebar.html` / `mergeDialog.html`** — UI panels rendered inside Google Sheets for the mail merge and CRM sidebar.
