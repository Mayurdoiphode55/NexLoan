#!/usr/bin/env python
"""Comprehensive backend & frontend test"""

import asyncio
import requests
import json

async def test_backend():
    print("=" * 60)
    print("🧪 TESTING BACKEND — NexLoan API")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # Test 1: Health Check
    print("\n1️⃣  Testing Health Check Endpoint")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Response: {response.json()}")
        else:
            print(f"   ❌ Health check failed")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Register
    print("\n2️⃣  Testing User Registration")
    import random
    rand = random.randint(1000, 9999)
    payload = {
        "full_name": f"Test User {rand}",
        "email": f"test{rand}@example.com",
        "mobile": f"{7000000000 + rand}"
    }
    try:
        response = requests.post(
            f"{base_url}/api/auth/register",
            json=payload,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        result = response.json()
        if response.status_code == 201:
            print(f"   ✅ User registered: {result.get('user_id')}")
            print(f"   📧 OTP should be sent to: {result.get('email')}")
        else:
            print(f"   ⚠️  Response: {result}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 60)

async def test_frontend():
    print("=" * 60)
    print("🧪 TESTING FRONTEND — Next.js App")
    print("=" * 60)
    
    base_url = "http://localhost:3000"
    
    print("\n1️⃣  Testing Frontend App")
    try:
        response = requests.get(base_url, timeout=5, allow_redirects=False)
        print(f"   Status: {response.status_code}")
        if response.status_code in [200, 307, 308]:
            print(f"   ✅ Frontend is responding")
            if "<!DOCTYPE" in response.text or "<html" in response.text.lower():
                print(f"   ✅ HTML content found")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Frontend not accessible: {e}")
    
    print("\n" + "=" * 60)

async def main():
    await test_backend()
    await test_frontend()
    print("\n📋 TEST SUMMARY")
    print("=" * 60)
    print("Backend API: http://localhost:8000")
    print("Frontend App: http://localhost:3000")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
