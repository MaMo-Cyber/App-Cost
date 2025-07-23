from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date
from enum import Enum
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class CostType(str, Enum):
    HOURLY = "hourly"
    MATERIAL = "material"
    FIXED = "fixed"
    CUSTOM = "custom"

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"

class PhaseStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DELAYED = "delayed"

class CostStatus(str, Enum):
    OUTSTANDING = "outstanding"
    PAID = "paid"

# Models
class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    total_budget: float
    start_date: date
    end_date: date
    status: ProjectStatus = ProjectStatus.PLANNING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    # Cost estimation fields
    cost_estimates: Optional[Dict[str, float]] = {}
    estimated_total: Optional[float] = 0.0

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    total_budget: float
    start_date: date
    end_date: date
    cost_estimates: Optional[Dict[str, float]] = {}
    estimated_total: Optional[float] = 0.0

class Phase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    name: str
    description: Optional[str] = ""
    budget_allocation: float
    start_date: date
    end_date: date
    status: PhaseStatus = PhaseStatus.NOT_STARTED
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PhaseCreate(BaseModel):
    project_id: str
    name: str
    description: Optional[str] = ""
    budget_allocation: float
    start_date: date
    end_date: date

class CostCategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: CostType
    description: Optional[str] = ""
    default_rate: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CostCategoryCreate(BaseModel):
    name: str
    type: CostType
    description: Optional[str] = ""
    default_rate: Optional[float] = None

class CostEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    phase_id: Optional[str] = None
    category_id: str
    category_name: str
    description: Optional[str] = ""
    # For hourly costs
    hours: Optional[float] = None
    hourly_rate: Optional[float] = None
    # For material/fixed costs
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    # Total amount (calculated or manual)
    total_amount: float
    # Payment status and due date
    status: CostStatus = CostStatus.OUTSTANDING
    due_date: Optional[date] = None  # When payment is due
    entry_date: date = Field(default_factory=date.today)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CostEntryCreate(BaseModel):
    project_id: str
    phase_id: Optional[str] = None
    category_id: str
    description: Optional[str] = ""
    hours: Optional[float] = None
    hourly_rate: Optional[float] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    status: CostStatus = CostStatus.OUTSTANDING
    due_date: Optional[date] = None  # When payment is due
    entry_date: Optional[date] = None

class ProjectSummary(BaseModel):
    project: Project
    total_spent: float
    total_outstanding: float
    total_paid: float
    budget_remaining_actual: float  # Budget - Total Spent (including outstanding)
    budget_remaining_committed: float  # Budget - Total Paid (excluding outstanding)
    budget_utilization: float
    phases_summary: List[Dict[str, Any]]
    cost_breakdown: Dict[str, float]
    outstanding_breakdown: Dict[str, float]
    paid_breakdown: Dict[str, float]
    trend_data: List[Dict[str, Any]]
    status_indicator: str
    # EVM metrics
    evm_metrics: Optional[Dict[str, Any]] = {}

class EVMCalculation(BaseModel):
    # Basic values
    budget_at_completion: float  # BAC
    actual_cost: float  # AC
    earned_value: float  # EV
    planned_value: float  # PV
    
    # Variances
    cost_variance: float  # CV = EV - AC
    schedule_variance: float  # SV = EV - PV
    
    # Performance Indices
    cost_performance_index: float  # CPI = EV / AC
    schedule_performance_index: float  # SPI = EV / PV
    
    # Forecasting
    estimate_at_completion: float  # EAC = BAC / CPI
    variance_at_completion: float  # VAC = BAC - EAC
    estimate_to_complete: float  # ETC = EAC - AC
    
    # Status indicators
    cost_status: str  # "Under Budget", "Over Budget", "On Budget"
    schedule_status: str  # "Ahead", "Behind", "On Schedule"

