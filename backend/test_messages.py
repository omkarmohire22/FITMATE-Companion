#!/usr/bin/env python
"""Test script for admin messages endpoints"""

import requests
import json
from requests.exceptions import RequestException

BASE_URL = "http://localhost:8000/api"

def test_messages_endpoints():
    """Test the messages inbox and outbox endpoints"""
    
    print("\n" + "="*60)
    print("Testing Admin Messages Endpoints")
    print("="*60)
    
    # Test 1: Get admin inbox
    print("\n[TEST 1] GET /admin/messages/inbox")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/messages/inbox",
            headers={"Authorization": "Bearer test-token"}  # You may need actual token
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ SUCCESS - Got {len(data.get('messages', []))} messages")
            print(json.dumps(data, indent=2)[:500])
        else:
            print(f"✗ FAILED - {response.status_code}")
            print(response.text[:500])
    except RequestException as e:
        print(f"✗ ERROR: {e}")
    
    # Test 2: Get admin outbox
    print("\n[TEST 2] GET /admin/messages/outbox")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/messages/outbox",
            headers={"Authorization": "Bearer test-token"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ SUCCESS - Got {len(data.get('messages', []))} messages")
            print(json.dumps(data, indent=2)[:500])
        else:
            print(f"✗ FAILED - {response.status_code}")
            print(response.text[:500])
    except RequestException as e:
        print(f"✗ ERROR: {e}")
    
    print("\n" + "="*60)
    print("Tests complete!")
    print("="*60 + "\n")

if __name__ == "__main__":
    test_messages_endpoints()
