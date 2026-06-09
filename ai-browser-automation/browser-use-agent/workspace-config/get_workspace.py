from browser_use_sdk.v3 import AsyncBrowserUse
import asyncio
from task_prompt import TASK
from pydantic import BaseModel, Field
from typing import Literal, Optional

class Codes(BaseModel):
    code: str
    headline: Optional[str] = None
    offer: Optional[str] = None
    last_used: Optional[str] = None
    health_score: Optional[str] = None
    total_uses: Optional[str] = None
    verifications: Optional[int] = None
    detail_snippet: Optional[str] = None

class CodesList(BaseModel):
    status: Literal["codes_found", "no_codes_found", "no_page_found"]
    canonical_url: str
    codes: list[Codes] = Field(default_factory=list)

client = AsyncBrowserUse()

async def get_workspace_files(workspace_id: str):
    files = await client.workspaces.files(workspace_id)
    for f in files.files:
        print(f.path, f.size)

async def setup_recurring_task(task: str):
    result = await client.run(task, workspace_id=str("4ba2cce6-b2f3-4d97-b6f7-1e85d412e8c2"), model="gpt-5.4-mini", output_schema=CodesList)
    print(result)

async def main():
    workspace_id = "4ba2cce6-b2f3-4d97-b6f7-1e85d412e8c2"
    workspace = await client.workspaces.get(workspace_id)
    # print(workspace)
    # await get_workspace_files(workspace_id)
    await setup_recurring_task(TASK)

if __name__ == "__main__":
    asyncio.run(main())