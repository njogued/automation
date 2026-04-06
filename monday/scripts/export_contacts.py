import os
import requests
import json
import csv

# === CONFIGURATION ===
API_KEY = os.environ.get("MONDAY_API_KEY")
BOARD_ID = "6490395247"
API_URL = "https://api.monday.com/v2"
HEADERS = {
    "Authorization": API_KEY,
    "Content-Type": "application/json"
}

# === GRAPHQL QUERIES ===
INITIAL_QUERY = """
query ($board_id: ID!) {
  boards(ids: [$board_id]) {
    items_page(limit: 500) {
      cursor
      items {
        name
        column_values {
          id
          text
        }
      }
    }
  }
}
"""

NEXT_QUERY = """
query ($cursor: String!) {
  next_items_page(limit: 500, cursor: $cursor) {
    cursor
    items {
      name
      column_values {
        id
        text
      }
    }
  }
}
"""

# === CONTACT PARSER ===
def extract_contact_info(item):
    columns = {col['id']: col['text'] for col in item['column_values']}
    return {
        "name": item['name'],
        "company": columns.get("lead_company", ""),
        "title": columns.get("text", ""),
        "email": columns.get("lead_email", ""),
        "linkedin": columns.get("linkedin_profile__1", "")
    }

# === FETCH CONTACTS ===
def fetch_all_contacts():
    results = []

    # Initial fetch
    response = requests.post(API_URL, headers=HEADERS, json={"query": INITIAL_QUERY, "variables": {"board_id": BOARD_ID}})
    data = response.json()
    page = data['data']['boards'][0]['items_page']
    results.extend([extract_contact_info(item) for item in page['items']])
    cursor = page['cursor']

    # Pagination
    while cursor:
        response = requests.post(API_URL, headers=HEADERS, json={"query": NEXT_QUERY, "variables": {"cursor": cursor}})
        data = response.json()
        page = data['data']['next_items_page']
        results.extend([extract_contact_info(item) for item in page['items']])
        cursor = page['cursor']

    return results

# === MAIN EXECUTION ===
if __name__ == "__main__":
    contacts = fetch_all_contacts()

    # Save to JSON
    with open("contacts.json", "w") as f:
        json.dump(contacts, f, indent=2)
    print(f"Saved {len(contacts)} contacts to contacts.json")

    # Save to CSV
    with open("contacts.csv", "w", newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["name", "company", "title", "email", "linkedin"])
        writer.writeheader()
        writer.writerows(contacts)
    print(f"Saved {len(contacts)} contacts to contacts.csv")
