#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Project Cost Tracking App
Tests all backend endpoints with realistic data scenarios
"""

import requests
import json
from datetime import datetime, date, timedelta
import sys
import os

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
if not BASE_URL:
    print("❌ Could not get backend URL from frontend/.env")
    sys.exit(1)

API_URL = f"{BASE_URL}/api"
print(f"🔗 Testing API at: {API_URL}")

# Test data storage
test_data = {
    'project_id': None,
    'phase_ids': [],
    'category_ids': [],
    'cost_entry_ids': []
}

def make_request(method, endpoint, data=None, params=None):
    """Make HTTP request with error handling"""
    url = f"{API_URL}{endpoint}"
    try:
        if method == 'GET':
            response = requests.get(url, params=params, timeout=30)
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

def test_api_root():
    """Test API root endpoint"""
    print("\n🧪 Testing API Root")
    data, status = make_request('GET', '/')
    if status == 200 and data and 'message' in data:
        print("  ✅ API root accessible")
        return True
    else:
        print("  ❌ API root failed")
        return False

def test_initialize_default_categories():
    """Test initializing default cost categories"""
    print("\n🧪 Testing Default Categories Initialization")
    data, status = make_request('POST', '/initialize-default-categories')
    if status == 200:
        print("  ✅ Default categories initialized")
        return True
    else:
        print("  ❌ Failed to initialize default categories")
        return False

def test_cost_categories():
    """Test cost category management"""
    print("\n🧪 Testing Cost Category Management")
    
    # Get existing categories
    categories, status = make_request('GET', '/cost-categories')
    if status != 200:
        print("  ❌ Failed to get cost categories")
        return False
    
    print(f"  ✅ Retrieved {len(categories)} cost categories")
    
    # Store category IDs for later use
    if categories:
        test_data['category_ids'] = [cat['id'] for cat in categories[:3]]  # Use first 3
        print(f"  📝 Stored category IDs: {len(test_data['category_ids'])}")
    
    # Create a custom category
    custom_category = {
        "name": "Testing Equipment",
        "type": "material",
        "description": "Equipment for testing purposes",
        "default_rate": None
    }
    
    new_category, status = make_request('POST', '/cost-categories', custom_category)
    if status == 200 and new_category:
        print("  ✅ Created custom cost category")
        test_data['category_ids'].append(new_category['id'])
        return True
    else:
        print("  ❌ Failed to create custom category")
        return False

def test_project_crud():
    """Test project CRUD operations"""
    print("\n🧪 Testing Project CRUD Operations")
    
    # Create project
    project_data = {
        "name": "Mobile App Development",
        "description": "Development of a cross-platform mobile application for inventory management",
        "total_budget": 150000.0,
        "start_date": "2024-01-15",
        "end_date": "2024-06-30"
    }
    
    project, status = make_request('POST', '/projects', project_data)
    if status != 200 or not project:
        print("  ❌ Failed to create project")
        return False
    
    test_data['project_id'] = project['id']
    print(f"  ✅ Created project: {project['name']}")
    
    # Get all projects
    projects, status = make_request('GET', '/projects')
    if status != 200:
        print("  ❌ Failed to get projects")
        return False
    
    print(f"  ✅ Retrieved {len(projects)} projects")
    
    # Get specific project
    single_project, status = make_request('GET', f'/projects/{test_data["project_id"]}')
    if status != 200 or not single_project:
        print("  ❌ Failed to get specific project")
        return False
    
    print(f"  ✅ Retrieved project: {single_project['name']}")
    
    # Update project
    update_data = {
        "name": "Mobile App Development - Updated",
        "description": "Updated description with additional features",
        "total_budget": 175000.0,
        "start_date": "2024-01-15",
        "end_date": "2024-07-15"
    }
    
    updated_project, status = make_request('PUT', f'/projects/{test_data["project_id"]}', update_data)
    if status != 200 or not updated_project:
        print("  ❌ Failed to update project")
        return False
    
    print(f"  ✅ Updated project budget to ${updated_project['total_budget']:,.2f}")
    return True

def test_phase_management():
    """Test phase management system"""
    print("\n🧪 Testing Phase Management")
    
    if not test_data['project_id']:
        print("  ❌ No project ID available for phase testing")
        return False
    
    # Create phases
    phases_data = [
        {
            "project_id": test_data['project_id'],
            "name": "Planning & Design",
            "description": "Initial planning, requirements gathering, and UI/UX design",
            "budget_allocation": 35000.0,
            "start_date": "2024-01-15",
            "end_date": "2024-02-28"
        },
        {
            "project_id": test_data['project_id'],
            "name": "Development",
            "description": "Core application development and testing",
            "budget_allocation": 95000.0,
            "start_date": "2024-03-01",
            "end_date": "2024-05-31"
        },
        {
            "project_id": test_data['project_id'],
            "name": "Deployment & Launch",
            "description": "Final testing, deployment, and launch activities",
            "budget_allocation": 45000.0,
            "start_date": "2024-06-01",
            "end_date": "2024-07-15"
        }
    ]
    
    for phase_data in phases_data:
        phase, status = make_request('POST', '/phases', phase_data)
        if status != 200 or not phase:
            print(f"  ❌ Failed to create phase: {phase_data['name']}")
            return False
        
        test_data['phase_ids'].append(phase['id'])
        print(f"  ✅ Created phase: {phase['name']}")
    
    # Get project phases
    phases, status = make_request('GET', f'/projects/{test_data["project_id"]}/phases')
    if status != 200:
        print("  ❌ Failed to get project phases")
        return False
    
    print(f"  ✅ Retrieved {len(phases)} phases for project")
    
    # Update phase status
    if test_data['phase_ids']:
        status_update, status_code = make_request('PUT', f'/phases/{test_data["phase_ids"][0]}/status', {"status": "in_progress"})
        if status_code != 200:
            print("  ❌ Failed to update phase status")
            return False
        
        print("  ✅ Updated phase status to in_progress")
    
    return True

def test_cost_entries():
    """Test cost entry system with calculations and date serialization fix"""
    print("\n🧪 Testing Cost Entry System with Date Serialization")
    
    if not test_data['project_id'] or not test_data['category_ids']:
        print("  ❌ Missing project ID or category IDs for cost entry testing")
        return False
    
    # Test 1: Cost entry with string date format (YYYY-MM-DD) - Outstanding status with due_date
    print("  🔍 Testing cost entry with string date and outstanding status...")
    outstanding_entry = {
        "project_id": test_data['project_id'],
        "phase_id": test_data['phase_ids'][0] if test_data['phase_ids'] else None,
        "category_id": test_data['category_ids'][0],
        "description": "Senior developer work on authentication module",
        "hours": 40.0,
        "hourly_rate": 85.0,
        "entry_date": "2024-02-15",  # String date format
        "status": "outstanding",
        "due_date": "2024-03-15"  # Due date for outstanding payment
    }
    
    entry1, status = make_request('POST', '/cost-entries', outstanding_entry)
    if status != 200 or not entry1:
        print(f"  ❌ Failed to create outstanding cost entry with string dates - Status: {status}")
        return False
    
    expected_total = outstanding_entry['hours'] * outstanding_entry['hourly_rate']
    if abs(entry1['total_amount'] - expected_total) > 0.01:
        print(f"  ❌ Hourly calculation incorrect: expected {expected_total}, got {entry1['total_amount']}")
        return False
    
    # Verify date fields are properly handled
    if not entry1.get('entry_date') or not entry1.get('due_date'):
        print("  ❌ Date fields missing in response")
        return False
    
    test_data['cost_entry_ids'].append(entry1['id'])
    print(f"  ✅ Created outstanding entry: ${entry1['total_amount']:,.2f} (40h × $85/h) - Due: {entry1.get('due_date')}")
    
    # Test 2: Cost entry with paid status (no due_date needed)
    print("  🔍 Testing cost entry with paid status...")
    paid_entry = {
        "project_id": test_data['project_id'],
        "phase_id": test_data['phase_ids'][1] if len(test_data['phase_ids']) > 1 else None,
        "category_id": test_data['category_ids'][1] if len(test_data['category_ids']) > 1 else test_data['category_ids'][0],
        "description": "Development hardware and testing devices",
        "quantity": 5.0,
        "unit_price": 1200.0,
        "entry_date": "2024-03-10",  # String date format
        "status": "paid"  # Paid status, no due_date needed
    }
    
    entry2, status = make_request('POST', '/cost-entries', paid_entry)
    if status != 200 or not entry2:
        print(f"  ❌ Failed to create paid cost entry - Status: {status}")
        return False
    
    expected_total = paid_entry['quantity'] * paid_entry['unit_price']
    if abs(entry2['total_amount'] - expected_total) > 0.01:
        print(f"  ❌ Material calculation incorrect: expected {expected_total}, got {entry2['total_amount']}")
        return False
    
    test_data['cost_entry_ids'].append(entry2['id'])
    print(f"  ✅ Created paid entry: ${entry2['total_amount']:,.2f} (5 × $1,200) - Status: {entry2.get('status')}")
    
    # Test 3: Cost entry with different date format variations
    print("  🔍 Testing cost entry with current date (no entry_date specified)...")
    current_date_entry = {
        "project_id": test_data['project_id'],
        "phase_id": test_data['phase_ids'][2] if len(test_data['phase_ids']) > 2 else None,
        "category_id": test_data['category_ids'][2] if len(test_data['category_ids']) > 2 else test_data['category_ids'][0],
        "description": "Software licenses and deployment costs",
        "total_amount": 2500.0,
        "status": "outstanding",
        "due_date": "2024-07-01"
        # No entry_date specified - should default to today
    }
    
    entry3, status = make_request('POST', '/cost-entries', current_date_entry)
    if status != 200 or not entry3:
        print(f"  ❌ Failed to create cost entry with default date - Status: {status}")
        return False
    
    test_data['cost_entry_ids'].append(entry3['id'])
    print(f"  ✅ Created entry with default date: ${entry3['total_amount']:,.2f} - Entry Date: {entry3.get('entry_date')}")
    
    # Test 4: Verify all entries are retrievable
    print("  🔍 Verifying all cost entries are retrievable...")
    entries, status = make_request('GET', f'/projects/{test_data["project_id"]}/cost-entries')
    if status != 200:
        print("  ❌ Failed to get project cost entries")
        return False
    
    print(f"  ✅ Retrieved {len(entries)} cost entries for project")
    
    # Test 5: Test outstanding and paid entry filtering
    print("  🔍 Testing outstanding entries filtering...")
    outstanding_entries, status = make_request('GET', f'/projects/{test_data["project_id"]}/cost-entries/outstanding')
    if status != 200:
        print("  ❌ Failed to get outstanding cost entries")
        return False
    
    print(f"  ✅ Retrieved {len(outstanding_entries)} outstanding entries")
    
    print("  🔍 Testing paid entries filtering...")
    paid_entries, status = make_request('GET', f'/projects/{test_data["project_id"]}/cost-entries/paid')
    if status != 200:
        print("  ❌ Failed to get paid cost entries")
        return False
    
    print(f"  ✅ Retrieved {len(paid_entries)} paid entries")
    
    # Test 6: Test payment timeline endpoint
    print("  🔍 Testing payment timeline...")
    timeline, status = make_request('GET', f'/projects/{test_data["project_id"]}/payment-timeline')
    if status != 200:
        print("  ❌ Failed to get payment timeline")
        return False
    
    print(f"  ✅ Retrieved payment timeline with {len(timeline.get('timeline_data', {}).get('overdue', []))} overdue items")
    
    return True

def test_project_analytics():
    """Test project analytics and summary"""
    print("\n🧪 Testing Project Analytics & Summary")
    
    if not test_data['project_id']:
        print("  ❌ No project ID available for analytics testing")
        return False
    
    # Get project summary
    summary, status = make_request('GET', f'/projects/{test_data["project_id"]}/summary')
    if status != 200 or not summary:
        print("  ❌ Failed to get project summary")
        return False
    
    print(f"  ✅ Project Summary Retrieved:")
    print(f"    💰 Total Spent: ${summary['total_spent']:,.2f}")
    print(f"    💳 Budget Remaining: ${summary['budget_remaining']:,.2f}")
    print(f"    📊 Budget Utilization: {summary['budget_utilization']:.1f}%")
    print(f"    🚦 Status: {summary['status_indicator']}")
    print(f"    📈 Phases: {len(summary['phases_summary'])}")
    print(f"    🏷️ Cost Categories: {len(summary['cost_breakdown'])}")
    print(f"    📅 Trend Data Points: {len(summary['trend_data'])}")
    
    # Validate calculations
    if summary['total_spent'] <= 0:
        print("  ❌ Total spent should be greater than 0")
        return False
    
    expected_remaining = summary['project']['total_budget'] - summary['total_spent']
    if abs(summary['budget_remaining'] - expected_remaining) > 0.01:
        print("  ❌ Budget remaining calculation incorrect")
        return False
    
    print("  ✅ Budget calculations are correct")
    
    # Check phases summary
    if summary['phases_summary']:
        for phase in summary['phases_summary']:
            if 'budget_allocated' not in phase or 'amount_spent' not in phase:
                print("  ❌ Phase summary missing required fields")
                return False
        print("  ✅ Phase summaries are complete")
    
    return True

def test_dashboard_data():
    """Test dashboard data aggregation"""
    print("\n🧪 Testing Dashboard Data")
    
    if not test_data['project_id']:
        print("  ❌ No project ID available for dashboard testing")
        return False
    
    dashboard, status = make_request('GET', f'/projects/{test_data["project_id"]}/dashboard-data')
    if status != 200 or not dashboard:
        print("  ❌ Failed to get dashboard data")
        return False
    
    print("  ✅ Dashboard Data Retrieved:")
    
    # Check summary is included
    if 'summary' not in dashboard:
        print("  ❌ Dashboard missing summary data")
        return False
    
    print(f"    📊 Summary included: ✅")
    
    # Check monthly trend
    if 'monthly_trend' not in dashboard:
        print("  ❌ Dashboard missing monthly trend")
        return False
    
    print(f"    📈 Monthly trend points: {len(dashboard['monthly_trend'])}")
    
    # Check recent entries
    if 'recent_entries' not in dashboard:
        print("  ❌ Dashboard missing recent entries")
        return False
    
    print(f"    📝 Recent entries: {len(dashboard['recent_entries'])}")
    
    return True

def test_edge_cases():
    """Test edge cases and error handling"""
    print("\n🧪 Testing Edge Cases")
    
    # Test invalid project ID
    invalid_project, status = make_request('GET', '/projects/invalid-id')
    if status != 404:
        print("  ❌ Should return 404 for invalid project ID")
        return False
    print("  ✅ Correctly handles invalid project ID")
    
    # Test invalid cost entry (missing calculation data)
    invalid_entry = {
        "project_id": test_data['project_id'] if test_data['project_id'] else "test-id",
        "category_id": test_data['category_ids'][0] if test_data['category_ids'] else "test-cat",
        "description": "Invalid entry without calculation data"
    }
    
    result, status = make_request('POST', '/cost-entries', invalid_entry)
    if status not in [400, 404]:  # Should fail with bad request or not found
        print("  ❌ Should reject cost entry without calculation data")
        return False
    print("  ✅ Correctly rejects invalid cost entry")
    
    return True

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting Comprehensive Backend API Testing")
    print("=" * 60)
    
    tests = [
        ("API Root", test_api_root),
        ("Initialize Default Categories", test_initialize_default_categories),
        ("Cost Category Management", test_cost_categories),
        ("Project CRUD Operations", test_project_crud),
        ("Phase Management", test_phase_management),
        ("Cost Entry System", test_cost_entries),
        ("Project Analytics", test_project_analytics),
        ("Dashboard Data", test_dashboard_data),
        ("Edge Cases", test_edge_cases)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"  ❌ Test {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("🏁 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\n📊 Total: {len(results)} tests")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Success Rate: {(passed/len(results)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Backend API is working correctly.")
        return True
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)