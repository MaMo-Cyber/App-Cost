#!/usr/bin/env python3
"""
Test obligation creation with cost categories
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

print('=== OBLIGATION CREATION TEST ===')

try:
    # Get categories
    categories_response = requests.get(f'{API_URL}/cost-categories', timeout=30)
    if categories_response.status_code != 200:
        print('Failed to get categories')
        exit(1)
    
    categories = categories_response.json()
    
    # Find Equipment + Installation category
    equipment_category = None
    for cat in categories:
        if cat['name'] == 'Equipment + Installation':
            equipment_category = cat
            break
    
    if not equipment_category:
        print('Equipment + Installation category not found')
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
    print(f'Testing with category: {equipment_category["name"]} (ID: {equipment_category["id"]})')
    
    # Create a test obligation
    obligation_data = {
        'project_id': project_id,
        'category_id': equipment_category['id'],
        'description': 'Purchase order for manufacturing equipment',
        'amount': 45000.0,
        'confidence_level': 'high',
        'priority': 'high',
        'contract_reference': 'PO-2024-EQUIP-001',
        'vendor_supplier': 'Industrial Equipment Ltd',
        'expected_incur_date': '2024-09-15'
    }
    
    obligation_response = requests.post(f'{API_URL}/obligations', json=obligation_data, timeout=30)
    if obligation_response.status_code == 200:
        obligation = obligation_response.json()
        print('✅ SUCCESS: Obligation created successfully!')
        print(f'  Obligation ID: {obligation["id"]}')
        print(f'  Amount: ${obligation["amount"]:,.2f}')
        print(f'  Category: {obligation["category_name"]}')
        print(f'  Confidence Level: {obligation["confidence_level"]} ({obligation["confidence_percentage"]}%)')
        print(f'  Priority: {obligation["priority"]}')
        print(f'  Contract Reference: {obligation["contract_reference"]}')
        print(f'  Expected Date: {obligation["expected_incur_date"]}')
        print(f'  Status: {obligation["status"]}')
        
    else:
        print(f'❌ FAILED to create obligation: {obligation_response.text}')
        
except Exception as e:
    print(f'❌ Request failed: {e}')