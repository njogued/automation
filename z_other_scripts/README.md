# z_other_scripts

Standalone utility scripts that don't belong to a specific project.

---

## Scripts

### `concurrent_img_download.py`

Concurrent image downloader using `ThreadPoolExecutor`. Deduplicates URLs with a thread-safe set, downloads images in parallel, and automatically compresses any file over 5 MB using Pillow (reducing quality iteratively until under the size limit).

### `download_zoom_recordings.py`

Downloads Zoom cloud recordings in bulk via the Zoom OAuth API (Server-to-Server). Handles token refresh, date-range pagination (working around Zoom's 30-day API window), streaming downloads, and filename sanitisation.

---

## Setup

```bash
pip install requests pillow
```

Credentials for `download_zoom_recordings.py` are set directly in the script:

```python
ACCOUNT_ID    = "..."
CLIENT_ID     = "..."
CLIENT_SECRET = "..."
USER_ID       = "..."
FROM_DATE     = "YYYY-MM-DD"
TO_DATE       = "YYYY-MM-DD"
OUT_DIR       = "/path/to/output"
```
