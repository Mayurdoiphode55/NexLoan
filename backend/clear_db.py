#!/usr/bin/env python
"""Clear test data from database"""

import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:T8JWC1DR9OULVLVy@db.alurshsogvsedsjapqfi.supabase.co:5432/postgres")

async def clear_db():
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    async_session = sessionmaker(engine, class_=AsyncSession)
    
    async with async_session() as session:
        try:
            # Delete all users (cascade will delete related loans, etc)
            await session.execute(text("DELETE FROM users"))
            await session.commit()
            print("✅ Cleared all users from database")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(clear_db())
