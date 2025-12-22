from browser_use import Agent, Browser, ChatGoogle
from dotenv import load_dotenv
import asyncio

load_dotenv()

browser = Browser(
    executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    user_data_dir='~/Library/Application Support/Google/Chrome',
    # profile_directory='Profile 3',
    profile_directory='Default',
    headless=True,
)

# initial_actions = [
#     {'open_tab': { 'url': 'https://www.reddit.com/r/KenyaStartups/comments/1pn40u6/comment/nv6o0ia/'}},
# ]

agent = Agent(
    task = "Visit the page mail.superhuman.com and draft a new email to njogued@gmail.com with the subject 'Browser-Use' and the body 'I didn't really send this email'",
    # task = "access the following page 'https://www.reddit.com/r/KenyaStartups/comments/1pn40u6/comment/nv6o0ia/' and say thanks. You will need to find the reply button for the post with the permalink 'permalink='/r/KenyaStartups/comments/1pn40u6/comment/nv6o0ia/' and click on it to open the comment box. Then, write a comment saying 'Thanks!'. Finally, submit the comment by clicking the 'Comment' button.",
    # task = "Visit the page 'https://www.reddit.com/r/KenyaStartups/new.json' and extract the titles and URLs of the latest 5 posts",
    # task = "check my notifications on 'https://www.reddit.com/notifications' and extract the latest 5 notifications",
    # task='Visit "https://www.reddit.com/r/nairobitechies/comments/1ps091i/is_there_more_to_programming_than_web_development/" and write an informative comment based on the post text' \
    # 'As of 2025, the comment aria label is aria-describedby="comment-composer-message-root" and the placeholder text is placeholder="Add your reply". Additionally, the comment button is a type="submit" button with the text "Comment".',,
    browser=browser,
    llm=ChatGoogle(model="gemini-2.5-flash"),
)

async def main():
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
