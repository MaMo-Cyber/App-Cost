#!/usr/bin/env python3
"""
Test cost categories and cost entry creation
"""

import requests
import json

# Get backend URL from frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip()
            break

API_URL = f'{BASE_URL}/api'

print('=== COST ENTRY CREATION TEST ===')

try:
    # Get categories
    categories_response = requests.get(f'{API_URL}/cost-categories', timeout=30)
    if categories_response.status_code != 200:
        print('Failed to get categories')
        exit(1)
    
    categories = categories_response.json()
    
    # Find Planning (INT) category
    planning_category = None
    for cat in categories:
        if cat['name'] == 'Planning (INT)':
            planning_category = cat
            break
    
    if not planning_category:
        print('Planning (INT) category not found')
        exit(1)
    
    # Get projects
    projects_response = requests.get(f'{API_URL}/projects', timeout=30)
    if projects_response.status_code != 200:
        print('Failed to get projects')
        exit(1)
    
    projects = projects_response.json()
    if not projects:
        print('No projects available')
        exit(1)
    
    project_id = projects[0]['id']
    
    print(f'Testing with project: {projects[0]["name"]}')
    print(f'Testing with category: {planning_category["name"]} (ID: {planning_category["id"]})')
    
    # Create a test cost entry
    cost_entry_data = {
        'project_id': project_id,
        'category_id': planning_category['id'],
        'description': 'Internal planning work for system architecture',
        'hours': 16.0,
        'hourly_rate': 85.0,
        'status': 'outstanding',
        'entry_date': '2024-07-25'
    }
    
    cost_response = requests.post(f'{API_URL}/cost-entries', json=cost_entry_data, timeout=30)
    if cost_response.status_code == 200:
        cost_entry = cost_response.json()
        print('✅ SUCCESS: Cost entry created successfully!')
        print(f'  Entry ID: {cost_entry["id"]}')
        print(f'  Total Amount: ${cost_entry["total_amount"]:,.2f}')
        print(f'  Category: {cost_entry["category_name"]}')
        print(f'  Hours: {cost_entry["hours"]} x ${cost_entry["hourly_rate"]}/hr')
        print(f'  Status: {cost_entry["status"]}')
        
        # Test creating another entry with a material category
        hardware_category = None
        for cat in categories:
            if cat['name'] == 'Hardware':
                hardware_category = cat
                break
        
        if hardware_category:
            print('\nTesting material category (Hardware):')
            material_entry_data = {
                'project_id': project_id,
                'category_id': hardware_category['id'],
                'description': 'Server hardware for development environment',
                'quantity': 2.0,
                'unit_price': 2500.0,
                'status': 'outstanding',
                'entry_date': '2024-07-25'
            }
            
            material_response = requests.post(f'{API_URL}/cost-entries', json=material_entry_data, timeout=30)
            if material_response.status_code == 200:
                material_entry = material_response.json()
                print('✅ SUCCESS: Material cost entry created successfully!')
                print(f'  Entry ID: {material_entry["id"]}')
                print(f'  Total Amount: ${material_entry["total_amount"]:,.2f}')
                print(f'  Category: {material_entry["category_name"]}')
                print(f'  Quantity: {material_entry["quantity"]} x ${material_entry["unit_price"]} each')
                print(f'  Status: {material_entry["status"]}')
            else:
                print(f'❌ FAILED to create material cost entry: {material_response.text}')
        
    else:
        print(f'❌ FAILED to create cost entry: {cost_response.text}')
        
except Exception as e:
    print(f'❌ Request failed: {e}')