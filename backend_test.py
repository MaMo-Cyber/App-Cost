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
    'demo_project_id': None,  # For ongoing demo project
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
    """Test project analytics and summary with budget chart fix"""
    print("\n🧪 Testing Project Analytics & Summary with Budget Fields")
    
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
    print(f"    💳 Total Outstanding: ${summary.get('total_outstanding', 0):,.2f}")
    print(f"    💵 Total Paid: ${summary.get('total_paid', 0):,.2f}")
    
    # Check for the specific budget fields that were fixed
    if 'budget_remaining_actual' not in summary:
        print("  ❌ Missing 'budget_remaining_actual' field in summary")
        return False
    
    if 'budget_remaining_committed' not in summary:
        print("  ❌ Missing 'budget_remaining_committed' field in summary")
        return False
    
    print(f"    🎯 Budget Remaining Actual: ${summary['budget_remaining_actual']:,.2f}")
    print(f"    🎯 Budget Remaining Committed: ${summary['budget_remaining_committed']:,.2f}")
    print(f"    📊 Budget Utilization: {summary['budget_utilization']:.1f}%")
    print(f"    🚦 Status: {summary['status_indicator']}")
    print(f"    📈 Phases: {len(summary['phases_summary'])}")
    print(f"    🏷️ Cost Categories: {len(summary['cost_breakdown'])}")
    print(f"    📅 Trend Data Points: {len(summary['trend_data'])}")
    
    # Validate budget calculations
    if summary['total_spent'] <= 0:
        print("  ❌ Total spent should be greater than 0")
        return False
    
    # Validate budget_remaining_actual calculation (Budget - Total Spent including outstanding)
    expected_remaining_actual = summary['project']['total_budget'] - summary['total_spent']
    if abs(summary['budget_remaining_actual'] - expected_remaining_actual) > 0.01:
        print(f"  ❌ Budget remaining actual calculation incorrect: expected {expected_remaining_actual}, got {summary['budget_remaining_actual']}")
        return False
    
    # Validate budget_remaining_committed calculation (Budget - Total Paid excluding outstanding)
    expected_remaining_committed = summary['project']['total_budget'] - summary['total_paid']
    if abs(summary['budget_remaining_committed'] - expected_remaining_committed) > 0.01:
        print(f"  ❌ Budget remaining committed calculation incorrect: expected {expected_remaining_committed}, got {summary['budget_remaining_committed']}")
        return False
    
    print("  ✅ Budget calculations are correct")
    print("  ✅ Both budget_remaining_actual and budget_remaining_committed fields present")
    
    # Check outstanding vs paid breakdown
    if 'outstanding_breakdown' not in summary:
        print("  ❌ Missing outstanding_breakdown field")
        return False
    
    if 'paid_breakdown' not in summary:
        print("  ❌ Missing paid_breakdown field")
        return False
    
    print(f"  ✅ Outstanding breakdown categories: {len(summary['outstanding_breakdown'])}")
    print(f"  ✅ Paid breakdown categories: {len(summary['paid_breakdown'])}")
    
    # Verify total_outstanding + total_paid = total_spent
    calculated_total = summary['total_outstanding'] + summary['total_paid']
    if abs(calculated_total - summary['total_spent']) > 0.01:
        print(f"  ❌ Outstanding + Paid should equal Total Spent: {calculated_total} != {summary['total_spent']}")
        return False
    
    print("  ✅ Outstanding + Paid = Total Spent verification passed")
    
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

