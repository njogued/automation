# Crons

Scheduled scripts that run automatically via cron jobs.

---

## Scripts

### `get_and_send_btc_today.py`

Fetches the current BTC/USD exchange rate from the Coinbase API and emails a summary to a list of recipients. Intended to run daily.

---

## Prerequisites

### 1. Install Python

**macOS**
```bash
brew install python
```
Or download from [python.org](https://www.python.org/downloads/).

**Linux (Ubuntu/Debian)**
```bash
sudo apt update && sudo apt install python3 python3-pip
```

**Windows**
Download and run the installer from [python.org](https://www.python.org/downloads/). Make sure to check "Add Python to PATH" during installation.

Verify installation:
```bash
python3 --version
```

### 2. Install dependencies

```bash
pip3 install requests
```

---

## Configuration

Before running the script, open `get_and_send_btc_today.py` and fill in the following values at the bottom of the file:

```python
sender_email = "you@gmail.com"
sender_password = "your-gmail-app-password"
recipient_emails = ["recipient@example.com"]
```

**Note on Gmail App Password:** Gmail requires an App Password (not your regular Gmail password) for SMTP access. To generate one:

1. Go to your Google Account > Security
2. Enable 2-Step Verification if not already on
3. Go to Security > App Passwords
4. Create a new app password and paste it into `sender_password`

---

## Running manually

```bash
python3 get_and_send_btc_today.py
```

---

## Scheduling with cron (macOS / Linux)

Open the cron editor:
```bash
crontab -e
```

Add a line to run the script daily at 8am:
```
0 8 * * * /usr/bin/python3 /path/to/crons/get_and_send_btc_today.py >> /path/to/crons/logfile.log 2>&1
```

Replace `/path/to/crons/` with the actual path to this folder. The `>> logfile.log 2>&1` part appends output and errors to the log file.

To check your scheduled cron jobs:
```bash
crontab -l
```

---

## Scheduling with Task Scheduler (Windows)

1. Open **Task Scheduler** from the Start menu
2. Click **Create Basic Task**
3. Set the trigger to **Daily** and pick your preferred time
4. For the action, set:
   - **Program:** `python`
   - **Arguments:** `C:\path\to\crons\get_and_send_btc_today.py`
5. Save and enable the task
