import requests
import json
import os
from automation.monday.scripts.csv_to_json import to_json, to_csv

def create_new_lead(headers, url, lead_info, lead_name):
    mutation = """
    mutation ($board_id: ID!, $group_id: String!, $item_name: String!, $column_values: JSON!) {
        create_item (board_id: $board_id, group_id: $group_id, item_name: $item_name, column_values: $column_values) {
            id
        }
    }
    """

    column_values = {}

    if 'New Email' in lead_info and lead_info['New Email'] != "":
        column_values['lead_email'] = {"email": lead_info['New Email'], "text": lead_info['New Email']}
    
    if 'New Company' in lead_info and lead_info['New Company'] != "":
        column_values['lead_company'] = lead_info['New Company']

    if 'New Title' in lead_info and lead_info['New Title'] != "":
        column_values['text'] = lead_info['New Title']

    if 'LinkedIn Profile' in lead_info and lead_info['LinkedIn Profile'] != "":
        column_values['linkedin_profile__1'] = lead_info['LinkedIn Profile']

    # column_values['lead_status'] = "Updated Record"

    if 'Temp' in lead_info and lead_info['Temp'] != "":
        column_values['status_12__1'] = lead_info["Temp"]

    column_values = json.dumps(column_values)

    variables = {
        'board_id': str(6322035430),
        'group_id': "topics",
        'item_name': lead_name,
        'column_values': column_values
    }

    data = {
        "query": mutation,
        "variables": variables
    }

    response = requests.post(url, json=data, headers=headers)
    data = response.json()
    print(data)
    return

def mutate_cols(headers, url, item_id, lead_info, lead_name):

    mutation = """
    mutation ($item_id: ID!, $board_id: ID!, $column_values: JSON!) {
        change_multiple_column_values (item_id: $item_id, board_id: $board_id, column_values: $column_values) {
            id
            name
        }
    }
    """

    column_values = {}

    # if 'New Email' in lead_info and lead_info['New Email'] != "":
    #     column_values['lead_email'] = {"email": lead_info['New Email'], "text": lead_info['New Email']}
    
    # if 'New Company' in lead_info and lead_info['New Company'] != "":
    #     column_values['lead_company'] = lead_info['New Company']

    # if 'New Title' in lead_info and lead_info['New Title'] != "":
    #     column_values['text'] = lead_info['New Title']

    # if 'LinkedIn Profile' in lead_info and lead_info['LinkedIn Profile'] != "":
    #     column_values['linkedin_profile__1'] = lead_info['LinkedIn Profile']
    
    # column_values['name']  = lead_name

    column_values['status_14__1'] = "Contacted"

    # if 'Temp' in lead_info and lead_info['Temp'] != "":
    #     column_values['status_12__1'] = lead_info["Temp"]

    column_values = json.dumps(column_values)

    variables = {
        'item_id': str(item_id),
        'board_id': str(6322035430),
        "column_values": column_values
    }

    data = {
        "query": mutation,
        "variables": variables
    }

    response = requests.post(url, json=data, headers=headers)
    data = response.json()
    print(data)
    return

def get_vals(headers, url, lead_info, lead_name, search_col):
    query = """
        query ($board_id: ID!, $email: String!, $column_id: String!) {
            items_page_by_column_values(limit: 5, board_id: $board_id, columns: [{column_id: $column_id, column_values: [$email]}]) {
                cursor
                items {
                    id
                    name
                }
            }
        }
    """
    variables = {
        'board_id': str(6322035430),
        'column_id': search_col,
        'email': lead_info['Email']
    }

    data = {
        "query": query,
        "variables": variables
    }

    response = requests.post(url, json=data, headers=headers)
    data = response.json()
    # print(data['data']['items_page_by_column_values']['items'][0]['column_values'][0]['text'])
    # print(data)

    if response.status_code == 200:
        #  and data['data']['items_page_by_column_values']['items'][0]['column_values'][0]['text'] == ""
        try:
            item_id = str(data['data']['items_page_by_column_values']['items'][0]['id'])
            mutate_cols(headers, url, item_id, lead_info, lead_name)
            if search_col == "personal_email__1":
                print("/n")
                print(f"Lead: {lead_name} found with alt email. Update to main")
                print("/n")
        except Exception as e:
            if search_col == "lead_email":
                get_vals(headers, url, lead_info, lead_name, "personal_email__1")
            else:
                print("/n")
                print(f"Lead: {lead_name} not found")
                print("/n")
                return
                create_new_lead(headers, url, lead_info, lead_name)
            return      
    return

def main():
    # leads to update json file: use hash in csv2json with name as key
    to_json("updateleads.csv", "leads_to_update.json")
    with open("leads_to_update.json", "r") as leads_json:
        leads_data = json.load(leads_json)
    api_key = os.environ.get("MONDAY_API_KEY")
    url = "https://api.monday.com/v2"
    headers = {
        'Authorization': api_key,
        'Content-Type': 'application/json',
        'API-Version': '2023-10'
    }
    for i in leads_data:
        print('\n')
        # if "No Entry" in leads_data[i]['Email']:
        #     continue
        get_vals(headers, url, leads_data[i], i, "lead_email")
    with open("leads_to_update.json", "w") as leads_json:
        json.dump(leads_data, leads_json, indent=4)
    to_csv("updateleads.csv", "leads_to_update.json")

if __name__ == "__main__":
    main()