def test_create_ongoing_demo_project():
    """Test the create ongoing demo project endpoint for EVM analysis"""
    print("\n🧪 Testing Create Ongoing Demo Project Endpoint")
    
    # Create ongoing demo project
    demo_project, status = make_request('POST', '/create-ongoing-demo-project')
    if status != 200 or not demo_project:
        print("  ❌ Failed to create ongoing demo project")
        return False
    
    print(f"  ✅ Created ongoing demo project: {demo_project['project_name']}")
    print(f"    💰 Total Budget: €{demo_project['total_budget']:,.2f}")
    print(f"    📊 Project Status: {demo_project['project_status']}")
    print(f"    📝 Cost Entries: {demo_project['cost_entries_created']}")
    print(f"    🏗️ Phases: {demo_project['phases_created']}")
    
    # Store demo project ID for further testing
    test_data['demo_project_id'] = demo_project['project_id']
    
    # Verify project was actually created
    project, status = make_request('GET', f'/projects/{demo_project["project_id"]}')
    if status != 200 or not project:
        print("  ❌ Demo project not found after creation")
        return False
    
    print(f"  ✅ Demo project verified in database")
    
    # Check project has cost estimates
    if not project.get('cost_estimates') or len(project['cost_estimates']) == 0:
        print("  ❌ Demo project missing cost estimates")
        return False
    
    print(f"  ✅ Cost estimates present: {len(project['cost_estimates'])} categories")
    
    # Verify completion status details
    completion_status = demo_project.get('completion_status', {})
    expected_phases = ['phase_1', 'phase_2', 'phase_3', 'phase_4', 'phase_5']
    for phase in expected_phases:
        if phase not in completion_status:
            print(f"  ❌ Missing completion status for {phase}")
            return False
    
    print("  ✅ All phase completion statuses present")
    
    return True

def test_enhanced_evm_analysis():
    """Test enhanced EVM analysis with comprehensive explanations"""
    print("\n🧪 Testing Enhanced EVM Analysis")
    
    if not test_data.get('demo_project_id'):
        print("  ❌ No demo project ID available for EVM testing")
        return False
    
    # Get project summary with EVM metrics
    summary, status = make_request('GET', f'/projects/{test_data["demo_project_id"]}/summary')
    if status != 200 or not summary:
        print("  ❌ Failed to get project summary for EVM analysis")
        return False
    
    print("  ✅ Retrieved project summary with EVM data")
    
    # Check for EVM metrics in summary
    if 'evm_metrics' not in summary:
        print("  ❌ Missing EVM metrics in project summary")
        return False
    
    evm = summary['evm_metrics']
    required_evm_fields = [
        'budget_at_completion', 'actual_cost', 'earned_value', 'planned_value',
        'cost_variance', 'schedule_variance', 'cost_performance_index', 
        'schedule_performance_index', 'estimate_at_completion', 
        'variance_at_completion', 'estimate_to_complete', 'cost_status', 'schedule_status'
    ]
    
    for field in required_evm_fields:
        if field not in evm:
            print(f"  ❌ Missing EVM field: {field}")
            return False
    
    print("  ✅ All required EVM metrics present")
    
    # Validate EVM calculations
    bac = evm['budget_at_completion']
    ac = evm['actual_cost']
    ev = evm['earned_value']
    pv = evm['planned_value']
    
    print(f"    📊 EVM Metrics:")
    print(f"      BAC (Budget at Completion): €{bac:,.2f}")
    print(f"      AC (Actual Cost): €{ac:,.2f}")
    print(f"      EV (Earned Value): €{ev:,.2f}")
    print(f"      PV (Planned Value): €{pv:,.2f}")
    
    # Validate performance indices
    cpi = evm['cost_performance_index']
    spi = evm['schedule_performance_index']
    eac = evm['estimate_at_completion']
    vac = evm['variance_at_completion']
    
    print(f"      CPI (Cost Performance Index): {cpi:.3f}")
    print(f"      SPI (Schedule Performance Index): {spi:.3f}")
    print(f"      EAC (Estimate at Completion): €{eac:,.2f}")
    print(f"      VAC (Variance at Completion): €{vac:,.2f}")
    print(f"      Cost Status: {evm['cost_status']}")
    print(f"      Schedule Status: {evm['schedule_status']}")
    
    # Validate calculations
    expected_cv = ev - ac
    if abs(evm['cost_variance'] - expected_cv) > 0.01:
        print(f"  ❌ Cost variance calculation incorrect: expected {expected_cv}, got {evm['cost_variance']}")
        return False
    
    expected_sv = ev - pv
    if abs(evm['schedule_variance'] - expected_sv) > 0.01:
        print(f"  ❌ Schedule variance calculation incorrect: expected {expected_sv}, got {evm['schedule_variance']}")
        return False
    
    if ac > 0:
        expected_cpi = ev / ac
        if abs(cpi - expected_cpi) > 0.001:
            print(f"  ❌ CPI calculation incorrect: expected {expected_cpi}, got {cpi}")
            return False
    
    if pv > 0:
        expected_spi = ev / pv
        if abs(spi - expected_spi) > 0.001:
            print(f"  ❌ SPI calculation incorrect: expected {expected_spi}, got {spi}")
            return False
    
    print("  ✅ EVM calculations are mathematically correct")
    
    # Check for realistic project performance (ongoing project should show some variance)
    if cpi == 1.0 and spi == 1.0:
        print("  ⚠️  Warning: Perfect performance indices may indicate unrealistic demo data")
    
    # Validate status indicators
    if cpi > 1.05 and evm['cost_status'] != "Under Budget":
        print(f"  ❌ Cost status should be 'Under Budget' for CPI > 1.05, got '{evm['cost_status']}'")
        return False
    elif cpi < 0.95 and evm['cost_status'] != "Over Budget":
        print(f"  ❌ Cost status should be 'Over Budget' for CPI < 0.95, got '{evm['cost_status']}'")
        return False
    
    print("  ✅ EVM status indicators are correct")
    
    return True

