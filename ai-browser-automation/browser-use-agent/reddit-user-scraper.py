import requests

def get_main_post(url):
    response = requests.post(url)
    return response.json()

def get_user_posts(url):
    response = requests.get(url)
    return response.json()

if __name__ == "__main__":
    url = "https://www.reddit.com/user/freecashhowie.json"
