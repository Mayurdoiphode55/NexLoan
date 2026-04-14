#!/usr/bin/env python
"""Test API - Fresh registration"""

import asyncio
import requests
import json
import random

async def test_register():
    url = "http://localhost:8000/api/auth/register"
    
    # Generate unique credentials
    rand = random.randint(1000, 9999)
    payload = {
        "full_name": f"Fresh Test User {rand}",
        "email": f"freshtest{rand}@example.com",
        "mobile": f"{7000000000 + rand}"
    }
    
    print(f"Testing: POST {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}\n")
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"✅ Status: {response.status_code}")
        print(f"Response:\n{json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_register())