def test_evm_timeline_data():
    """Test EVM timeline endpoint for comprehensive time-series data"""
    print("\n🧪 Testing EVM Timeline Data")
    
    if not test_data.get('demo_project_id'):
        print("  ❌ No demo project ID available for EVM timeline testing")
        return False
    
    # Get EVM timeline data
    timeline, status = make_request('GET', f'/projects/{test_data["demo_project_id"]}/evm-timeline')
    if status != 200 or not timeline:
        print("  ❌ Failed to get EVM timeline data")
        return False
    
    print("  ✅ Retrieved EVM timeline data")
    
    # Check required timeline fields
    required_fields = ['project_name', 'total_budget', 'project_status', 'timeline_data', 
                      'cost_baseline', 'eac_trend', 'current_performance']
    
    for field in required_fields:
        if field not in timeline:
            print(f"  ❌ Missing timeline field: {field}")
            return False
    
    print("  ✅ All required timeline fields present")
    
    # Validate timeline data structure
    timeline_data = timeline['timeline_data']
    if not timeline_data or len(timeline_data) == 0:
        print("  ❌ Timeline data is empty")
        return False
    
    print(f"    📊 Timeline data points: {len(timeline_data)}")
    
    # Check timeline data point structure
    sample_point = timeline_data[0]
    required_point_fields = ['month', 'planned_value', 'earned_value', 'actual_cost', 
                           'eac', 'cpi', 'spi', 'cost_variance', 'schedule_variance']
    
    for field in required_point_fields:
        if field not in sample_point:
            print(f"  ❌ Missing timeline point field: {field}")
            return False
    
    print("  ✅ Timeline data points have correct structure")
    
    # Validate cost baseline
    cost_baseline = timeline['cost_baseline']
    if not cost_baseline or len(cost_baseline) == 0:
        print("  ❌ Cost baseline data is empty")
        return False
    
    print(f"    📈 Cost baseline points: {len(cost_baseline)}")
    
    # Validate EAC trend
    eac_trend = timeline['eac_trend']
    if not eac_trend or len(eac_trend) == 0:
        print("  ❌ EAC trend data is empty")
        return False
    
    print(f"    📉 EAC trend points: {len(eac_trend)}")
    
    # Check current performance metrics
    current_perf = timeline['current_performance']
    perf_fields = ['current_cpi', 'current_spi', 'final_eac', 'projected_overrun']
    
    for field in perf_fields:
        if field not in current_perf:
            print(f"  ❌ Missing current performance field: {field}")
            return False
    
    print(f"    🎯 Current Performance:")
    print(f"      Current CPI: {current_perf['current_cpi']:.3f}")
    print(f"      Current SPI: {current_perf['current_spi']:.3f}")
    print(f"      Final EAC: €{current_perf['final_eac']:,.2f}")
    print(f"      Projected Overrun: €{current_perf['projected_overrun']:,.2f}")
    
    # Check for future projections (ongoing project should have future data)
    future_points = [point for point in timeline_data if point.get('is_future', False)]
    if len(future_points) == 0:
        print("  ⚠️  Warning: No future projections found for ongoing project")
    else:
        print(f"    🔮 Future projection points: {len(future_points)}")
    
    # Validate overrun detection
    if timeline.get('overrun_point'):
        overrun = timeline['overrun_point']
        print(f"    ⚠️  Cost overrun detected at month {overrun['month']}")
        print(f"      EAC: €{overrun['eac']:,.2f}")
        print(f"      Budget exceeded by: €{overrun['budget_exceeded_by']:,.2f}")
    
    # Check completion prediction
    if timeline.get('completion_prediction'):
        prediction = timeline['completion_prediction']
        print(f"    📊 Completion Prediction:")
        print(f"      Current Progress: {prediction['current_progress_pct']}%")
        print(f"      Projected Completion Cost: €{prediction['projected_completion_cost']:,.2f}")
        print(f"      Projected Overrun: {prediction['projected_overrun_pct']}%")
        print(f"      Cost Efficiency: {prediction['cost_efficiency']}")
    
    return True

