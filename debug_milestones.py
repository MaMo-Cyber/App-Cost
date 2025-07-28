#!/usr/bin/env python3
"""
Debug script for milestone endpoints
"""

import requests
import json
from datetime import datetime, date

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
API_URL = f"{BASE_URL}/api"
print(f"🔗 Testing API at: {API_URL}")

def make_request(method, endpoint, data=None):
    """Make HTTP request with error handling"""
    url = f"{API_URL}{endpoint}"
    try:
        if method == 'GET':
            response = requests.get(url, timeout=30)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=30)
        elif method == 'PUT':
            response = requests.put(url, json=data, timeout=30)
        elif method == 'DELETE':
            response = requests.delete(url, timeout=30)
        
        print(f"  {method} {endpoint} -> {response.status_code}")
        
        if response.status_code >= 400:
            print(f"    Error: {response.text}")
            return None, response.status_code
            
        return response.json() if response.content else {}, response.status_code
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Request failed: {e}")
        return None, 500

# First, get a project ID
print("\n🔍 Getting project ID...")
projects, status = make_request('GET', '/projects')
if status == 200 and projects:
    project_id = projects[0]['id']
    print(f"  ✅ Using project ID: {project_id}")
else:
    print("  ❌ Could not get project ID")
    exit(1)

# Test milestone creation
print("\n🔍 Testing milestone creation...")
milestone_data = {
    "project_id": project_id,
    "name": "Debug Test Milestone",
    "description": "Testing milestone creation",
    "milestone_date": "2025-03-15",
    "is_critical": True
}

milestone, status = make_request('POST', '/milestones', milestone_data)
if status == 200:
    print(f"  ✅ Created milestone successfully")
    print(f"  📋 Response: {json.dumps(milestone, indent=2)}")
    milestone_id = milestone.get('id')
    print(f"  🆔 Milestone ID: {milestone_id}")
else:
    print("  ❌ Failed to create milestone")
    exit(1)

# Test getting project milestones
print(f"\n🔍 Testing get project milestones...")
milestones, status = make_request('GET', f'/projects/{project_id}/milestones')
if status == 200:
    print(f"  ✅ Retrieved {len(milestones)} milestones")
    for i, m in enumerate(milestones):
        print(f"    {i+1}. ID: {m.get('id')}, Name: {m.get('name')}, Date: {m.get('milestone_date')}")
else:
    print("  ❌ Failed to get project milestones")

# Test milestone update
print(f"\n🔍 Testing milestone update...")
update_data = {
    "name": "Debug Test Milestone - Updated",
    "milestone_date": "2025-03-20"
}

updated_milestone, status = make_request('PUT', f'/milestones/{milestone_id}', update_data)
if status == 200:
    print(f"  ✅ Updated milestone successfully")
    print(f"  📋 Response: {json.dumps(updated_milestone, indent=2)}")
else:
    print(f"  ❌ Failed to update milestone with ID: {milestone_id}")

# Test milestone deletion
print(f"\n🔍 Testing milestone deletion...")
delete_result, status = make_request('DELETE', f'/milestones/{milestone_id}')
if status == 200:
    print(f"  ✅ Deleted milestone successfully")
else:
    print(f"  ❌ Failed to delete milestone with ID: {milestone_id}")