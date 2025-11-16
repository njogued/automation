#!/usr/bin/env python3
# zoom_simple.py
import base64
import pathlib
import re
import requests
from datetime import datetime, date, timedelta

# ------------------ FILL THESE ------------------
ACCOUNT_ID   = "[INSERT ACCOUNT ID HERE]"
CLIENT_ID    = "[INSERT CLIENT ID HERE]"
CLIENT_SECRET= "[INSERT CLIENT SECRET HERE]"
USER_ID      = "[INSERT USER ID HERE]"       # the host/user to pull from
FROM_DATE    = "[SET UP FROM DATE HERE]"                    # YYYY-MM-DD (UTC)
TO_DATE      = "[SET UP TO DATE HERE]"                    # YYYY-MM-DD (UTC)
OUT_DIR      = "[SET UP OUTPUT DIRECTORY HERE]"
# ------------------------------------------------

API_BASE = "https://api.zoom.us/v2"
OAUTH_URL = "https://zoom.us/oauth/token"

def get_token() -> str:
    auth = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    r = requests.post(
        OAUTH_URL,
        headers={"Authorization": f"Basic {auth}"},
        params={"grant_type": "account_credentials", "account_id": ACCOUNT_ID},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["access_token"]

def sanitize(name: str, max_len: int = 150) -> str:
    name = re.sub(r"[\/\\\?\%\*\:\|\"<>\x00-\x1F]", "_", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name[:max_len]

def next_unique_path(path: pathlib.Path) -> pathlib.Path:
    if not path.exists():
        return path
    i = 2
    while True:
        p = path.with_name(f"{path.stem}-{i}{path.suffix}")
        if not p.exists():
            return p
        i += 1

def first_of_month(d: date) -> date:
    return d.replace(day=1)

def add_month(d: date) -> date:
    return (d.replace(day=28) + timedelta(days=4)).replace(day=1)  # next month, portable trick

def month_windows(start_d: date, end_d: date):
    cur = first_of_month(start_d)
    while cur <= end_d:
        next_first = add_month(cur)
        window_end = min(end_d, next_first - timedelta(days=1))
        yield cur.isoformat(), window_end.isoformat()
        cur = next_first

def list_records(token: str, user_id: str, f: str, t: str):
    url = f"{API_BASE}/users/{user_id}/recordings"
    params = {"from": f, "to": t, "page_size": 300}
    next_page = None
    while True:
        if next_page:
            params["next_page_token"] = next_page
        r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, params=params, timeout=60)
        # if token expired, fetch a fresh one once and retry this page
        if r.status_code == 401:
            token = get_token()
            r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, params=params, timeout=60)
        r.raise_for_status()
        data = r.json()
        for m in data.get("meetings", []):
            yield m, token  # return token so caller keeps latest
        next_page = data.get("next_page_token")
        if not next_page:
            break

def download(url: str, dest: pathlib.Path, token: str):
    sep = "&" if "?" in url else "?"
    new_url = f"{url}{sep}access_token={token}"
    tmp = dest.with_suffix(dest.suffix + ".part")
    with requests.get(new_url, stream=True, timeout=120) as r:
        if r.status_code == 401:
            # simplest path: bail; re-run script to continue
            token = get_token()
            download(url, dest, token)
            raise RuntimeError("Token expired during download. Re-run the script.")
        r.raise_for_status()
        with open(tmp, "wb") as f:
            for chunk in r.iter_content(chunk_size=2 * 1024 * 1024):
                if chunk:
                    f.write(chunk)
    if tmp.stat().st_size == 0:
        tmp.unlink(missing_ok=True)
        raise RuntimeError("Downloaded zero bytes.")
    tmp.rename(dest)

def main():
    base = pathlib.Path(OUT_DIR)
    base.mkdir(parents=True, exist_ok=True)

    start_d = datetime.fromisoformat(FROM_DATE).date()
    end_d   = datetime.fromisoformat(TO_DATE).date()

    token = get_token()

    for f, t in month_windows(start_d, end_d):
        for meeting, token in list_records(token, USER_ID, f, t):
            topic = sanitize(meeting.get("topic", "Untitled"))
            new_token = get_token()  # ensure fresh token for downloads
            # use UTC date from start_time
            dt = datetime.fromisoformat(meeting["start_time"].replace("Z", "+00:00")).date()
            folder = base / f"xRecording - {topic} - {dt.isoformat()}"
            folder.mkdir(parents=True, exist_ok=True)

            for rf in meeting.get("recording_files", []) or []:
                rtype = str(rf.get("recording_type", "file")).lower().replace(" ", "_")
                ext   = str(rf.get("file_extension") or rf.get("file_type") or "dat").lower()
                dest  = next_unique_path(folder / sanitize(f"{rtype}.{ext}"))

                dl = rf.get("download_url")
                if not dl:
                    print(f"[skip] no download_url: {dest.name}")
                    continue

                print(f"[get] {folder.name} -> {dest.name}")
                download(dl, dest, new_token)

if __name__ == "__main__":
    main()