# EVM Calculation Functions
def calculate_evm_metrics(project: Project, total_spent: float, project_progress: float = None) -> EVMCalculation:
    """
    Calculate Earned Value Management metrics
    
    Args:
        project: Project object with budget and estimates
        total_spent: Actual cost to date (AC)
        project_progress: Percentage of project completion (0-1), if None, estimated from schedule
    """
    budget_at_completion = project.total_budget  # BAC
    actual_cost = total_spent  # AC
    
    # Calculate project progress if not provided
    if project_progress is None:
        today = date.today()
        project_duration = (project.end_date - project.start_date).days
        elapsed_days = (today - project.start_date).days
        project_progress = min(max(elapsed_days / project_duration, 0), 1) if project_duration > 0 else 0
    
    # Calculate Planned Value (PV) - based on schedule
    planned_value = budget_at_completion * project_progress
    
    # Calculate Earned Value (EV) - this is simplified, in reality should be based on actual work completed
    # For now, we'll estimate it based on cost performance relative to estimates
    if hasattr(project, 'cost_estimates') and project.cost_estimates:
        estimated_total = sum(project.cost_estimates.values()) if project.cost_estimates else budget_at_completion
        if estimated_total > 0:
            earned_value = (actual_cost / estimated_total) * budget_at_completion * 0.9  # Conservative estimate
        else:
            earned_value = planned_value * 0.8  # Default conservative estimate
    else:
        earned_value = planned_value * 0.8  # Default conservative estimate
    
    # Ensure EV doesn't exceed BAC
    earned_value = min(earned_value, budget_at_completion)
    
    # Calculate variances
    cost_variance = earned_value - actual_cost  # CV
    schedule_variance = earned_value - planned_value  # SV
    
    # Calculate performance indices
    cost_performance_index = earned_value / actual_cost if actual_cost > 0 else 1.0  # CPI
    schedule_performance_index = earned_value / planned_value if planned_value > 0 else 1.0  # SPI
    
    # Calculate forecasting metrics
    estimate_at_completion = budget_at_completion / cost_performance_index if cost_performance_index > 0 else budget_at_completion  # EAC
    variance_at_completion = budget_at_completion - estimate_at_completion  # VAC
    estimate_to_complete = estimate_at_completion - actual_cost  # ETC
    
    # Determine status indicators
    if cost_performance_index > 1.05:
        cost_status = "Under Budget"
    elif cost_performance_index < 0.95:
        cost_status = "Over Budget"
    else:
        cost_status = "On Budget"
        
    if schedule_performance_index > 1.05:
        schedule_status = "Ahead"
    elif schedule_performance_index < 0.95:
        schedule_status = "Behind"
    else:
        schedule_status = "On Schedule"
    
    return EVMCalculation(
        budget_at_completion=budget_at_completion,
        actual_cost=actual_cost,
        earned_value=earned_value,
        planned_value=planned_value,
        cost_variance=cost_variance,
        schedule_variance=schedule_variance,
        cost_performance_index=cost_performance_index,
        schedule_performance_index=schedule_performance_index,
        estimate_at_completion=estimate_at_completion,
        variance_at_completion=variance_at_completion,
        estimate_to_complete=estimate_to_complete,
        cost_status=cost_status,
        schedule_status=schedule_status
    )

# Routes
@api_router.get("/")
async def root():
    return {"message": "Project Cost Tracker API"}