def test_future_phase_analysis():
    """Test future phase analysis for unfinished projects"""
    print("\n🧪 Testing Future Phase Analysis")
    
    if not test_data.get('demo_project_id'):
        print("  ❌ No demo project ID available for future phase testing")
        return False
    
    # Get project phases
    phases, status = make_request('GET', f'/projects/{test_data["demo_project_id"]}/phases')
    if status != 200 or not phases:
        print("  ❌ Failed to get project phases")
        return False
    
    print(f"  ✅ Retrieved {len(phases)} project phases")
    
    # Check for phases with different statuses
    phase_statuses = {}
    for phase in phases:
        status_key = phase.get('status', 'unknown')
        phase_statuses[status_key] = phase_statuses.get(status_key, 0) + 1
    
    print(f"    📊 Phase Status Distribution:")
    for status_key, count in phase_statuses.items():
        print(f"      {status_key}: {count} phases")
    
    # Verify we have future phases (not started or planning)
    future_phases = [p for p in phases if p.get('status') in ['not_started', 'planning']]
    if len(future_phases) == 0:
        print("  ⚠️  Warning: No future phases found for analysis")
    else:
        print(f"  ✅ Found {len(future_phases)} future phases for analysis")
    
    # Get project summary to check phase analysis
    summary, status = make_request('GET', f'/projects/{test_data["demo_project_id"]}/summary')
    if status != 200 or not summary:
        print("  ❌ Failed to get project summary for phase analysis")
        return False
    
    # Check phases summary in project summary
    phases_summary = summary.get('phases_summary', [])
    if len(phases_summary) == 0:
        print("  ❌ No phases summary found in project summary")
        return False
    
    print(f"  ✅ Phase analysis data available for {len(phases_summary)} phases")
    
    # Analyze each phase
    for i, phase_summary in enumerate(phases_summary):
        required_fields = ['name', 'budget_allocated', 'amount_spent', 'budget_remaining', 'utilization_percentage']
        
        for field in required_fields:
            if field not in phase_summary:
                print(f"  ❌ Missing phase summary field: {field}")
                return False
        
        print(f"    Phase {i+1}: {phase_summary['name']}")
        print(f"      Budget: €{phase_summary['budget_allocated']:,.2f}")
        print(f"      Spent: €{phase_summary['amount_spent']:,.2f}")
        print(f"      Remaining: €{phase_summary['budget_remaining']:,.2f}")
        print(f"      Utilization: {phase_summary['utilization_percentage']:.1f}%")
    
    # Check for realistic phase progression (some phases should be complete, some ongoing, some future)
    completed_phases = [p for p in phases_summary if p.get('utilization_percentage', 0) >= 100]
    ongoing_phases = [p for p in phases_summary if 0 < p.get('utilization_percentage', 0) < 100]
    future_phases_summary = [p for p in phases_summary if p.get('utilization_percentage', 0) == 0]
    
    print(f"    📈 Phase Progression Analysis:")
    print(f"      Completed phases: {len(completed_phases)}")
    print(f"      Ongoing phases: {len(ongoing_phases)}")
    print(f"      Future phases: {len(future_phases_summary)}")
    
    if len(completed_phases) == 0 and len(ongoing_phases) == 0:
        print("  ⚠️  Warning: No progress shown in any phases")
    
    return True

