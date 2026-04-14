import asyncio
from app.utils.database import AsyncSessionLocal
from sqlalchemy import text

async def f():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT mobile FROM users"))
        print(res.fetchall())

if __name__ == "__main__":
    asyncio.run(f())