# Project routes
@api_router.post("/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    project_dict = project.dict()
    project_obj = Project(**project_dict)
    
    # Convert date objects to strings for MongoDB storage
    project_data = project_obj.dict()
    if isinstance(project_data.get('start_date'), date):
        project_data['start_date'] = project_data['start_date'].isoformat()
    if isinstance(project_data.get('end_date'), date):
        project_data['end_date'] = project_data['end_date'].isoformat()
    
    await db.projects.insert_one(project_data)
    
    # Initialize default categories if not exists
    existing_categories = await db.cost_categories.count_documents({})
    if existing_categories == 0:
        await initialize_default_categories()
    
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find().to_list(1000)
    return [Project(**project) for project in projects]

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**project)

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_update: ProjectCreate):
    project_dict = project_update.dict()
    project_dict["updated_at"] = datetime.utcnow()
    
    # Convert date objects to strings for MongoDB storage
    if isinstance(project_dict.get('start_date'), date):
        project_dict['start_date'] = project_dict['start_date'].isoformat()
    if isinstance(project_dict.get('end_date'), date):
        project_dict['end_date'] = project_dict['end_date'].isoformat()
    
    result = await db.projects.update_one(
        {"id": project_id}, 
        {"$set": project_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    updated_project = await db.projects.find_one({"id": project_id})
    return Project(**updated_project)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    # First, delete all related cost entries
    await db.cost_entries.delete_many({"project_id": project_id})
    
    # Then, delete all related phases
    await db.phases.delete_many({"project_id": project_id})
    
    # Finally, delete the project itself
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Project and all related data deleted successfully"}

# Phase routes
@api_router.post("/phases", response_model=Phase)
async def create_phase(phase: PhaseCreate):
    phase_dict = phase.dict()
    phase_obj = Phase(**phase_dict)
    
    # Convert date objects to strings for MongoDB storage
    phase_data = phase_obj.dict()
    if isinstance(phase_data.get('start_date'), date):
        phase_data['start_date'] = phase_data['start_date'].isoformat()
    if isinstance(phase_data.get('end_date'), date):
        phase_data['end_date'] = phase_data['end_date'].isoformat()
    
    await db.phases.insert_one(phase_data)
    return phase_obj

@api_router.get("/projects/{project_id}/phases", response_model=List[Phase])
async def get_project_phases(project_id: str):
    phases = await db.phases.find({"project_id": project_id}).to_list(1000)
    return [Phase(**phase) for phase in phases]

@api_router.put("/phases/{phase_id}/status")
async def update_phase_status(phase_id: str, status_data: dict):
    status = status_data.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    result = await db.phases.update_one(
        {"id": phase_id}, 
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    return {"message": "Phase status updated"}

# Cost category routes
@api_router.post("/cost-categories", response_model=CostCategory)
async def create_cost_category(category: CostCategoryCreate):
    category_dict = category.dict()
    category_obj = CostCategory(**category_dict)
    await db.cost_categories.insert_one(category_obj.dict())
    return category_obj

@api_router.get("/cost-categories", response_model=List[CostCategory])
async def get_cost_categories():
    categories = await db.cost_categories.find().to_list(1000)
    return [CostCategory(**category) for category in categories]

@api_router.delete("/cost-categories/{category_id}")
async def delete_cost_category(category_id: str):
    # Check if category is used in any cost entries
    cost_entries = await db.cost_entries.find({"category_id": category_id}).to_list(1)
    if cost_entries:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete category that is used in cost entries. Remove all cost entries with this category first."
        )
    
    result = await db.cost_categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cost category not found")
    return {"message": "Cost category deleted successfully"}

@api_router.put("/cost-categories/{category_id}", response_model=CostCategory)
async def update_cost_category(category_id: str, category_update: CostCategoryCreate):
    category_dict = category_update.dict()
    
    result = await db.cost_categories.update_one(
        {"id": category_id}, 
        {"$set": category_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cost category not found")
    
    updated_category = await db.cost_categories.find_one({"id": category_id})
    return CostCategory(**updated_category)

# Cost entry routes
@api_router.post("/cost-entries", response_model=CostEntry)
async def create_cost_entry(entry: CostEntryCreate):
    try:
        entry_dict = entry.dict()
        
        # Get category info
        category = await db.cost_categories.find_one({"id": entry.category_id})
        if not category:
            raise HTTPException(status_code=404, detail="Cost category not found")
        
        entry_dict["category_name"] = category["name"]
        
        # Calculate total amount if not provided
        if not entry.total_amount:
            if entry.hours and entry.hourly_rate:
                entry_dict["total_amount"] = entry.hours * entry.hourly_rate
            elif entry.quantity and entry.unit_price:
                entry_dict["total_amount"] = entry.quantity * entry.unit_price
            else:
                raise HTTPException(status_code=400, detail="Cannot calculate total amount")
        
        # Ensure status has default value
        if not entry_dict.get("status"):
            entry_dict["status"] = "outstanding"
        
        # Handle entry_date - always store as string
        if entry_dict.get("entry_date"):
            if hasattr(entry_dict["entry_date"], 'isoformat'):
                entry_dict["entry_date"] = entry_dict["entry_date"].isoformat()
        else:
            entry_dict["entry_date"] = date.today().isoformat()
        
        # Handle due_date - always store as string or None
        if entry_dict.get("due_date"):
            if hasattr(entry_dict["due_date"], 'isoformat'):
                entry_dict["due_date"] = entry_dict["due_date"].isoformat()
        else:
            entry_dict["due_date"] = None
        
        # Generate ID and created_at as string
        entry_dict["id"] = str(uuid.uuid4())
        entry_dict["created_at"] = datetime.utcnow().isoformat()
        
        # Insert directly to MongoDB with all dates as strings
        await db.cost_entries.insert_one(entry_dict)
        
        # Create return object with proper date conversion for Pydantic model
        return_data = entry_dict.copy()
        
        # Convert string dates back to date objects for the response model
        if return_data.get("entry_date"):
            return_data["entry_date"] = datetime.fromisoformat(return_data["entry_date"]).date()
        if return_data.get("due_date"):
            return_data["due_date"] = datetime.fromisoformat(return_data["due_date"]).date()
        if return_data.get("created_at"):
            return_data["created_at"] = datetime.fromisoformat(return_data["created_at"])
        
        return CostEntry(**return_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating cost entry: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating cost entry: {str(e)}")

@api_router.get("/projects/{project_id}/cost-entries", response_model=List[CostEntry])
async def get_project_cost_entries(project_id: str):
    entries = await db.cost_entries.find({"project_id": project_id}).to_list(1000)
    return [CostEntry(**entry) for entry in entries]

@api_router.get("/projects/{project_id}/cost-entries/by-category/{category_name}")
async def get_cost_entries_by_category(project_id: str, category_name: str):
    entries = await db.cost_entries.find({
        "project_id": project_id,
        "category_name": category_name
    }).to_list(1000)
    
    # Convert entries for better frontend display
    detailed_entries = []
    for entry in entries:
        detailed_entry = {
            "id": entry["id"],
            "description": entry.get("description", "No description"),
            "entry_date": entry["entry_date"],
            "total_amount": entry["total_amount"],
            "created_at": entry["created_at"]
        }
        
        # Add specific details based on entry type
        if entry.get("hours") and entry.get("hourly_rate"):
            detailed_entry["details"] = f"{entry['hours']} hours × ${entry['hourly_rate']}/hr"
            detailed_entry["type"] = "hourly"
        elif entry.get("quantity") and entry.get("unit_price"):
            detailed_entry["details"] = f"{entry['quantity']} units × ${entry['unit_price']} each"
            detailed_entry["type"] = "material"
        else:
            detailed_entry["details"] = "Fixed amount"
            detailed_entry["type"] = "fixed"
        
        # Add phase info if exists
        if entry.get("phase_id"):
            phase = await db.phases.find_one({"id": entry["phase_id"]})
            if phase:
                detailed_entry["phase_name"] = phase["name"]
        
        detailed_entries.append(detailed_entry)
    
    return {
        "category_name": category_name,
        "total_entries": len(detailed_entries),
        "total_amount": sum(entry["total_amount"] for entry in detailed_entries),
        "entries": detailed_entries
    }

@api_router.get("/projects/{project_id}/cost-entries/outstanding")
async def get_outstanding_cost_entries(project_id: str):
    entries = await db.cost_entries.find({
        "project_id": project_id,
        "status": "outstanding"
    }).to_list(1000)
    return [CostEntry(**entry) for entry in entries]

@api_router.get("/projects/{project_id}/cost-entries/paid")
async def get_paid_cost_entries(project_id: str):
    entries = await db.cost_entries.find({
        "project_id": project_id,
        "status": "paid"
    }).to_list(1000)
    return [CostEntry(**entry) for entry in entries]

@api_router.get("/projects/{project_id}/payment-timeline")
async def get_payment_timeline(project_id: str):
    """Get outstanding costs organized by due dates for timeline view"""
    outstanding_entries = await db.cost_entries.find({
        "project_id": project_id,
        "status": "outstanding"
    }).to_list(1000)
    
    today = date.today()
    timeline_data = {
        "overdue": [],
        "due_this_week": [],
        "due_this_month": [],
        "due_later": [],
        "no_due_date": []
    }
    
    for entry in outstanding_entries:
        entry_data = {
            "id": entry["id"],
            "category_name": entry["category_name"],
            "description": entry.get("description", ""),
            "total_amount": entry["total_amount"],
            "due_date": entry.get("due_date"),
            "entry_date": entry["entry_date"],
            "days_until_due": None
        }
        
        due_date = entry.get("due_date")
        if not due_date:
            timeline_data["no_due_date"].append(entry_data)
            continue
            
        # Convert due_date string to date object if needed
        if isinstance(due_date, str):
            due_date = datetime.fromisoformat(due_date).date()
        
        days_until_due = (due_date - today).days
        entry_data["days_until_due"] = days_until_due
        
        if days_until_due < 0:
            timeline_data["overdue"].append(entry_data)
        elif days_until_due <= 7:
            timeline_data["due_this_week"].append(entry_data)
        elif days_until_due <= 30:
            timeline_data["due_this_month"].append(entry_data)
        else:
            timeline_data["due_later"].append(entry_data)
    
    # Calculate totals for each category
    timeline_summary = {
        "overdue_total": sum(entry["total_amount"] for entry in timeline_data["overdue"]),
        "due_this_week_total": sum(entry["total_amount"] for entry in timeline_data["due_this_week"]),
        "due_this_month_total": sum(entry["total_amount"] for entry in timeline_data["due_this_month"]),
        "due_later_total": sum(entry["total_amount"] for entry in timeline_data["due_later"]),
        "no_due_date_total": sum(entry["total_amount"] for entry in timeline_data["no_due_date"]),
        "total_outstanding": sum(entry["total_amount"] for entry in outstanding_entries)
    }
    
    return {
        "timeline_data": timeline_data,
        "summary": timeline_summary,
        "today": today.isoformat()
    }

@api_router.put("/cost-entries/{entry_id}/due-date")
async def update_cost_entry_due_date(entry_id: str, due_date: str):
    # Convert string date to proper format
    try:
        parsed_date = datetime.fromisoformat(due_date).date()
        date_str = parsed_date.isoformat()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    result = await db.cost_entries.update_one(
        {"id": entry_id}, 
        {"$set": {"due_date": date_str}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cost entry not found")
    
    return {"message": "Due date updated successfully"}

@api_router.put("/cost-entries/{entry_id}/status")
async def update_cost_entry_status(entry_id: str, request: Request):
    # Get status from request body
    body = await request.body()
    status = body.decode('utf-8').strip('"')  # Remove quotes if present
    
    # Validate status
    if status not in ["outstanding", "paid"]:
        raise HTTPException(status_code=400, detail="Status must be 'outstanding' or 'paid'")
    
    result = await db.cost_entries.update_one(
        {"id": entry_id}, 
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cost entry not found")
    
    return {"message": "Cost entry status updated"}

@api_router.delete("/cost-entries/{entry_id}")
async def delete_cost_entry(entry_id: str):
    result = await db.cost_entries.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cost entry not found")
    return {"message": "Cost entry deleted"}

# Analytics and Summary routes
@api_router.get("/projects/{project_id}/summary", response_model=ProjectSummary)
async def get_project_summary(project_id: str):
    # Get project
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get cost entries
    cost_entries = await db.cost_entries.find({"project_id": project_id}).to_list(1000)
    total_spent = sum(entry.get("total_amount", 0) for entry in cost_entries)
    
    # Calculate outstanding vs paid
    outstanding_entries = [entry for entry in cost_entries if entry.get("status") == "outstanding"]
    paid_entries = [entry for entry in cost_entries if entry.get("status") == "paid"]
    
    total_outstanding = sum(entry.get("total_amount", 0) for entry in outstanding_entries)
    total_paid = sum(entry.get("total_amount", 0) for entry in paid_entries)
    
    # Get phases
    phases = await db.phases.find({"project_id": project_id}).to_list(1000)
    
    # Calculate phase summaries
    phases_summary = []
    for phase in phases:
        phase_entries = [entry for entry in cost_entries if entry.get("phase_id") == phase["id"]]
        phase_spent = sum(entry.get("total_amount", 0) for entry in phase_entries)
        phase_budget = phase.get("budget_allocation", 0)
        
        phases_summary.append({
            "id": phase["id"],
            "name": phase["name"],
            "budget_allocated": phase_budget,
            "amount_spent": phase_spent,
            "budget_remaining": phase_budget - phase_spent,
            "utilization_percentage": (phase_spent / phase_budget * 100) if phase_budget > 0 else 0,
            "status": phase["status"]
        })
    
    # Cost breakdown by category
    cost_breakdown = {}
    outstanding_breakdown = {}
    paid_breakdown = {}
    
    for entry in cost_entries:
        category = entry.get("category_name", "Unknown")
        amount = entry.get("total_amount", 0)
        status = entry.get("status", "outstanding")
        
        cost_breakdown[category] = cost_breakdown.get(category, 0) + amount
        
        if status == "outstanding":
            outstanding_breakdown[category] = outstanding_breakdown.get(category, 0) + amount
        else:
            paid_breakdown[category] = paid_breakdown.get(category, 0) + amount
    
    # Trend data (last 30 days)
    from collections import defaultdict
    trend_data = defaultdict(float)
    
    for entry in cost_entries:
        entry_date = entry.get("entry_date")
        if isinstance(entry_date, str):
            entry_date = datetime.fromisoformat(entry_date).date()
        trend_data[str(entry_date)] += entry.get("total_amount", 0)
    
    trend_list = [{"date": date, "amount": amount} for date, amount in sorted(trend_data.items())]
    
    # Status indicator
    budget_utilization = (total_spent / project["total_budget"] * 100) if project["total_budget"] > 0 else 0
    if budget_utilization <= 75:
        status_indicator = "on_track"
    elif budget_utilization <= 90:
        status_indicator = "warning"
    else:
        status_indicator = "over_budget"
    
    # Calculate EVM metrics
    project_obj = Project(**project)
    evm_metrics = calculate_evm_metrics(project_obj, total_spent)
    
    return ProjectSummary(
        project=Project(**project),
        total_spent=total_spent,
        total_outstanding=total_outstanding,
        total_paid=total_paid,
        budget_remaining_actual=project["total_budget"] - total_spent,  # True remaining after all commitments
        budget_remaining_committed=project["total_budget"] - total_paid,  # Remaining if outstanding is paid
        budget_utilization=budget_utilization,
        phases_summary=phases_summary,
        cost_breakdown=cost_breakdown,
        outstanding_breakdown=outstanding_breakdown,
        paid_breakdown=paid_breakdown,
        trend_data=trend_list,
        status_indicator=status_indicator,
        evm_metrics=evm_metrics.dict()
    )

@api_router.get("/projects/{project_id}/dashboard-data")
async def get_dashboard_data(project_id: str):
    summary = await get_project_summary(project_id)
    
    # Additional dashboard metrics
    cost_entries = await db.cost_entries.find({"project_id": project_id}).to_list(1000)
    
    # Monthly trend
    monthly_costs = defaultdict(float)
    for entry in cost_entries:
        entry_date = entry.get("entry_date")
        if isinstance(entry_date, str):
            entry_date = datetime.fromisoformat(entry_date).date()
        month_key = f"{entry_date.year}-{entry_date.month:02d}"
        monthly_costs[month_key] += entry.get("total_amount", 0)
    
    monthly_trend = [{"month": month, "amount": amount} for month, amount in sorted(monthly_costs.items())]
    
    # Convert recent entries to proper format (remove MongoDB ObjectId)
    recent_entries = []
    
    # Sort entries by created_at, handling both datetime and string formats
    def get_sort_key(entry):
        created_at = entry.get("created_at")
        if isinstance(created_at, str):
            try:
                return datetime.fromisoformat(created_at)
            except:
                return datetime.min
        elif isinstance(created_at, datetime):
            return created_at
        else:
            return datetime.min
    
    for entry in sorted(cost_entries, key=get_sort_key, reverse=True)[:10]:
        # Remove MongoDB _id field if present
        if "_id" in entry:
            del entry["_id"]
        recent_entries.append(entry)
    
    return {
        "summary": summary,
        "monthly_trend": monthly_trend,
        "recent_entries": recent_entries
    }

@api_router.get("/export-all-data")
async def export_all_data():
    """Export all data for backup"""
    try:
        # Get all projects
        projects = await db.projects.find().to_list(1000)
        
        # Get all cost categories
        categories = await db.cost_categories.find().to_list(1000)
        
        # Get all phases
        phases = await db.phases.find().to_list(1000)
        
        # Get all cost entries
        cost_entries = await db.cost_entries.find().to_list(1000)
        
        # Create backup data structure
        backup_data = {
            "export_date": datetime.utcnow().isoformat(),
            "version": "1.0",
            "data": {
                "projects": projects,
                "cost_categories": categories,
                "phases": phases,
                "cost_entries": cost_entries
            }
        }
        
        return backup_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@api_router.post("/import-all-data")
async def import_all_data(backup_data: dict):
    """Import data from backup"""
    try:
        # Clear existing data (optional - could be made configurable)
        await db.projects.delete_many({})
        await db.cost_categories.delete_many({})
        await db.phases.delete_many({})
        await db.cost_entries.delete_many({})
        
        # Import data
        data = backup_data.get("data", {})
        
        if data.get("projects"):
            await db.projects.insert_many(data["projects"])
            
        if data.get("cost_categories"):
            await db.cost_categories.insert_many(data["cost_categories"])
            
        if data.get("phases"):
            await db.phases.insert_many(data["phases"])
            
        if data.get("cost_entries"):
            await db.cost_entries.insert_many(data["cost_entries"])
        
        return {
            "message": "Data imported successfully",
            "imported": {
                "projects": len(data.get("projects", [])),
                "categories": len(data.get("cost_categories", [])),
                "phases": len(data.get("phases", [])),
                "cost_entries": len(data.get("cost_entries", []))
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@api_router.put("/projects/{project_id}/cost-estimates")
async def update_project_cost_estimates(project_id: str, cost_estimates: Dict[str, float]):
    """Update the cost estimates for a project"""
    estimated_total = sum(cost_estimates.values())
    
    result = await db.projects.update_one(
        {"id": project_id},
        {
            "$set": {
                "cost_estimates": cost_estimates,
                "estimated_total": estimated_total,
                "updated_at": datetime.utcnow().isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Cost estimates updated successfully", "estimated_total": estimated_total}

@api_router.get("/projects/{project_id}/export-pdf")
async def export_project_pdf(project_id: str):
    """Export project summary and charts as PDF with graphics"""
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as ReportLabImage
        from reportlab.lib.units import inch
        from io import BytesIO
        import matplotlib.pyplot as plt
        import matplotlib
        matplotlib.use('Agg')  # Use non-interactive backend
        
        # Get project summary
        summary = await get_project_summary(project_id)
        project = summary.project
        
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, spaceAfter=30)
        heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=14, spaceAfter=12)
        
        # Build PDF content
        story = []
        
        # Title
        story.append(Paragraph(f"Project Cost Report: {project.name}", title_style))
        story.append(Spacer(1, 12))
        
        # Project Information
        story.append(Paragraph("Project Information", heading_style))
        project_data = [
            ["Project Name", project.name],
            ["Description", project.description or "No description"],
            ["Total Budget", f"€{project.total_budget:,.2f}"],
            ["Start Date", str(project.start_date)],
            ["End Date", str(project.end_date)],
            ["Status", project.status.title()],
            ["Budget Utilization", f"{summary.budget_utilization:.1f}%"],
            ["Project Status", summary.status_indicator.replace('_', ' ').title()]
        ]
        
        project_table = Table(project_data, colWidths=[2*inch, 4*inch])
        project_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(project_table)
        story.append(Spacer(1, 20))
        
        # Financial Summary
        story.append(Paragraph("Financial Summary", heading_style))
        financial_data = [
            ["Metric", "Amount"],
            ["Total Budget", f"€{project.total_budget:,.2f}"],
            ["Total Spent", f"€{summary.total_spent:,.2f}"],
            ["Total Outstanding", f"€{summary.total_outstanding:,.2f}"],
            ["Total Paid", f"€{summary.total_paid:,.2f}"],
            ["Remaining (Actual)", f"€{summary.budget_remaining_actual:,.2f}"],
            ["Available (If Paid)", f"€{summary.budget_remaining_committed:,.2f}"]
        ]
        
        financial_table = Table(financial_data, colWidths=[3*inch, 2*inch])
        financial_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(financial_table)
        story.append(Spacer(1, 20))
        
        # Generate Budget Analysis Chart
        try:
            plt.style.use('default')
            fig, ax = plt.subplots(figsize=(10, 6))
            
            categories = ['Budget Allocated', 'Amount Spent', 'Remaining (Actual)']
            amounts = [project.total_budget, summary.total_spent, summary.budget_remaining_actual]
            colors_chart = ['#3B82F6', '#10B981', '#6B7280']
            
            bars = ax.bar(categories, amounts, color=colors_chart, alpha=0.8)
            ax.set_ylabel('Amount (€)', fontsize=12)
            ax.set_title('Budget Analysis', fontsize=14, fontweight='bold', pad=20)
            ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'€{x:,.0f}'))
            
            # Add value labels on bars
            for bar, amount in zip(bars, amounts):
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'€{amount:,.0f}',
                       ha='center', va='bottom', fontweight='bold')
            
            plt.xticks(rotation=45, ha='right')
            plt.tight_layout()
            
            # Save chart to BytesIO
            chart_buffer = BytesIO()
            plt.savefig(chart_buffer, format='png', dpi=150, bbox_inches='tight')
            chart_buffer.seek(0)
            plt.close()
            
            # Add chart to PDF
            story.append(Paragraph("Budget Analysis Chart", heading_style))
            chart_image = ReportLabImage(chart_buffer, width=6*inch, height=3.6*inch)
            story.append(chart_image)
            story.append(Spacer(1, 20))
            
        except Exception as e:
            logging.warning(f"Could not generate budget chart: {e}")
        
        # Generate Cost Breakdown Pie Chart
        if summary.cost_breakdown:
            try:
                fig, ax = plt.subplots(figsize=(8, 8))
                
                categories = list(summary.cost_breakdown.keys())
                amounts = list(summary.cost_breakdown.values())
                colors_pie = plt.cm.Set3(range(len(categories)))
                
                wedges, texts, autotexts = ax.pie(amounts, labels=categories, autopct='%1.1f%%', 
                                                 colors=colors_pie, startangle=90)
                
                # Improve text formatting
                for autotext in autotexts:
                    autotext.set_color('white')
                    autotext.set_fontweight('bold')
                    autotext.set_fontsize(10)
                
                for text in texts:
                    text.set_fontsize(10)
                
                ax.set_title('Cost Breakdown by Category', fontsize=14, fontweight='bold', pad=20)
                
                # Add legend with amounts
                legend_labels = [f'{cat}: €{amt:,.0f}' for cat, amt in zip(categories, amounts)]
                ax.legend(legend_labels, loc='center left', bbox_to_anchor=(1, 0.5))
                
                plt.tight_layout()
                
                # Save chart to BytesIO
                pie_chart_buffer = BytesIO()
                plt.savefig(pie_chart_buffer, format='png', dpi=150, bbox_inches='tight')
                pie_chart_buffer.seek(0)
                plt.close()
                
                # Add chart to PDF
                story.append(Paragraph("Cost Breakdown by Category", heading_style))
                pie_chart_image = ReportLabImage(pie_chart_buffer, width=6*inch, height=6*inch)
                story.append(pie_chart_image)
                story.append(Spacer(1, 20))
                
            except Exception as e:
                logging.warning(f"Could not generate pie chart: {e}")
        
        # Cost Breakdown Table
        if summary.cost_breakdown:
            story.append(Paragraph("Detailed Cost Breakdown", heading_style))
            breakdown_data = [["Category", "Amount", "Percentage"]]
            total_costs = sum(summary.cost_breakdown.values())
            for category, amount in summary.cost_breakdown.items():
                percentage = (amount / total_costs * 100) if total_costs > 0 else 0
                breakdown_data.append([category, f"€{amount:,.2f}", f"{percentage:.1f}%"])
            
            breakdown_table = Table(breakdown_data, colWidths=[3*inch, 2*inch, 1*inch])
            breakdown_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(breakdown_table)
            story.append(Spacer(1, 20))
        
        # Phases Summary
        if summary.phases_summary:
            story.append(Paragraph("Phases Summary", heading_style))
            phases_data = [["Phase", "Budget Allocated", "Amount Spent", "Remaining", "Status"]]
            for phase in summary.phases_summary:
                phases_data.append([
                    phase['name'],
                    f"€{phase['budget_allocated']:,.2f}",
                    f"€{phase['amount_spent']:,.2f}",
                    f"€{phase['budget_remaining']:,.2f}",
                    phase['status'].replace('_', ' ').title()
                ])
            
            phases_table = Table(phases_data, colWidths=[2*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1*inch])
            phases_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(phases_table)
        
        # Build PDF
        doc.build(story)
        
        # Get PDF content
        pdf_content = buffer.getvalue()
        buffer.close()
        
        # Return PDF response
        from fastapi.responses import Response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=project_report_{project.name.replace(' ', '_')}.pdf"}
        )
        
    except ImportError:
        # Fallback if reportlab is not installed
        raise HTTPException(status_code=501, detail="PDF generation not available. Please install reportlab: pip install reportlab matplotlib")
    except Exception as e:
        logging.error(f"PDF export error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

# Initialize default cost categories
@api_router.post("/initialize-default-categories")
async def initialize_default_categories():
    default_categories = [
        {"name": "Internal Hours", "type": "hourly", "description": "Internal team member hours", "default_rate": 50.0},
        {"name": "External Hours", "type": "hourly", "description": "External contractor hours", "default_rate": 75.0},
        {"name": "Materials", "type": "material", "description": "Raw materials and supplies"},
        {"name": "Mechanical Costs", "type": "fixed", "description": "Mechanical equipment and services"},
        {"name": "Software Licenses", "type": "fixed", "description": "Software and licensing costs"},
        {"name": "Travel & Expenses", "type": "fixed", "description": "Travel and miscellaneous expenses"},
    ]
    
    for cat_data in default_categories:
        existing = await db.cost_categories.find_one({"name": cat_data["name"]})
        if not existing:
            category_obj = CostCategory(**cat_data)
            await db.cost_categories.insert_one(category_obj.dict())
    
    return {"message": "Default categories initialized"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()