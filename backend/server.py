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
from datetime import datetime, date, timedelta
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

# Obligation/Commitment Model
class Obligation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    category_id: str
    category_name: str
    description: str
    amount: float
    commitment_date: date = Field(default_factory=date.today)
    expected_incur_date: Optional[date] = None  # When we expect this to become actual cost
    status: str = "committed"  # committed, cancelled, converted_to_actual
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ObligationCreate(BaseModel):
    project_id: str
    category_id: str
    description: str
    amount: float
    expected_incur_date: Optional[date] = None

class EVMCalculation(BaseModel):
    # Basic values
    budget_at_completion: float  # BAC
    actual_cost: float  # AC
    earned_value: float  # EV
    planned_value: float  # PV
    total_obligations: float  # Total committed costs
    
    # Standard Variances
    cost_variance: float  # CV = EV - AC
    schedule_variance: float  # SV = EV - PV
    
    # Standard Performance Indices
    cost_performance_index: float  # CPI = EV / AC
    schedule_performance_index: float  # SPI = EV / PV
    
    # Enhanced Performance Indices (with obligations)
    cost_performance_index_adj: float  # CPI_adj = EV / (AC + Obligations)
    cost_variance_adj: float  # CV_adj = EV - (AC + Obligations)
    
    # Standard Forecasting
    estimate_at_completion: float  # EAC = BAC / CPI
    variance_at_completion: float  # VAC = BAC - EAC
    estimate_to_complete: float  # ETC = EAC - AC
    
    # Enhanced Forecasting (with obligations)
    estimate_at_completion_adj: float  # EAC_adj = AC + Obligations + ETC_adj
    variance_at_completion_adj: float  # VAC_adj = BAC - EAC_adj
    estimate_to_complete_adj: float  # ETC_adj (dynamic based on performance)
    
    # Status indicators
    cost_status: str  # "Under Budget", "Over Budget", "On Budget"
    cost_status_adj: str  # Status based on adjusted metrics
    schedule_status: str  # "Ahead", "Behind", "On Schedule"
    
    # Risk indicators
    budget_breach_risk: bool  # True if EAC_adj > BAC
    breach_severity: str  # "None", "Low", "Medium", "High"

