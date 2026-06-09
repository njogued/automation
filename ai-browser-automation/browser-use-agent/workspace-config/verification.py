from browser_use_sdk.v3 import AsyncBrowserUse
import asyncio
from verification_prompt import PROMPT
from pydantic import BaseModel, Field
from typing import Literal, Optional

class VerificationResult(BaseModel):
    code: str
    verification_status: Literal["verified", "not working"]
    error_message: Optional[str] = None

class VerificationResultsList(BaseModel):
    verification_results: list[VerificationResult] = Field(default_factory=list)

client = AsyncBrowserUse()

async def verify_codes(task: str):
    result = await client.run(task, workspace_id=str("4ba2cce6-b2f3-4d97-b6f7-1e85d412e8c2"), model="gpt-5.4-mini", output_schema=VerificationResultsList)
    print(result)

async def main():
    await verify_codes(PROMPT)

if __name__ == "__main__":
    asyncio.run(main())