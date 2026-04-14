#!/usr/bin/env python
"""Quick API test script"""

import asyncio
import requests
import json

async def test_register():
    url = "http://localhost:8000/api/auth/register"
    payload = {
        "full_name": "Test User XYZ",
        "email": "testxyz@example.com",
        "mobile": "7777777777"
    }
    
    print(f"Testing: POST {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, timeout=5)
        print(f"\n✅ Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_register())