# Enhanced EVM Calculation Functions
def calculate_enhanced_evm_metrics(
    project: Project, 
    total_spent: float, 
    total_obligations: float = 0.0,
    project_progress: float = None,
    manual_etc: Optional[float] = None,
    include_obligations: bool = True
) -> EVMCalculation:
    """
    Calculate Enhanced Earned Value Management metrics with obligations
    
    Args:
        project: Project object with budget and estimates
        total_spent: Actual cost to date (AC)
        total_obligations: Total committed costs not yet incurred
        project_progress: Percentage of project completion (0-1)
        manual_etc: Manual override for Estimate to Complete
        include_obligations: Whether to include obligations in adjusted calculations
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
    
    # Calculate Earned Value (EV) - enhanced logic
    if hasattr(project, 'cost_estimates') and project.cost_estimates:
        estimated_total = sum(project.cost_estimates.values()) if project.cost_estimates else budget_at_completion
        if estimated_total > 0:
            # More sophisticated EV calculation considering both cost and schedule performance
            cost_based_progress = (actual_cost + total_obligations) / estimated_total
            schedule_based_progress = project_progress
            
            # Weighted average with more emphasis on actual progress indicators
            estimated_progress = min(
                (cost_based_progress * 0.4 + schedule_based_progress * 0.6), 
                1.0
            )
            earned_value = estimated_progress * budget_at_completion
        else:
            earned_value = planned_value * 0.8
    else:
        earned_value = planned_value * 0.8
    
    # Ensure EV doesn't exceed BAC
    earned_value = min(earned_value, budget_at_completion)
    
    # Standard calculations
    cost_variance = earned_value - actual_cost  # CV
    schedule_variance = earned_value - planned_value  # SV
    
    cost_performance_index = earned_value / actual_cost if actual_cost > 0 else 1.0  # CPI
    schedule_performance_index = earned_value / planned_value if planned_value > 0 else 1.0  # SPI
    
    # Enhanced calculations with obligations
    obligations_amount = total_obligations if include_obligations else 0.0
    total_committed = actual_cost + obligations_amount
    
    cost_performance_index_adj = earned_value / total_committed if total_committed > 0 else 1.0  # CPI_adj
    cost_variance_adj = earned_value - total_committed  # CV_adj
    
    # Standard forecasting
    estimate_at_completion = budget_at_completion / cost_performance_index if cost_performance_index > 0 else budget_at_completion
    variance_at_completion = budget_at_completion - estimate_at_completion
    estimate_to_complete = estimate_at_completion - actual_cost
    
    # Enhanced forecasting with obligations
    if manual_etc is not None:
        estimate_to_complete_adj = manual_etc
    else:
        # Dynamic ETC calculation based on performance
        remaining_work_percent = max(1.0 - (earned_value / budget_at_completion), 0.0)
        base_remaining_budget = budget_at_completion * remaining_work_percent
        
        # Adjust ETC based on cost performance
        if cost_performance_index_adj < 1.0:
            # Performance is poor, increase ETC
            performance_factor = 1.0 / cost_performance_index_adj
            estimate_to_complete_adj = base_remaining_budget * performance_factor
        else:
            # Performance is good, use conservative estimate
            estimate_to_complete_adj = base_remaining_budget * 1.1  # 10% buffer
    
    estimate_at_completion_adj = actual_cost + obligations_amount + estimate_to_complete_adj
    variance_at_completion_adj = budget_at_completion - estimate_at_completion_adj
    
    # Determine status indicators
    def get_cost_status(cpi_value):
        if cpi_value > 1.05:
            return "Under Budget"
        elif cpi_value < 0.95:
            return "Over Budget"
        else:
            return "On Budget"
    
    cost_status = get_cost_status(cost_performance_index)
    cost_status_adj = get_cost_status(cost_performance_index_adj)
    
    if schedule_performance_index > 1.05:
        schedule_status = "Ahead"
    elif schedule_performance_index < 0.95:
        schedule_status = "Behind"
    else:
        schedule_status = "On Schedule"
    
    # Risk assessment
    budget_breach_risk = estimate_at_completion_adj > budget_at_completion
    
    if not budget_breach_risk:
        breach_severity = "None"
    else:
        breach_percent = ((estimate_at_completion_adj - budget_at_completion) / budget_at_completion) * 100
        if breach_percent < 5:
            breach_severity = "Low"
        elif breach_percent < 15:
            breach_severity = "Medium"
        else:
            breach_severity = "High"
    
    return EVMCalculation(
        budget_at_completion=budget_at_completion,
        actual_cost=actual_cost,
        earned_value=earned_value,
        planned_value=planned_value,
        total_obligations=obligations_amount,
        cost_variance=cost_variance,
        schedule_variance=schedule_variance,
        cost_performance_index=cost_performance_index,
        schedule_performance_index=schedule_performance_index,
        cost_performance_index_adj=cost_performance_index_adj,
        cost_variance_adj=cost_variance_adj,
        estimate_at_completion=estimate_at_completion,
        variance_at_completion=variance_at_completion,
        estimate_to_complete=estimate_to_complete,
        estimate_at_completion_adj=estimate_at_completion_adj,
        variance_at_completion_adj=variance_at_completion_adj,
        estimate_to_complete_adj=estimate_to_complete_adj,
        cost_status=cost_status,
        cost_status_adj=cost_status_adj,
        schedule_status=schedule_status,
        budget_breach_risk=budget_breach_risk,
        breach_severity=breach_severity
    )

# Legacy function for backward compatibility
def calculate_evm_metrics(project: Project, total_spent: float, project_progress: float = None) -> EVMCalculation:
    """
    Legacy EVM calculation - maintained for backward compatibility
    Calls the enhanced function with default obligations = 0
    """
    return calculate_enhanced_evm_metrics(
        project=project,
        total_spent=total_spent,
        total_obligations=0.0,
        project_progress=project_progress,
        include_obligations=False
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

# Obligation/Commitment routes
@api_router.post("/obligations", response_model=Obligation)
async def create_obligation(obligation: ObligationCreate):
    try:
        # Get category info
        category = await db.cost_categories.find_one({"id": obligation.category_id})
        if not category:
            raise HTTPException(status_code=404, detail="Cost category not found")
        
        obligation_dict = obligation.dict()
        obligation_dict["id"] = str(uuid.uuid4())
        obligation_dict["category_name"] = category["name"]
        obligation_dict["status"] = "committed"
        obligation_dict["created_at"] = datetime.utcnow().isoformat()
        
        # Handle dates
        if obligation_dict.get("expected_incur_date"):
            if hasattr(obligation_dict["expected_incur_date"], 'isoformat'):
                obligation_dict["expected_incur_date"] = obligation_dict["expected_incur_date"].isoformat()
        
        obligation_dict["commitment_date"] = date.today().isoformat()
        
        await db.obligations.insert_one(obligation_dict)
        
        # Convert back for response
        return_data = obligation_dict.copy()
        if return_data.get("commitment_date"):
            return_data["commitment_date"] = datetime.fromisoformat(return_data["commitment_date"]).date()
        if return_data.get("expected_incur_date"):
            return_data["expected_incur_date"] = datetime.fromisoformat(return_data["expected_incur_date"]).date()
        if return_data.get("created_at"):
            return_data["created_at"] = datetime.fromisoformat(return_data["created_at"])
        
        return Obligation(**return_data)
        
    except Exception as e:
        logging.error(f"Error creating obligation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating obligation: {str(e)}")

@api_router.get("/projects/{project_id}/obligations", response_model=List[Obligation])
async def get_project_obligations(project_id: str):
    obligations = await db.obligations.find({"project_id": project_id, "status": "committed"}).to_list(1000)
    return [Obligation(**obligation) for obligation in obligations]

@api_router.put("/obligations/{obligation_id}/status")
async def update_obligation_status(obligation_id: str, status_data: dict):
    status = status_data.get("status")
    if status not in ["committed", "cancelled", "converted_to_actual"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.obligations.update_one(
        {"id": obligation_id}, 
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Obligation not found")
    
    return {"message": "Obligation status updated"}

@api_router.delete("/obligations/{obligation_id}")
async def delete_obligation(obligation_id: str):
    result = await db.obligations.delete_one({"id": obligation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return {"message": "Obligation deleted"}

@api_router.get("/projects/{project_id}/obligations/summary")
async def get_project_obligations_summary(project_id: str):
    """Get summary of obligations by category"""
    obligations = await db.obligations.find({
        "project_id": project_id, 
        "status": "committed"
    }).to_list(1000)
    
    total_obligations = sum(obj.get("amount", 0) for obj in obligations)
    
    # Group by category
    by_category = {}
    for obj in obligations:
        category = obj.get("category_name", "Unknown")
        if category not in by_category:
            by_category[category] = {"count": 0, "total": 0, "items": []}
        by_category[category]["count"] += 1
        by_category[category]["total"] += obj.get("amount", 0)
        by_category[category]["items"].append(obj)
    
    return {
        "total_obligations": total_obligations,
        "total_count": len(obligations),
        "by_category": by_category
    }
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

@api_router.post("/create-ongoing-demo-project")
async def create_ongoing_demo_project():
    """Create an ongoing demo project (50% complete) with realistic EVM progression for future analysis"""
    
    # Current date for realistic timeline
    today = date.today()
    project_start = today - timedelta(days=180)  # Started 6 months ago
    project_end = today + timedelta(days=180)    # Ends in 6 months (50% complete)
    
    # Demo project data - Ongoing Industrial Project
    project_data = {
        "id": str(uuid.uuid4()),
        "name": "Smart Manufacturing Integration Project",
        "description": "Ongoing integration of IoT sensors, AI analytics, and automated control systems across manufacturing lines",
        "total_budget": 1200000.0,  # €1.2M project
        "start_date": project_start.isoformat(),
        "end_date": project_end.isoformat(),
        "status": "active",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        
        # Detailed cost estimates (BAC breakdown)
        "cost_estimates": {
            "Equipment + Installation": 180000.0,
            "Installation + transport": 65000.0,
            "Equipment": 145000.0,
            "Steelwork": 85000.0,
            "Piping + installation": 75000.0,
            "Planning (INT)": 80000.0,
            "Planning (EXT)": 45000.0,
            "Project management": 72000.0,
            "Process engineering": 95000.0,
            "Automation engineering": 125000.0,
            "Civil engineering": 58000.0,
            "Qualification": 42000.0,
            "Instrumentation": 88000.0,
            "Installation (incl. cabling)": 78000.0,
            "Automation": 112000.0,
            "Hardware": 135000.0,
            "Software": 68000.0,
            "Civil": 48000.0,
            "Support": 35000.0,
            "Scaffolding": 28000.0,
            "Site facilities": 38000.0,
            "HVAC": 52000.0,
            "Contingency (10%)": 109090.0  # 10% of total above
        },
        "estimated_total": 1200000.0
    }
    
    # Insert demo project
    await db.projects.insert_one(project_data)
    
    # Create demo phases - some completed, some ongoing, some future
    phases_data = [
        {
            "id": str(uuid.uuid4()),
            "project_id": project_data["id"],
            "name": "Phase 1: Planning & Design",
            "description": "System architecture, technical specifications, and detailed planning",
            "start_date": project_start.isoformat(),
            "end_date": (project_start + timedelta(days=60)).isoformat(),
            "status": "completed",
            "budget_allocation": 250000.0,
            "completion_percentage": 100
        },
        {
            "id": str(uuid.uuid4()),
            "project_id": project_data["id"],
            "name": "Phase 2: Infrastructure & Setup",
            "description": "Network infrastructure, hardware installation, and base systems",
            "start_date": (project_start + timedelta(days=45)).isoformat(),
            "end_date": (project_start + timedelta(days=150)).isoformat(),
            "status": "in_progress",
            "budget_allocation": 400000.0,
            "completion_percentage": 75
        },
        {
            "id": str(uuid.uuid4()),
            "project_id": project_data["id"],
            "name": "Phase 3: Software Integration",
            "description": "AI analytics, control software, and system integration",
            "start_date": (project_start + timedelta(days=120)).isoformat(),
            "end_date": (today + timedelta(days=90)).isoformat(),
            "status": "in_progress",
            "budget_allocation": 350000.0,
            "completion_percentage": 25
        },
        {
            "id": str(uuid.uuid4()),
            "project_id": project_data["id"],
            "name": "Phase 4: Testing & Optimization",
            "description": "System testing, performance optimization, and quality assurance",
            "start_date": (today + timedelta(days=30)).isoformat(),
            "end_date": (today + timedelta(days=150)).isoformat(),
            "status": "not_started",
            "budget_allocation": 150000.0,
            "completion_percentage": 0
        },
        {
            "id": str(uuid.uuid4()),
            "project_id": project_data["id"],
            "name": "Phase 5: Deployment & Handover",
            "description": "Final deployment, user training, and project handover",
            "start_date": (today + timedelta(days=120)).isoformat(),
            "end_date": project_end.isoformat(),
            "status": "not_started",
            "budget_allocation": 50000.0,
            "completion_percentage": 0
        }
    ]
    
    for phase in phases_data:
        await db.phases.insert_one(phase)
    
    # Create realistic cost entries showing progressive spending (project 50% complete, some overruns)
    cost_entries_data = [
        # Phase 1: Planning & Design (COMPLETED - slight overrun)
        {"category": "Planning (INT)", "amount": 28000, "date": (project_start + timedelta(days=10)).isoformat(), "status": "paid"},
        {"category": "Planning (EXT)", "amount": 18000, "date": (project_start + timedelta(days=15)).isoformat(), "status": "paid"},
        {"category": "Project management", "amount": 15000, "date": (project_start + timedelta(days=20)).isoformat(), "status": "paid"},
        {"category": "Process engineering", "amount": 32000, "date": (project_start + timedelta(days=25)).isoformat(), "status": "paid"},
        {"category": "Planning (INT)", "amount": 35000, "date": (project_start + timedelta(days=35)).isoformat(), "status": "paid"},  # Over estimate
        {"category": "Planning (EXT)", "amount": 32000, "date": (project_start + timedelta(days=45)).isoformat(), "status": "paid"},  # Over estimate
        {"category": "Software", "amount": 25000, "date": (project_start + timedelta(days=50)).isoformat(), "status": "paid"},
        {"category": "Automation engineering", "amount": 42000, "date": (project_start + timedelta(days=55)).isoformat(), "status": "paid"},
        
        # Phase 2: Infrastructure & Setup (75% COMPLETE - significant overruns starting)
        {"category": "Equipment", "amount": 95000, "date": (project_start + timedelta(days=70)).isoformat(), "status": "paid"},
        {"category": "Hardware", "amount": 88000, "date": (project_start + timedelta(days=80)).isoformat(), "status": "paid"},
        {"category": "Equipment + Installation", "amount": 125000, "date": (project_start + timedelta(days=90)).isoformat(), "status": "paid"},  # Over estimate
        {"category": "Instrumentation", "amount": 72000, "date": (project_start + timedelta(days=100)).isoformat(), "status": "paid"},
        {"category": "Hardware", "amount": 85000, "date": (project_start + timedelta(days=110)).isoformat(), "status": "outstanding"},  # Over estimate, outstanding
        {"category": "Installation + transport", "amount": 48000, "date": (project_start + timedelta(days=120)).isoformat(), "status": "outstanding"},
        {"category": "Steelwork", "amount": 92000, "date": (project_start + timedelta(days=130)).isoformat(), "status": "outstanding"},  # Over estimate
        {"category": "Civil engineering", "amount": 45000, "date": (project_start + timedelta(days=140)).isoformat(), "status": "outstanding"},
        
        # Phase 3: Software Integration (25% COMPLETE - ongoing with some early costs)
        {"category": "Automation", "amount": 65000, "date": (project_start + timedelta(days=155)).isoformat(), "status": "outstanding"},
        {"category": "Software", "amount": 38000, "date": (project_start + timedelta(days=165)).isoformat(), "status": "outstanding"},
        {"category": "Automation engineering", "amount": 55000, "date": (project_start + timedelta(days=170)).isoformat(), "status": "outstanding"},
        
        # Recent costs (last 2 weeks)
        {"category": "Project management", "amount": 18000, "date": (today - timedelta(days=10)).isoformat(), "status": "paid"},
        {"category": "Support", "amount": 22000, "date": (today - timedelta(days=5)).isoformat(), "status": "outstanding"},
    ]
    
    # Insert cost entries with proper phase distribution
    for i, entry in enumerate(cost_entries_data):
        entry_data = {
            "id": str(uuid.uuid4()),
            "project_id": project_data["id"],
            "category_id": str(uuid.uuid4()),
            "category_name": entry["category"],
            "description": f"Work package: {entry['category']} - {['Planning phase', 'Infrastructure phase', 'Integration phase', 'Current work'][min(i//6, 3)]}",
            "total_amount": entry["amount"],
            "entry_date": entry["date"],
            "status": entry["status"],
            "due_date": (datetime.fromisoformat(entry["date"]).date() + timedelta(days=30)).isoformat() if entry["status"] == "outstanding" else None,
            "created_at": datetime.utcnow().isoformat(),
            "hours": None,
            "hourly_rate": None,
            "quantity": None,
            "unit_price": None,
            "phase_id": phases_data[min(i // 5, 4)]["id"]  # Distribute across phases
        }
        
        await db.cost_entries.insert_one(entry_data)
    
    return {
        "message": "Ongoing demo project created successfully!",
        "project_id": project_data["id"],
        "project_name": project_data["name"],
        "total_budget": project_data["total_budget"],
        "estimated_total": project_data["estimated_total"],
        "project_status": "ongoing (50% complete)",
        "cost_entries_created": len(cost_entries_data),
        "phases_created": len(phases_data),
        "completion_status": {
            "phase_1": "Completed (some overruns)",
            "phase_2": "75% complete (significant overruns)",
            "phase_3": "25% complete (early stage)",
            "phase_4": "Not started (future)",
            "phase_5": "Not started (future)"
        }
    }

@api_router.post("/create-demo-project")
async def create_demo_project():
    """Create a comprehensive demo project with realistic EVM data"""
    
    # Demo project data
    project_data = {
        "id": str(uuid.uuid4()),
        "name": "Industrial Automation System Implementation",
        "description": "Complete automation system for manufacturing facility including PLC integration, SCADA system, and process optimization",
        "total_budget": 850000.0,  # €850K
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "status": "active",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        
        # Detailed cost estimates (BAC breakdown)
        "cost_estimates": {
            "Equipment + Installation": 120000.0,
            "Installation + transport": 45000.0,
            "Equipment": 95000.0,
            "Steelwork": 75000.0,
            "Piping + installation": 65000.0,
            "Planning (INT)": 55000.0,
            "Planning (EXT)": 35000.0,
            "Project management": 48000.0,
            "Process engineering": 67000.0,
            "Automation engineering": 85000.0,
            "Civil engineering": 42000.0,
            "Qualification": 28000.0,
            "Instrumentation": 58000.0,
            "Installation (incl. cabling)": 52000.0,
            "Automation": 78000.0,
            "Hardware": 89000.0,
            "Software": 43000.0,
            "Civil": 33000.0,
            "Support": 25000.0,
            "Scaffolding": 18000.0,
            "Site facilities": 22000.0,
            "HVAC": 37000.0,
            "Contingency (10%)": 77273.0  # 10% of total above
        },
        "estimated_total": 850000.0
    }
    
    # Insert demo project
    await db.projects.insert_one(project_data)
    
    # Create demo phases
    phases_data = [
        {
            "id": str(uuid.uuid4()),
            "project_id": project_data["id"],
            "name": "Planning & Design",
            "description": "Initial planning, design, and specification phase",
            "start_date": "2024-01-01",
            "end_date": "2024-03-31",
            "status": "completed",
            "budget_allocation": 150000.0
        },
        {
            "id": str(uuid.uuid4()),
            "project_id": project_data["id"],
            "name": "Procurement & Manufacturing",
            "description": "Equipment procurement and custom manufacturing",
            "start_date": "2024-02-01",
            "end_date": "2024-06-30",
            "status": "in_progress",
            "budget_allocation": 300000.0
        },
        {
            "id": str(uuid.uuid4()),
            "project_id": project_data["id"],
            "name": "Installation & Integration",
            "description": "On-site installation and system integration",
            "start_date": "2024-05-01",
            "end_date": "2024-09-30",
            "status": "not_started",
            "budget_allocation": 250000.0
        },
        {
            "id": str(uuid.uuid4()),
            "project_id": project_data["id"],
            "name": "Testing & Commissioning",
            "description": "System testing, commissioning, and handover",
            "start_date": "2024-09-01",
            "end_date": "2024-12-31",
            "status": "not_started",
            "budget_allocation": 150000.0
        }
    ]
    
    for phase in phases_data:
        await db.phases.insert_one(phase)
    
    # Create realistic cost entries showing progressive spending with overruns
    cost_entries_data = [
        # Month 1-2: Planning phase (slightly over)
        {"category": "Planning (INT)", "amount": 18000, "date": "2024-01-15", "status": "paid"},
        {"category": "Planning (EXT)", "amount": 12000, "date": "2024-01-20", "status": "paid"},
        {"category": "Project management", "amount": 8000, "date": "2024-01-25", "status": "paid"},
        {"category": "Process engineering", "amount": 15000, "date": "2024-02-10", "status": "paid"},
        {"category": "Planning (INT)", "amount": 22000, "date": "2024-02-15", "status": "paid"},  # Over estimate
        {"category": "Civil engineering", "amount": 14000, "date": "2024-02-20", "status": "paid"},
        
        # Month 3-4: Design completion and procurement start (over budget)
        {"category": "Planning (EXT)", "amount": 28000, "date": "2024-03-05", "status": "paid"},  # Over estimate
        {"category": "Automation engineering", "amount": 25000, "date": "2024-03-10", "status": "paid"},
        {"category": "Software", "amount": 35000, "date": "2024-03-15", "status": "paid"},
        {"category": "Project management", "amount": 12000, "date": "2024-03-25", "status": "paid"},
        {"category": "Equipment", "amount": 45000, "date": "2024-04-01", "status": "paid"},
        {"category": "Hardware", "amount": 52000, "date": "2024-04-10", "status": "paid"},
        
        # Month 5-6: Major equipment procurement (significant overruns)
        {"category": "Equipment", "amount": 65000, "date": "2024-05-01", "status": "paid"},  # Over estimate
        {"category": "Equipment + Installation", "amount": 85000, "date": "2024-05-15", "status": "outstanding"},  # Over estimate
        {"category": "Instrumentation", "amount": 45000, "date": "2024-05-20", "status": "paid"},
        {"category": "Hardware", "amount": 55000, "date": "2024-06-01", "status": "outstanding"},  # Over estimate
        {"category": "Automation", "amount": 42000, "date": "2024-06-10", "status": "paid"},
        {"category": "Installation + transport", "amount": 35000, "date": "2024-06-15", "status": "outstanding"},
        
        # Month 7-8: Installation phase (continuing overruns)
        {"category": "Steelwork", "amount": 48000, "date": "2024-07-01", "status": "paid"},
        {"category": "Piping + installation", "amount": 72000, "date": "2024-07-15", "status": "outstanding"},  # Over estimate
        {"category": "Installation (incl. cabling)", "amount": 58000, "date": "2024-07-25", "status": "outstanding"},  # Over estimate
        {"category": "Civil engineering", "amount": 35000, "date": "2024-08-05", "status": "outstanding"},  # Over estimate
        {"category": "HVAC", "amount": 42000, "date": "2024-08-15", "status": "outstanding"},  # Over estimate
        {"category": "Support", "amount": 18000, "date": "2024-08-20", "status": "paid"},
    ]
    
    # Insert cost entries
    for i, entry in enumerate(cost_entries_data):
        entry_data = {
            "id": str(uuid.uuid4()),
            "project_id": project_data["id"],
            "category_id": str(uuid.uuid4()),
            "category_name": entry["category"],
            "description": f"Demo cost entry for {entry['category']}",
            "total_amount": entry["amount"],
            "entry_date": entry["date"],
            "status": entry["status"],
            "due_date": datetime.fromisoformat(entry["date"]).date() + timedelta(days=30) if entry["status"] == "outstanding" else None,
            "created_at": datetime.utcnow().isoformat(),
            "hours": None,
            "hourly_rate": None,
            "quantity": None,
            "unit_price": None,
            "phase_id": phases_data[min(i // 8, 3)]["id"]  # Distribute across phases
        }
        
        # Convert due_date to string if it exists
        if entry_data["due_date"]:
            entry_data["due_date"] = entry_data["due_date"].isoformat()
            
        await db.cost_entries.insert_one(entry_data)
    
    return {
        "message": "Demo project created successfully!",
        "project_id": project_data["id"],
        "project_name": project_data["name"],
        "total_budget": project_data["total_budget"],
        "estimated_total": project_data["estimated_total"],
        "cost_entries_created": len(cost_entries_data),
        "phases_created": len(phases_data)
    }

@api_router.get("/projects/{project_id}/evm-timeline")
async def get_evm_timeline(project_id: str):
    """Get comprehensive EVM timeline data including Cost Baseline and Cost Trend Line"""
    
    # Get project
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get cost entries sorted by date
    cost_entries = await db.cost_entries.find({"project_id": project_id}).to_list(1000)
    cost_entries = sorted(cost_entries, key=lambda x: x.get("entry_date", ""))
    
    project_start = datetime.fromisoformat(project["start_date"]).date()
    project_end = datetime.fromisoformat(project["end_date"]).date()
    today = date.today()
    
    project_duration_days = (project_end - project_start).days
    project_duration_months = project_duration_days / 30.44  # Average days per month
    total_budget = project["total_budget"]
    
    # Calculate cost baseline distribution (S-curve)
    # Use cost estimates if available, otherwise linear distribution
    cost_baseline_monthly = []
    if project.get("cost_estimates") and sum(project["cost_estimates"].values()) > 0:
        # Distribute cost estimates over project phases using S-curve
        total_estimated = sum(project["cost_estimates"].values())
        for month in range(int(project_duration_months) + 1):
            # S-curve distribution: slower start, faster middle, slower end
            progress_ratio = month / project_duration_months if project_duration_months > 0 else 0
            # S-curve formula: 3*t^2 - 2*t^3 for smoother distribution
            s_curve_factor = 3 * (progress_ratio ** 2) - 2 * (progress_ratio ** 3)
            planned_cumulative = min(s_curve_factor * total_budget, total_budget)
            cost_baseline_monthly.append(planned_cumulative)
    else:
        # Linear distribution if no cost estimates
        monthly_planned_budget = total_budget / project_duration_months if project_duration_months > 0 else 0
        for month in range(int(project_duration_months) + 1):
            planned_cumulative = min(monthly_planned_budget * (month + 1), total_budget)
            cost_baseline_monthly.append(planned_cumulative)
    
    # Generate comprehensive timeline data
    timeline_data = []
    eac_trend_data = []  # For cost trend line
    cumulative_actual = 0
    
    # Extend timeline beyond project end for predictions if project is ongoing
    timeline_months = int(project_duration_months) + 1
    if today < project_end:
        # Add 3 more months for prediction if project is ongoing
        timeline_months += 3
    
    for month in range(timeline_months):
        month_date = project_start.replace(day=1) + timedelta(days=30.44 * month)
        month_str = month_date.strftime("%Y-%m")
        
        # Cost Baseline (Planned Value)
        if month < len(cost_baseline_monthly):
            planned_value = cost_baseline_monthly[month]
        else:
            planned_value = total_budget  # Cap at total budget
        
        # Calculate cumulative Actual Cost (AC) up to this month
        month_actual = sum(
            entry.get("total_amount", 0) 
            for entry in cost_entries 
            if entry.get("entry_date", "") <= month_date.isoformat()
        )
        
        # Calculate Earned Value (EV) based on cost performance
        if month_actual > 0:
            # More sophisticated EV calculation based on project phases
            spending_ratio = month_actual / total_budget if total_budget > 0 else 0
            
            # If we have cost estimates, use them for better EV calculation
            if project.get("cost_estimates"):
                # Calculate progress based on cost categories completion
                total_estimated = sum(project["cost_estimates"].values())
                if total_estimated > 0:
                    # Conservative EV: assume 85-90% efficiency based on spending
                    efficiency_factor = 0.85 + (0.05 * min(spending_ratio, 1.0))  # 85-90% efficiency
                    earned_value = min(spending_ratio * total_budget * efficiency_factor, planned_value * 0.95)
                else:
                    earned_value = min(spending_ratio * total_budget * 0.85, planned_value * 0.9)
            else:
                earned_value = min(spending_ratio * total_budget * 0.85, planned_value * 0.9)
        else:
            earned_value = 0
        
        # Calculate performance indices
        cpi = earned_value / month_actual if month_actual > 0 else 1.0
        spi = earned_value / planned_value if planned_value > 0 else 1.0
        
        # Calculate EAC (Estimate at Completion) for Cost Trend Line
        if cpi > 0:
            eac = total_budget / cpi
        else:
            eac = total_budget
        
        # For future months (predictions), adjust EAC based on trend
        if month_date > today:
            # Use latest CPI for future predictions
            latest_cpi = timeline_data[-1]["cpi"] if timeline_data else 1.0
            if latest_cpi > 0:
                eac = total_budget / latest_cpi
                # Add uncertainty factor for far future
                months_ahead = (month_date.year - today.year) * 12 + (month_date.month - today.month)
                uncertainty_factor = 1 + (months_ahead * 0.02)  # 2% uncertainty per month
                eac *= uncertainty_factor
        
        # Cost variance and schedule variance
        cost_variance = earned_value - month_actual
        schedule_variance = earned_value - planned_value
        
        # Estimate to Complete (ETC)
        etc = eac - month_actual
        
        # Variance at Completion (VAC)
        vac = total_budget - eac
        
        timeline_data.append({
            "month": month_str,
            "month_number": month + 1,
            "date": month_date.isoformat(),
            "is_future": month_date > today,
            "planned_value": round(planned_value, 2),
            "earned_value": round(earned_value, 2),
            "actual_cost": round(month_actual, 2),
            "eac": round(eac, 2),
            "etc": round(etc, 2),
            "cpi": round(cpi, 3),
            "spi": round(spi, 3),
            "cost_variance": round(cost_variance, 2),
            "schedule_variance": round(schedule_variance, 2),
            "vac": round(vac, 2)
        })
        
        # Store EAC for trend analysis
        eac_trend_data.append({
            "month": month_str,
            "eac": round(eac, 2),
            "is_prediction": month_date > today
        })
    
    # Find cost overrun point (where EAC exceeds BAC)
    overrun_point = None
    cost_trend_deterioration = None
    
    for i, point in enumerate(timeline_data):
        if point["eac"] > total_budget * 1.05:  # 5% threshold
            overrun_point = {
                "month": point["month"],
                "month_number": point["month_number"],
                "eac": point["eac"],
                "budget_exceeded_by": point["eac"] - total_budget,
                "is_prediction": point["is_future"]
            }
            break
    
    # Analyze cost trend deterioration
    if len(timeline_data) >= 3:
        recent_cpi_trend = [point["cpi"] for point in timeline_data[-3:] if not point["is_future"]]
        if len(recent_cpi_trend) >= 2:
            cpi_change = recent_cpi_trend[-1] - recent_cpi_trend[0]
            if cpi_change < -0.05:  # CPI deteriorating by more than 0.05
                cost_trend_deterioration = {
                    "cpi_change": round(cpi_change, 3),
                    "trend": "deteriorating",
                    "severity": "high" if cpi_change < -0.1 else "medium"
                }
    
    # Calculate project completion prediction
    current_data = [point for point in timeline_data if not point["is_future"]]
    if current_data:
        latest_point = current_data[-1]
        completion_prediction = {
            "current_progress_pct": round((latest_point["earned_value"] / total_budget) * 100, 1),
            "projected_completion_cost": latest_point["eac"],
            "projected_overrun_pct": round(((latest_point["eac"] - total_budget) / total_budget) * 100, 1),
            "months_remaining": max(0, len([p for p in timeline_data if p["is_future"]]) - 3),
            "cost_efficiency": "good" if latest_point["cpi"] >= 0.95 else "poor" if latest_point["cpi"] < 0.85 else "fair"
        }
    else:
        completion_prediction = None
    
    return {
        "project_name": project["name"],
        "total_budget": total_budget,
        "project_status": "ongoing" if today < project_end else "completed",
        "timeline_data": timeline_data,
        "cost_baseline": [{"month": timeline_data[i]["month"], "planned_value": point} for i, point in enumerate(cost_baseline_monthly)],
        "eac_trend": eac_trend_data,
        "overrun_point": overrun_point,
        "cost_trend_deterioration": cost_trend_deterioration,
        "completion_prediction": completion_prediction,
        "current_performance": {
            "current_cpi": timeline_data[-1]["cpi"] if timeline_data else 1.0,
            "current_spi": timeline_data[-1]["spi"] if timeline_data else 1.0,
            "final_eac": timeline_data[-1]["eac"] if timeline_data else total_budget,
            "projected_overrun": (timeline_data[-1]["eac"] - total_budget) if timeline_data else 0
        }
    }

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