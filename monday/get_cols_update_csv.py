import requests
import json
from csv_to_json import to_json, to_csv

def get_update_json(headers, url, lead_info, lead_email, search_col, board_id):
    query = """
        query ($board_id: ID!, $email: String!, $column_id: String!) {
            items_page_by_column_values(limit: 5, board_id: $board_id, columns: [{column_id: $column_id, column_values: [$email]}]) {
                cursor
                items {
                    id
                    name
                    column_values(ids: ["text", "lead_company", "linkedin_profile__1"]) {
                        id
                        value
                        }
                    }
                }
            }
        """
 
    variables = {
        'board_id': str(board_id),
        'column_id': str(search_col),
        'email': lead_info['email']
    }

    data = {
        "query": query,
        "variables": variables
    }

    response = requests.post(url, json=data, headers=headers)
    data = response.json()
    if response.status_code == 200:
        try:
            lead_info["Name"] = str(data['data']['items_page_by_column_values']['items'][0]['name']).strip('"')
            if lead_info["Company"] == "" or not lead_info["Company"]:
                lead_info["Company"] = str(data['data']['items_page_by_column_values']['items'][0]['column_values'][0]['value']).strip('"')
            lead_info["Title"] = str(data['data']['items_page_by_column_values']['items'][0]['column_values'][1]['value']).strip('"')
            lead_info["Linkedin Profile"] = str(data['data']['items_page_by_column_values']['items'][0]['column_values'][2]['value']).strip('"')
            lead_info["Temp"] = "Found"
            print("We have a live one!")
            # item_id = str(data['data']['items_page_by_column_values']['items'][0]['column_values'])
            # print(item_id)
        except IndexError:
            if search_col == "lead_email" and board_id == 6322035430:
                get_update_json(headers, url, lead_info, lead_email, "personal_email__1", 6322035430)
            else:
                lead_info["Temp"] = "Not Found"
                print("No luck here")
                return     
    else:
        print("Error")
        return

def main():
    to_json("leads.csv", "leads_to_enrich.json")
    with open("leads_to_enrich.json", "r") as leads_json:
        leads_data = json.load(leads_json)
    api_key = "[INSERT YOUR MONDAY.COM API KEY HERE]"
    url = "https://api.monday.com/v2"
    headers = {
        'Authorization': api_key,
        'Content-Type': 'application/json',
        'API-Version': '2025-10'
    }
    print("\n")
    count = 0
    for i in leads_data:
        count += 1
        print(f"Processing lead {count}")
        get_update_json(headers, url, leads_data[i], i, "lead_email", 6322035430)
        if leads_data[i]["Temp"] == "Not Found":
            # https://storiedinc.monday.com/boards/6490395247
            get_update_json(headers, url, leads_data[i], i, "lead_email", 6490395247)
        # print(leads_data[i])
    with open("leads_to_enrich.json", "w") as leads_json:
        json.dump(leads_data, leads_json, indent=4)
    to_csv("leads.csv", "leads_to_enrich.json")

if __name__ == "__main__":
    main()