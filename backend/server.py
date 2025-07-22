from fastapi import FastAPI, APIRouter, HTTPException
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

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    total_budget: float
    start_date: date
    end_date: date

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
    
    # Handle date fields properly - convert ALL dates to strings
    entry_date = entry_dict.get("entry_date")
    if entry_date:
        if isinstance(entry_date, str):
            # Try to parse and reformat to ensure consistency
            try:
                parsed_date = datetime.fromisoformat(entry_date).date()
                entry_dict["entry_date"] = parsed_date.isoformat()
            except:
                entry_dict["entry_date"] = entry_date
        elif hasattr(entry_date, 'isoformat'):
            entry_dict["entry_date"] = entry_date.isoformat()
        else:
            entry_dict["entry_date"] = str(entry_date)
    else:
        entry_dict["entry_date"] = date.today().isoformat()
    
    # Handle due_date properly
    due_date = entry_dict.get("due_date")
    if due_date:
        if isinstance(due_date, str):
            try:
                parsed_date = datetime.fromisoformat(due_date).date()
                entry_dict["due_date"] = parsed_date.isoformat()
            except:
                entry_dict["due_date"] = due_date
        elif hasattr(due_date, 'isoformat'):
            entry_dict["due_date"] = due_date.isoformat()
        else:
            entry_dict["due_date"] = str(due_date)
    else:
        entry_dict["due_date"] = None
    
    # Ensure status has default value
    if not entry_dict.get("status"):
        entry_dict["status"] = "outstanding"
    
    # Add created_at as string
    entry_dict["created_at"] = datetime.utcnow().isoformat()
    
    # Create the entry object with proper date conversion
    # Convert string dates back to date objects for the CostEntry model
    entry_date_obj = None
    if entry_dict.get("entry_date"):
        if isinstance(entry_dict["entry_date"], str):
            entry_date_obj = datetime.fromisoformat(entry_dict["entry_date"]).date()
        else:
            entry_date_obj = entry_dict["entry_date"]
    else:
        entry_date_obj = date.today()
    
    due_date_obj = None
    if entry_dict.get("due_date"):
        if isinstance(entry_dict["due_date"], str):
            due_date_obj = datetime.fromisoformat(entry_dict["due_date"]).date()
        else:
            due_date_obj = entry_dict["due_date"]
    
    created_at_obj = datetime.utcnow()
    
    entry_obj = CostEntry(
        id=str(uuid.uuid4()),
        project_id=entry_dict["project_id"],
        phase_id=entry_dict.get("phase_id"),
        category_id=entry_dict["category_id"],
        category_name=entry_dict["category_name"],
        description=entry_dict.get("description", ""),
        hours=entry_dict.get("hours"),
        hourly_rate=entry_dict.get("hourly_rate"),
        quantity=entry_dict.get("quantity"),
        unit_price=entry_dict.get("unit_price"),
        total_amount=entry_dict["total_amount"],
        status=entry_dict["status"],
        due_date=due_date_obj,
        entry_date=entry_date_obj,
        created_at=created_at_obj
    )
    
    # Prepare data for MongoDB - ensure all dates are strings
    mongo_data = {
        "id": entry_obj.id,
        "project_id": entry_obj.project_id,
        "phase_id": entry_obj.phase_id,
        "category_id": entry_obj.category_id,
        "category_name": entry_obj.category_name,
        "description": entry_obj.description,
        "hours": entry_obj.hours,
        "hourly_rate": entry_obj.hourly_rate,
        "quantity": entry_obj.quantity,
        "unit_price": entry_obj.unit_price,
        "total_amount": entry_obj.total_amount,
        "status": entry_obj.status,
        "due_date": entry_dict.get("due_date"),  # Already a string or None
        "entry_date": entry_dict["entry_date"],  # Already a string
        "created_at": entry_dict["created_at"]   # Already a string
    }
    
    await db.cost_entries.insert_one(mongo_data)
    return entry_obj

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
async def update_cost_entry_status(entry_id: str, status: str):
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
        status_indicator=status_indicator
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
    for entry in sorted(cost_entries, key=lambda x: x.get("created_at", ""), reverse=True)[:10]:
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