#!/usr/bin/env python3
"""
Simple test to debug the trainee creation endpoint
"""
import requests
import time

print("Waiting for backend to start...")
time.sleep(3)

# Login
print("Logging in...")
login_res = requests.post('http://localhost:8000/api/auth/login', json={'email': 'admin@fitmate.com', 'password': 'Admin@123'})
if login_res.status_code != 200:
    print(f"Login failed: {login_res.status_code}")
    exit(1)

token = login_res.json()['access_token']
print("✓ Logged in")

# Test trainee creation
print("\nTesting trainee creation...")
payload = {
    'name': 'Debug Test',
    'email': 'debug_test@fitmate.com',
    'phone': '1234567890',
    'password': None,
    'trainer_id': None,
    'membership_plan_id': 2,
    'date_of_birth': '1995-05-15',
    'gender': 'Male',
    'address': '123 Test',
    'emergency_contact_name': 'John',
    'emergency_contact_phone': '9876543210',
    'health_conditions': 'None',
    'fitness_goals': 'Weight loss',
}

res = requests.post(
    'http://localhost:8000/api/admin/members',
    json=payload,
    headers={'Authorization': f'Bearer {token}'}
)

print(f"Status: {res.status_code}")
print(f"Response: {res.text}")

if res.status_code == 200:
    print("\n✅ SUCCESS!")
    print(res.json())
else:
    print(f"\n❌ FAILED with status {res.status_code}")
