import requests
import json
import os

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
    
    if 'Company' in lead_info and lead_info['Company'] != "":
        column_values['lead_company'] = lead_info['Company']

    if 'Title' in lead_info and lead_info['Title'] != "":
        column_values['text'] = lead_info['Title']

    if 'Temp' in lead_info and lead_info['Temp'] != "":
        column_values['label__1'] = lead_info["Temp"]

    column_values = json.dumps(column_values)

    variables = {
        'item_id': str(item_id),
        'board_id': str(6490395247),
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
        'board_id': str(6490395247),
        'column_id': search_col,
        'email': lead_info['Email']
    }

    data = {
        "query": query,
        "variables": variables
    }

    response = requests.post(url, json=data, headers=headers)
    data = response.json()

    if response.status_code == 200:
        try:
            item_id = str(data['data']['items_page_by_column_values']['items'][0]['id'])
            mutate_cols(headers, url, item_id, lead_info, lead_name)
        except Exception as e:
            print("Failed to update. How?!")
            return      
    return

def main():
    # leads to update json file: use hash in csv2json with name as key
    leads_json = open("leads_to_enrich.json", "r")
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
        get_vals(headers, url, leads_data[i], i, "lead_email")
    leads_json.close()

if __name__ == "__main__":
    main()