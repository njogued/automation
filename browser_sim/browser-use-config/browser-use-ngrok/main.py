import os
import sys
import subprocess
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Security, status
from fastapi.security import APIKeyHeader
import ngrok
import uvicorn

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# 1. Load variables from .env
load_dotenv()

NGROK_TOKEN = os.getenv("NGROK_AUTH_TOKEN")
APP_KEY = os.getenv("APP_API_KEY")

app = FastAPI()

# 2. Define the security header requirement
# This tells FastAPI to look for a header named "X-API-KEY"
api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    if api_key == APP_KEY:
        return api_key
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing API Key",
    )

# 3. Secure your ngrok connection
# We pass the token explicitly so it's not hardcoded
ngrok.set_auth_token(NGROK_TOKEN)
public_url = ngrok.connect(8000)
print(f"ngrok tunnel opened at {public_url}")

@app.get("/")
def read_root(api_key: str = Security(get_api_key)):
    """
    This route is now protected. 
    You must provide X-API-KEY in your headers to see this message.
    """
    return {"message": "Hello, World!", "status": "Authenticated"}

@app.get("/run")
def run_task(api_key: str = Security(get_api_key)):
    """
    An example endpoint that could trigger some task.
    """
    # Here you would add the logic to run your specific task
    script_path = os.path.join(parent_dir, "browser-use-test.py")
    # os.system(f"python3 {script_path}")
    # return {"message": "Task executed successfully!", "status": "Authenticated"}
    try:
        result = subprocess.run(["python3", script_path], capture_output=True, text=True, check=True)
        return {"message": "Task executed successfully!", "output": result.stdout}
    except subprocess.CalledProcessError as e:
        return {"message": "Task execution failed!", "error": e.stderr}

if __name__ == "__main__":
    # uvicorn.run("main:app", host="0.0.0.0", port=8000)
    uvicorn.run(app, host="0.0.0.0", port=8000)