#!/usr/bin/env python
"""Check database contents"""

import asyncio
import os
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:T8JWC1DR9OULVLVy@db.alurshsogvsedsjapqfi.supabase.co:5432/postgres")

async def check_db():
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    async_session = sessionmaker(engine, class_=AsyncSession)
    
    async with async_session() as session:
        try:
            # Check if users table exists
            result = await session.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            print(f"✅ Users table exists with {count} records")
            
            # List all users
            result = await session.execute(text("SELECT id, email, mobile, created_at FROM users LIMIT 10"))
            rows = result.fetchall()
            for row in rows:
                print(f"  - Email: {row[1]}, Mobile: {row[2]}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())
