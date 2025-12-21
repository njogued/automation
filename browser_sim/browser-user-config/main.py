from browser_use import Agent, Browser, ChatGoogle
from dotenv import load_dotenv
import asyncio

load_dotenv()

browser = Browser(
    executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    user_data_dir='~/Library/Application Support/Google/Chrome',
    profile_directory='Default',
)

agent = Agent(
    task='Visit https://duckduckgo.com and search for "browser-use founders"',
    browser=browser,
    llm=ChatGoogle(model="gemini-2.5-flash"),
)

async def main():
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
