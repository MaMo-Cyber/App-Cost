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
    entry_date: Optional[date] = None

class ProjectSummary(BaseModel):
    project: Project
    total_spent: float
    budget_remaining: float
    budget_utilization: float
    phases_summary: List[Dict[str, Any]]
    cost_breakdown: Dict[str, float]
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
    # Check if project has cost entries or phases
    cost_entries = await db.cost_entries.find({"project_id": project_id}).to_list(1)
    phases = await db.phases.find({"project_id": project_id}).to_list(1)
    
    if cost_entries or phases:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete project with existing cost entries or phases. Remove them first."
        )
    
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

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
    
    if not entry.entry_date:
        entry_dict["entry_date"] = date.today()
    
    entry_obj = CostEntry(**entry_dict)
    
    # Convert date objects to strings for MongoDB storage
    entry_data = entry_obj.dict()
    if isinstance(entry_data.get('entry_date'), date):
        entry_data['entry_date'] = entry_data['entry_date'].isoformat()
    
    await db.cost_entries.insert_one(entry_data)
    return entry_obj

@api_router.get("/projects/{project_id}/cost-entries", response_model=List[CostEntry])
async def get_project_cost_entries(project_id: str):
    entries = await db.cost_entries.find({"project_id": project_id}).to_list(1000)
    return [CostEntry(**entry) for entry in entries]

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
    for entry in cost_entries:
        category = entry.get("category_name", "Unknown")
        cost_breakdown[category] = cost_breakdown.get(category, 0) + entry.get("total_amount", 0)
    
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
        budget_remaining=project["total_budget"] - total_spent,
        budget_utilization=budget_utilization,
        phases_summary=phases_summary,
        cost_breakdown=cost_breakdown,
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