def test_comprehensive_evm_integration():
    """Test comprehensive EVM integration across all endpoints"""
    print("\n🧪 Testing Comprehensive EVM Integration")
    
    if not test_data.get('demo_project_id'):
        print("  ❌ No demo project ID available for comprehensive EVM testing")
        return False
    
    # Test 1: Verify EVM data consistency across endpoints
    print("  🔍 Testing EVM data consistency...")
    
    # Get data from summary endpoint
    summary, status = make_request('GET', f'/projects/{test_data["demo_project_id"]}/summary')
    if status != 200:
        print("  ❌ Failed to get summary for consistency check")
        return False
    
    # Get data from timeline endpoint
    timeline, status = make_request('GET', f'/projects/{test_data["demo_project_id"]}/evm-timeline')
    if status != 200:
        print("  ❌ Failed to get timeline for consistency check")
        return False
    
    # Compare key metrics
    summary_evm = summary['evm_metrics']
    timeline_current = timeline['current_performance']
    
    # Check CPI consistency
    if abs(summary_evm['cost_performance_index'] - timeline_current['current_cpi']) > 0.001:
        print("  ❌ CPI inconsistency between summary and timeline")
        return False
    
    # Check SPI consistency
    if abs(summary_evm['schedule_performance_index'] - timeline_current['current_spi']) > 0.001:
        print("  ❌ SPI inconsistency between summary and timeline")
        return False
    
    # Check EAC consistency
    if abs(summary_evm['estimate_at_completion'] - timeline_current['final_eac']) > 0.01:
        print("  ❌ EAC inconsistency between summary and timeline")
        return False
    
    print("  ✅ EVM data is consistent across endpoints")
    
    # Test 2: Verify realistic EVM progression for ongoing project
    print("  🔍 Testing realistic EVM progression...")
    
    timeline_data = timeline['timeline_data']
    
    # Check that actual costs increase over time
    actual_costs = [point['actual_cost'] for point in timeline_data if not point.get('is_future', False)]
    if len(actual_costs) > 1:
        for i in range(1, len(actual_costs)):
            if actual_costs[i] < actual_costs[i-1]:
                print("  ❌ Actual costs should be non-decreasing over time")
                return False
    
    # Check that planned value follows S-curve or linear progression
    planned_values = [point['planned_value'] for point in timeline_data]
    if len(planned_values) > 1:
        for i in range(1, len(planned_values)):
            if planned_values[i] < planned_values[i-1]:
                print("  ❌ Planned values should be non-decreasing over time")
                return False
    
    print("  ✅ EVM progression is realistic")
    
    # Test 3: Verify meaningful performance indicators
    print("  🔍 Testing meaningful performance indicators...")
    
    current_cpi = timeline_current['current_cpi']
    current_spi = timeline_current['current_spi']
    
    # For an ongoing project with some overruns, we expect CPI < 1.0
    if current_cpi > 1.1:
        print("  ⚠️  Warning: CPI seems too optimistic for a realistic ongoing project")
    
    # Check that status indicators match performance indices
    cost_status = summary_evm['cost_status']
    schedule_status = summary_evm['schedule_status']
    
    if current_cpi < 0.95 and cost_status != "Over Budget":
        print(f"  ❌ Cost status '{cost_status}' doesn't match CPI {current_cpi}")
        return False
    
    if current_spi < 0.95 and schedule_status != "Behind":
        print(f"  ❌ Schedule status '{schedule_status}' doesn't match SPI {current_spi}")
        return False
    
    print("  ✅ Performance indicators are meaningful and consistent")
    
    # Test 4: Verify future projections
    print("  🔍 Testing future projections...")
    
    future_points = [point for point in timeline_data if point.get('is_future', False)]
    if len(future_points) > 0:
        # Check that EAC projections are reasonable
        latest_eac = future_points[-1]['eac']
        total_budget = timeline['total_budget']
        
        if latest_eac < total_budget * 0.8:
            print("  ⚠️  Warning: EAC projection seems too optimistic")
        elif latest_eac > total_budget * 2.0:
            print("  ⚠️  Warning: EAC projection seems too pessimistic")
        else:
            print("  ✅ Future EAC projections are reasonable")
    
    print("  ✅ Comprehensive EVM integration test passed")
    
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
    
    # Test EVM timeline for non-existent project
    invalid_timeline, status = make_request('GET', '/projects/invalid-id/evm-timeline')
    if status != 404:
        print("  ❌ Should return 404 for EVM timeline of invalid project")
        return False
    print("  ✅ Correctly handles invalid project ID for EVM timeline")
    
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
        ("Create Ongoing Demo Project", test_create_ongoing_demo_project),
        ("Enhanced EVM Analysis", test_enhanced_evm_analysis),
        ("EVM Timeline Data", test_evm_timeline_data),
        ("Future Phase Analysis", test_future_phase_analysis),
        ("Comprehensive EVM Integration", test_comprehensive_evm_integration),
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