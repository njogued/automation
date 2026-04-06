import json
import csv

def to_json(csvFilePath, jsonFilePath):
    data = {}
    with open(csvFilePath, encoding='utf-8') as csvf:
        csvReader = csv.DictReader(csvf)
        count = 0
        for rows in csvReader:
            if 'Index' in rows:
                key = rows['Index']
                data[key] = rows
            else:
                count += 1
                data[count] = rows
    with open(jsonFilePath, 'w', encoding='utf-8') as jsonf:
        jsonf.write(json.dumps(data, indent=4))

def to_csv(csvFilePath, jsonFilePath):
    data = {}
    with open(jsonFilePath, 'r', encoding='utf-8') as jsonf:
        data = json.load(jsonf)
    data_list = list(data.values())
    csv_columns = data_list[0].keys()
    with open(csvFilePath, 'w', encoding='utf-8') as csvf:
        writer = csv.DictWriter(csvf, fieldnames=csv_columns)
        writer.writeheader()
        for row in data_list:
            writer.writerow(row)

if __name__ == "__main__":
    to_csv("leads.csv", "leads_to_enrich.json")