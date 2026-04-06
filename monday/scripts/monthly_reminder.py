import os
import requests
import json
from datetime import datetime
from dateutil.relativedelta import relativedelta
import time

def monday_service(query, variables=None, *args, **kwargs):
    api_key = os.environ.get("MONDAY_API_KEY")
    url = "https://api.monday.com/v2"
    headers = {
        'Authorization': api_key,
        'Content-Type': 'application/json',
        'API-Version': '2025-01'
    }
    response = requests.post(url, json={"query": query, "variables": variables}, headers=headers)
    if response.status_code != 200:
        print("Error: ", response.json())
    return response

def get_item_details(item_id):
    query = """
        query ($item_id: [ID!]) {
            items (ids: $item_id) {
                id
                name
                column_values {
                    id
                    value
                }
            }
        }
    """

    variables = {"item_id": item_id}

    response = monday_service(query, variables)
    data = response.json()
    items_info = data["data"]["items"][0]
    return items_info

def get_item_status(item_id):
    query = """
    query ($ids: [ID!]) {
        items (ids:[$ids]) {
            column_values {
            ... on StatusValue {
                index
                value
            }
            }
        }
    }"""
    variables = {
        "ids": item_id
    }
    status_vals = monday_service(query, variables)

    return status_vals.json()

def update_item_status(item_id, board_id, prev_status):
    updateSimpleQuery = """
    mutation ($item_id: ID!, $board_id: ID!, $column_id: String!, $value: String!) {
        change_simple_column_value(item_id: $item_id, board_id: $board_id, column_id: $column_id, value: $value) {
            id
        }
    }
    """
    variables = {
        "item_id": item_id,
        "board_id": board_id,
        "column_id": "label_mkk9tq9t",
        "value": prev_status,
    }

    item_details = get_item_details(item_id)

    json_item_details = json.dumps(item_details, indent=4)
    # print("Item details: ", json_item_details)

    status_column_id = "label_mkk9tq9t"
    # Extract current due date and update it
    for column in item_details["column_values"]:
        print("Column: ", column["id"], column["value"])
        print(column["id"] == status_column_id, column["value"] == '"Due Today"')
        print("********************************")
        if column["id"] == status_column_id: # and column["value"] == '"Due Today"':
            variables = {
                "item_id": item_id,
                "board_id": board_id,
                "column_id": status_column_id,
                "value": prev_status,
            }
            update_status_result = monday_service(updateSimpleQuery, variables)
            print("Status update result: ", update_status_result.json())
            break
    return True

def update_item(item_id, board_id, column_id=None, column_value=None):
    updateNameQuery = """
        mutation ($item_id: ID!, $board_id: ID!, $column_values: JSON!) {
            change_multiple_column_values(item_id: $item_id, board_id: $board_id, column_values: $column_values) {
                id
            }
        }
    """
    
    updateSimpleQuery = """
    mutation ($item_id: ID!, $board_id: ID!, $column_id: String!, $value: String!) {
        change_simple_column_value(item_id: $item_id, board_id: $board_id, column_id: $column_id, value: $value) {
            id
        }
    }
    """

    item_details = get_item_details(item_id)
    due_date_column_id = "date__1"

    # Extract current due date and update it
    for column in item_details["column_values"]:
        if column["id"] == due_date_column_id:
            current_due_date_json = column["value"]
            if current_due_date_json:
                # Parse JSON and extract the "date" field
                current_due_date_data = json.loads(current_due_date_json)
                current_due_date = current_due_date_data.get("date")

                if current_due_date:
                    # Parse the date string into a datetime object
                    current_due_date = datetime.strptime(current_due_date, "%Y-%m-%d")

                    # Calculate the next month's date
                    next_month_date = current_due_date + relativedelta(months=1)
                    next_month_date_str = next_month_date.strftime("%Y-%m-%d")

                    # Update the due date
                    variables = {
                        "item_id": item_id,
                        "board_id": board_id,
                        "column_id": "date__1",
                        "value": next_month_date_str,
                    }
                    update_date_result = monday_service(updateSimpleQuery, variables) 
                    print("Date update result: ", update_date_result.json())
                    variables["column_id"] = "date4"
                    update_act_date_result = monday_service(updateSimpleQuery, variables)
                    print("Actual date update result: ", update_act_date_result.json())
                    variables["column_id"] = "expected_collection_date"
                    update_exp_date_result = monday_service(updateSimpleQuery, variables)
                    print("Expected date update result: ", update_exp_date_result.json())

                    # Update the item name
                    next_month_name = next_month_date.strftime("%B")
                    current_year = next_month_date.strftime("%Y")
                    current_name = item_details["name"]
                    client = current_name.split(" - ")[0]
                    new_name = f"{client} - {next_month_name} {current_year}"
                    column_values = json.dumps({"name": new_name})
                    variables = {
                        "item_id": item_id,
                        "board_id": board_id,
                        "column_values": column_values,
                    }
                    update_name_result = monday_service(updateNameQuery, variables)
                    print("Name update result: ", update_name_result.json())

                    return True

def duplicate_item(item_id, board_id):
    query = """
        mutation ($board_id: ID!, $item_id: ID!) {
            duplicate_item (board_id: $board_id, item_id: $item_id, with_updates: true) {
                id
            }
        }
    """

    item_details = get_item_details(item_id)
    final_invoice_column_id = "date_mkkt9vg7"  # Final invoice month column ID

    # Check if the current month is the final invoice month
    for column in item_details["column_values"]:
        if column["id"] == final_invoice_column_id:
            final_invoice_date_json = column["value"]
            if final_invoice_date_json:
                # Parse the JSON string to extract the "date" field
                final_invoice_data = json.loads(final_invoice_date_json)
                final_invoice_date = final_invoice_data.get("date")  # Extract "date"

                if final_invoice_date:
                    final_invoice_date = datetime.strptime(final_invoice_date, "%Y-%m-%d")
                    # Compare the date to the current month and year
                    if final_invoice_date.month == datetime.now().month and final_invoice_date.year == datetime.now().year:
                        print("We are in the final month. Skipping duplication.")
                        return None

    # If not the final month, duplicate the item
    variables = {"item_id": item_id, "board_id": board_id}
    response = monday_service(query, variables)
    if response.status_code == 200:
        data = response.json()
        return data["data"]["duplicate_item"]["id"]
    else:
        print("Error duplicating item:", response.json())
        return None

start = time.time()
output = False
item_id = 8189171658
board_id = 6322035412
prev_status = "6 Months"
item_id = str(item_id)
prev_status = str(prev_status)
board_id = str(board_id)

# update item with previous status
updated = update_item_status(item_id, board_id, prev_status)

# # duplicate item and update it
# duplicated_item_id = duplicate_item(item_id, board_id)
# if duplicated_item_id:
#     update_result = update_item(duplicated_item_id, board_id, prev_status)
#     if update_result:
#         output = True

end = time.time()

print("The time of execution of above program is :",
	(end-start), "s")