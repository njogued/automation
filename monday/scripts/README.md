# monday-auto

Python scripts for automating Monday.com workflows via the GraphQL API. These cover CRM data enrichment, contact exports, and recurring invoice management.

---

## Setup

### 1. Install Python

**macOS**
```bash
brew install python
```

**Linux (Ubuntu/Debian)**
```bash
sudo apt update && sudo apt install python3 python3-pip
```

**Windows**: Download from [python.org](https://www.python.org/downloads/) and check "Add Python to PATH".

### 2. Install dependencies

```bash
pip3 install requests python-dateutil
```

### 3. Set your API key

All scripts read the Monday.com API key from an environment variable. Set it before running any script:

**macOS / Linux**
```bash
export MONDAY_API_KEY="your_monday_api_key_here"
```

**Windows (Command Prompt)**
```
set MONDAY_API_KEY=your_monday_api_key_here
```

To generate an API key: Monday.com > Profile > Developers > My Access Tokens.

---

## Scripts

---

### `export_contacts.py`

Fetches all contacts from a Monday.com leads board and exports them to both `contacts.json` and `contacts.csv`. Handles pagination automatically using Monday's cursor-based API so it works on boards of any size.

**Fields exported:** name, company, title, email, LinkedIn profile URL.

**Run:**
```bash
python3 export_contacts.py
```

**Output:** `contacts.json` and `contacts.csv` in the same directory.

---

### `enrich_from_crm.py`

Takes a CSV of leads (`leads.csv`) and enriches each row by looking them up in Monday.com by email address. It searches two boards in sequence: first the primary leads board, then a secondary board if not found. On a match, it fills in the lead's name, company, title, and LinkedIn URL, and marks each row as "Found" or "Not Found". Results are written back to the original CSV.

Depends on `csv_to_json.py` for file conversion.

**Input:** `leads.csv` (must have an `email` column)

**Run:**
```bash
python3 enrich_from_crm.py
```

**Output:** `leads.csv` updated in place with enriched fields; intermediate data in `leads_to_enrich.json`.

---

### `monthly_reminder.py`

Automates monthly invoice item management on a Monday.com board. For a given item, it can:

- **Update status**: sets a label column to a specified value (e.g. "6 Months")
- **Advance dates**: reads the current due date and rolls it forward by one month, updating three date columns (`date__1`, `date4`, `expected_collection_date`) simultaneously
- **Rename the item**: updates the item name to reflect the new month (e.g. "Client - April 2026")
- **Duplicate the item**: creates a copy for the next billing cycle, with a guard that skips duplication if the current month is the final invoice month

The `monday_service()` function at the top serves as a shared API wrapper used by all other functions in the file.

**Configure** the target item and board IDs, and the desired status label, directly in the script before running:
```python
item_id = 8189171658
board_id = 6322035412
prev_status = "6 Months"
```

**Run:**
```bash
python3 monthly_reminder.py
```

---

### `csv_to_json.py`

Utility module used by `enrich_from_crm.py`. Provides two reusable functions for converting between CSV and JSON formats while preserving row structure.

- `to_json(csv_path, json_path)`: converts a CSV to a keyed JSON object (uses the `Index` column as key if present, otherwise auto-increments)
- `to_csv(json_path, csv_path)`: converts the JSON back to CSV, preserving all columns

Can also be run standalone to convert `leads_to_enrich.json` back to `leads.csv`:
```bash
python3 csv_to_json.py
```

---

## Notes

- Data files (`*.csv`, `*.json`) are excluded from version control via `.gitignore` as they may contain contact PII.
- The `starting_tests/` subfolder contains exploratory dev scripts and is also excluded from version control.
