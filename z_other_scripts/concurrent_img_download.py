import os
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse
import re
import json
from PIL import Image
from io import BytesIO
import threading

downloaded_urls = set()
url_lock = threading.Lock()

def compress_image(filepath, ext):
    try:
        img = Image.open(filepath)
        img_format = img.format

        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        buffer = BytesIO()
        quality = 85
        while True:
            buffer.seek(0)
            img.save(buffer, format=img_format, quality=quality, optimize=True)
            size_mb = buffer.tell() / (1024 * 1024)
            if size_mb <= 5 or quality <= 40:
                break
            quality -= 5

        with open(filepath, 'wb') as f:
            f.write(buffer.getvalue())

        print(f"Compressed {os.path.basename(filepath)} to {size_mb:.2f} MB at quality={quality}")
    except Exception as e:
        print(f"Compression failed for {filepath}: {e}")

def download_image(image_info, save_dir):
    name, url = next(iter(image_info.items()))
    with url_lock:
        if url in downloaded_urls:
            print(f"Already downloaded URL: {url}")
            return
        downloaded_urls.add(url)
    try:
        parsed_url = urlparse(url)
        _, ext = os.path.splitext(parsed_url.path)
        safe_name = re.sub(r'[^\w\-.]', '_', name)  # Replace unsafe characters with underscore
        filename = f"{safe_name}"
        filepath = os.path.join(save_dir, filename)
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        with open(filepath, 'wb') as f:
            f.write(response.content)
        file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
        if file_size_mb > 5:
            if ext.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                compress_image(filepath, ext)
        print(f"Downloaded: {filename}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

def download_images_concurrently(image_list, save_dir, max_workers=8):
    os.makedirs(save_dir, exist_ok=True)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(download_image, img, save_dir) for img in image_list]
        for future in as_completed(futures):
            pass  # Logging already handled

# Example usage:

if __name__ == "__main__":
    with open("extracted_links.json", "r") as f:
        image_list = json.load(f)
    download_images_concurrently(image_list, "images", max_workers=8)