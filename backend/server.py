from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
import uuid
from datetime import datetime, timezone, timedelta
import io
import csv
import hashlib
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== PASSWORD HELPERS ==============

def hash_password(password: str) -> str:
    """Hash password with salt"""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{pwd_hash}"

def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored hash"""
    try:
        salt, pwd_hash = stored_hash.split(":")
        return hashlib.sha256((password + salt).encode()).hexdigest() == pwd_hash
    except:
        return False

# ============== MODELS ==============

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    role: str  # CRE, Receptionist, CRM
    email: Optional[str] = None
    mobile: Optional[str] = None
    department: str
    designation: str
    branch: Optional[str] = None
    is_active: bool = True
    is_locked: bool = False
    module_access: Optional[List[str]] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    password: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    branch: Optional[str] = None
    is_active: Optional[bool] = None
    is_locked: Optional[bool] = None
    module_access: Optional[List[str]] = None

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    username: str
    name: str
    role: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    department: str
    designation: str
    branch: Optional[str] = None
    is_active: bool = True
    is_locked: bool = False
    module_access: Optional[List[str]] = None
    created_at: datetime

class AppointmentCreate(BaseModel):
    branch: str
    appointment_date: str  # ISO date string
    appointment_time: str
    source: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    vehicle_reg_no: Optional[str] = None
    model: Optional[str] = None
    current_km: Optional[int] = None
    ots_recall: bool = False
    service_type: str
    allocated_sa: Optional[str] = None
    specific_repair_request: Optional[str] = None
    priority_customer: bool = False
    docket_readiness: bool = False
    recovered_lost_customer: bool = False

class AppointmentUpdate(BaseModel):
    branch: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    source: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    vehicle_reg_no: Optional[str] = None
    model: Optional[str] = None
    current_km: Optional[int] = None
    ots: Optional[bool] = None
    service_type: Optional[str] = None
    allocated_sa: Optional[str] = None
    specific_repair_request: Optional[str] = None
    priority_customer: Optional[bool] = None
    docket_readiness: Optional[bool] = None
    n_minus_1_confirmation_status: Optional[str] = None
    appointment_status: Optional[str] = None
    reschedule_date: Optional[str] = None
    reschedule_remarks: Optional[str] = None
    cancel_reason: Optional[str] = None
    lost_customer: Optional[bool] = None
    assigned_cre_user: Optional[str] = None

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    appointment_id: str
    sl_no: int
    branch: str
    appointment_date: str
    appointment_time: str
    source: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    vehicle_reg_no: Optional[str] = None
    model: Optional[str] = None
    current_km: Optional[int] = None
    ots_recall: bool = False
    service_type: str
    allocated_sa: Optional[str] = None
    specific_repair_request: Optional[str] = None
    priority_customer: bool = False
    docket_readiness: bool = False
    n_minus_1_confirmation_status: str = "Pending"
    n_minus_1_confirmation_notes: Optional[str] = None
    appointment_status: str = "Booked"
    appointment_day_outcome: Optional[str] = None
    appointment_day_outcome_notes: Optional[str] = None
    recovered_lost_customer: bool = False
    assigned_cre_user: str
    created_by_user: str
    created_at: str
    updated_at: str
    duplicate_phone_last_30_days: bool = False
    duplicate_vehicle_last_30_days: bool = False

class ColumnPreferences(BaseModel):
    hidden_columns: Optional[List[str]] = None
    column_order: Optional[List[str]] = None

class SettingsUpdate(BaseModel):
    branch_types: Optional[List[str]] = None
    branches: Optional[List[str]] = None
    service_advisors: Optional[List[str]] = None
    sources: Optional[List[str]] = None
    service_types: Optional[List[str]] = None
    vehicle_models: Optional[List[str]] = None
    n_minus_1_confirmation_statuses: Optional[List[str]] = None
    appointment_statuses: Optional[List[str]] = None
    appointment_day_outcomes: Optional[List[str]] = None

class ActivityLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    log_id: str
    appointment_id: str
    user_id: str
    user_name: str
    action: str
    field_changed: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: str

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    task_id: str
    task_type: str  # n_minus_1_reminder, escalation
    appointment_id: str
    assigned_to: str
    status: str = "pending"  # pending, completed
    created_at: str
    completed_at: Optional[str] = None

# ============== AUTH HELPERS ==============

async def get_session_from_cookie(request: Request) -> Optional[dict]:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    return session_doc

async def get_current_user(request: Request) -> dict:
    session = await get_session_from_cookie(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0, "password_hash": 0}
    )
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def require_role(request: Request, allowed_roles: List[str]) -> dict:
    user = await get_current_user(request)
    # DP (Dealer Principal) has admin access equivalent to CRM
    user_role = user["role"]
    if user_role == "DP":
        user_role = "CRM"  # DP has CRM-level permissions
    if user_role not in allowed_roles and user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Permission denied")
    return user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/login")
async def login(request: Request, response: Response, login_data: LoginRequest):
    """Login with username and password"""
    user = await db.users.find_one(
        {"username": login_data.username, "is_active": True},
        {"_id": 0}
    )
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Check if user is locked
    if user.get("is_locked", False):
        raise HTTPException(status_code=403, detail="Account is locked. Contact administrator.")
    
    if not verify_password(login_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "user_id": user["user_id"],
        "username": user["username"],
        "name": user["name"],
        "role": user["role"],
        "email": user.get("email")
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current user from session"""
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ============== USERS ROUTES ==============

@api_router.get("/users")
async def get_users(request: Request):
    """Get all users (CRM only)"""
    await require_role(request, ["CRM"])
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    return users

@api_router.post("/users")
async def create_user(request: Request, user_data: UserCreate):
    """Create new user (CRM only)"""
    await require_role(request, ["CRM"])
    
    # Check if username already exists
    existing = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    new_user = {
        "user_id": user_id,
        "username": user_data.username,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "email": user_data.email,
        "mobile": user_data.mobile,
        "department": user_data.department,
        "designation": user_data.designation,
        "branch": user_data.branch,
        "is_active": user_data.is_active,
        "is_locked": user_data.is_locked,
        "module_access": user_data.module_access or [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)
    
    # Return without password_hash and _id
    user_response = {k: v for k, v in new_user.items() if k not in ["password_hash", "_id"]}
    return user_response

@api_router.put("/users/{user_id}")
async def update_user(request: Request, user_id: str, user_data: UserUpdate):
    """Update user (CRM only)"""
    await require_role(request, ["CRM"])
    
    # Check if user exists and get username
    existing_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "username": 1})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Protect primary admin from being deactivated or locked
    if existing_user.get("username") == "admin":
        if user_data.is_active is False:
            raise HTTPException(status_code=403, detail="Cannot deactivate primary admin account")
        if user_data.is_locked is True:
            raise HTTPException(status_code=403, detail="Cannot lock primary admin account")
    
    update_dict = {}
    if user_data.name is not None:
        update_dict["name"] = user_data.name
    if user_data.role is not None:
        update_dict["role"] = user_data.role
    if user_data.email is not None:
        update_dict["email"] = user_data.email
    if user_data.mobile is not None:
        update_dict["mobile"] = user_data.mobile
    if user_data.department is not None:
        update_dict["department"] = user_data.department
    if user_data.designation is not None:
        update_dict["designation"] = user_data.designation
    if user_data.branch is not None:
        update_dict["branch"] = user_data.branch
    if user_data.is_active is not None:
        update_dict["is_active"] = user_data.is_active
    if user_data.is_locked is not None:
        update_dict["is_locked"] = user_data.is_locked
    if user_data.module_access is not None:
        update_dict["module_access"] = user_data.module_access
    if user_data.password:
        update_dict["password_hash"] = hash_password(user_data.password)
    
    if update_dict:
        result = await db.users.update_one(
            {"user_id": user_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated"}

@api_router.post("/users/{user_id}/reset-password")
async def reset_password(request: Request, user_id: str, data: dict):
    """Reset user password (CRM only)"""
    await require_role(request, ["CRM"])
    
    new_password = data.get("password")
    if not new_password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"password_hash": hash_password(new_password)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Password reset successfully"}

@api_router.post("/users/{user_id}/toggle-lock")
async def toggle_lock(request: Request, user_id: str):
    """Toggle user lock status (CRM only)"""
    await require_role(request, ["CRM"])
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Protect primary admin from being locked
    if user.get("username") == "admin":
        raise HTTPException(status_code=403, detail="Cannot lock primary admin account")
    
    new_lock_status = not user.get("is_locked", False)
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_locked": new_lock_status}}
    )
    
    return {"message": "User lock status updated", "is_locked": new_lock_status}

@api_router.delete("/users/{user_id}")
async def delete_user(request: Request, user_id: str):
    """Permanently delete user (CRM only) - Only for inactive users"""
    await require_role(request, ["CRM"])
    
    # Get user to check status and username
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Protect primary admin from deletion
    if user.get("username") == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete primary admin account")
    
    # Only allow deletion of inactive users
    if user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Can only delete inactive users. Deactivate the user first.")
    
    # Permanently delete the user
    result = await db.users.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User permanently deleted"}

@api_router.get("/users/cres")
async def get_cres(request: Request):
    """Get all CRE users"""
    await get_current_user(request)
    cres = await db.users.find(
        {"role": "CRE", "is_active": True},
        {"_id": 0, "password_hash": 0}
    ).to_list(50)
    return cres

# ============== SETTINGS ROUTES ==============

DEFAULT_SETTINGS = {
    "settings_id": "main",
    "branch_types": ["Sales", "Aftersales"],
    "branches": ["Main Branch", "North Branch", "South Branch"],
    "service_advisors": ["SA - John", "SA - Sarah", "SA - Mike"],
    "sources": ["SDR", "Incoming", "MYR", "Other"],
    "service_types": ["1FS", "2FS", "3FS", "PMS", "RR", "BP", "Others"],
    "vehicle_models": ["Kwid", "Triber", "Kiger", "Duster", "Pulse", "Scala", "Lodgy", "Fluence", "Koleos"],
    "n_minus_1_confirmation_statuses": ["Pending", "Confirmed", "Not Reachable", "Rescheduled"],
    "appointment_statuses": ["Booked", "Confirmed", "Closed"],
    "appointment_day_outcomes": ["Reported", "Rescheduled", "Cancelled", "No-show"]
}

@api_router.get("/settings")
async def get_settings(request: Request):
    """Get all settings"""
    await get_current_user(request)
    
    settings = await db.settings.find_one({"settings_id": "main"}, {"_id": 0})
    if not settings:
        await db.settings.insert_one(DEFAULT_SETTINGS.copy())
        settings = DEFAULT_SETTINGS.copy()
    
    return settings

@api_router.put("/settings")
async def update_settings(request: Request, settings_data: SettingsUpdate):
    """Update settings (CRM only)"""
    await require_role(request, ["CRM"])
    
    update_dict = {k: v for k, v in settings_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.settings.update_one(
            {"settings_id": "main"},
            {"$set": update_dict},
            upsert=True
        )
    
    settings = await db.settings.find_one({"settings_id": "main"}, {"_id": 0})
    return settings

# ============== BRANCHES ROUTES ==============

class BranchCreate(BaseModel):
    location: str
    type: str
    address: Optional[str] = None
    is_primary: bool = False

class BranchUpdate(BaseModel):
    location: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    is_primary: Optional[bool] = None

@api_router.get("/branches")
async def get_branches(request: Request):
    """Get all branches"""
    await get_current_user(request)
    branches = await db.branches.find({}, {"_id": 0}).to_list(100)
    return branches

@api_router.post("/branches", status_code=201)
async def create_branch(request: Request, branch_data: BranchCreate):
    """Create new branch (CRM only)"""
    await require_role(request, ["CRM"])
    
    branch_id = f"branch_{uuid.uuid4().hex[:12]}"
    new_branch = {
        "branch_id": branch_id,
        "location": branch_data.location,
        "type": branch_data.type,
        "address": branch_data.address,
        "is_primary": branch_data.is_primary,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.branches.insert_one(new_branch)
    
    # Return without _id
    branch_response = {k: v for k, v in new_branch.items() if k != "_id"}
    return branch_response

@api_router.put("/branches/{branch_id}")
async def update_branch(request: Request, branch_id: str, branch_data: BranchUpdate):
    """Update branch (CRM only)"""
    await require_role(request, ["CRM"])
    
    update_dict = {}
    if branch_data.location is not None:
        update_dict["location"] = branch_data.location
    if branch_data.type is not None:
        update_dict["type"] = branch_data.type
    if branch_data.address is not None:
        update_dict["address"] = branch_data.address
    if branch_data.is_primary is not None:
        update_dict["is_primary"] = branch_data.is_primary
    
    if update_dict:
        result = await db.branches.update_one(
            {"branch_id": branch_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Branch not found")
    
    return {"message": "Branch updated"}

@api_router.delete("/branches/{branch_id}")
async def delete_branch(request: Request, branch_id: str):
    """Delete branch (CRM only)"""
    await require_role(request, ["CRM"])
    
    # Check if branch is primary
    branch = await db.branches.find_one({"branch_id": branch_id}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    if branch.get("is_primary", False):
        raise HTTPException(status_code=403, detail="Cannot delete primary branch")
    
    result = await db.branches.delete_one({"branch_id": branch_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    return {"message": "Branch deleted"}

# ============== APPOINTMENTS ROUTES ==============

async def check_duplicates(phone: str, vehicle_reg: Optional[str]) -> tuple:
    """Check for duplicate phone/vehicle in last 30 days"""
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    
    dup_phone = False
    dup_vehicle = False
    
    if phone:
        phone_match = await db.appointments.find_one({
            "customer_phone": phone,
            "created_at": {"$gte": thirty_days_ago}
        }, {"_id": 0})
        dup_phone = phone_match is not None
    
    if vehicle_reg:
        vehicle_match = await db.appointments.find_one({
            "vehicle_reg_no": vehicle_reg,
            "created_at": {"$gte": thirty_days_ago}
        }, {"_id": 0})
        dup_vehicle = vehicle_match is not None
    
    return dup_phone, dup_vehicle

async def log_activity(appointment_id: str, user_id: str, user_name: str, 
                       action: str, field: str = None, old_val: str = None, new_val: str = None):
    """Log an activity"""
    log = {
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "appointment_id": appointment_id,
        "user_id": user_id,
        "user_name": user_name,
        "action": action,
        "field_changed": field,
        "old_value": str(old_val) if old_val is not None else None,
        "new_value": str(new_val) if new_val is not None else None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.activity_logs.insert_one(log)

@api_router.post("/appointments", status_code=201)
async def create_appointment(request: Request, appt_data: AppointmentCreate):
    """Create new appointment"""
    user = await require_role(request, ["CRE", "CRM", "Receptionist", "DP"])
    
    # Get next sl_no
    last_appt = await db.appointments.find_one(
        {}, {"_id": 0, "sl_no": 1}, sort=[("sl_no", -1)]
    )
    sl_no = (last_appt.get("sl_no", 0) + 1) if last_appt else 1
    
    # Generate booking_id (#SILB0001, #SILB0002, ...)
    last_booking = await db.appointments.find_one(
        {"booking_id": {"$exists": True, "$ne": None}},
        {"_id": 0, "booking_id": 1},
        sort=[("booking_id", -1)]
    )
    if last_booking and last_booking.get("booking_id"):
        try:
            num = int(last_booking["booking_id"].replace("#SILB", "")) + 1
        except ValueError:
            num = 1
    else:
        num = 1
    booking_id = f"#SILB{num:04d}"
    
    # Check duplicates
    dup_phone, dup_vehicle = await check_duplicates(
        appt_data.customer_phone, 
        appt_data.vehicle_reg_no
    )
    
    now = datetime.now(timezone.utc).isoformat()
    appointment = {
        "appointment_id": f"appt_{uuid.uuid4().hex[:12]}",
        "booking_id": booking_id,
        "sl_no": sl_no,
        "branch": appt_data.branch,
        "appointment_date": appt_data.appointment_date,
        "appointment_time": appt_data.appointment_time,
        "source": appt_data.source,
        "customer_name": appt_data.customer_name,
        "customer_phone": appt_data.customer_phone,
        "customer_email": appt_data.customer_email,
        "vehicle_reg_no": appt_data.vehicle_reg_no,
        "model": appt_data.model,
        "current_km": appt_data.current_km,
        "ots": appt_data.ots_recall,
        "service_type": appt_data.service_type,
        "allocated_sa": appt_data.allocated_sa,
        "specific_repair_request": appt_data.specific_repair_request,
        "priority_customer": appt_data.priority_customer,
        "docket_readiness": appt_data.docket_readiness,
        "n_minus_1_confirmation_status": "Pending",
        "appointment_status": "Booked",
        "lost_customer": False,
        "reschedule_history": [],
        "assigned_cre_user": user["user_id"],
        "created_by_user": user["user_id"],
        "created_at": now,
        "updated_at": now,
        "duplicate_phone_last_30_days": dup_phone,
        "duplicate_vehicle_last_30_days": dup_vehicle
    }
    
    await db.appointments.insert_one(appointment)
    
    # Log activity
    await log_activity(
        appointment["appointment_id"],
        user["user_id"],
        user["name"],
        "Created appointment"
    )
    
    # Create N-1 task if appointment is tomorrow
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    if appointment["appointment_date"] == tomorrow:
        task = {
            "task_id": f"task_{uuid.uuid4().hex[:12]}",
            "task_type": "n_minus_1_reminder",
            "appointment_id": appointment["appointment_id"],
            "assigned_to": appointment["assigned_cre_user"],
            "status": "pending",
            "created_at": now,
            "completed_at": None
        }
        await db.tasks.insert_one(task)
    
    return {k: v for k, v in appointment.items() if k != "_id"}

@api_router.get("/appointments")
async def get_appointments(
    request: Request,
    view: str = "day",
    date: str = None,
    month: int = None,
    year: int = None,
    date_from: str = None,
    date_to: str = None,
    branch: str = None,
    source: str = None,
    service_type: str = None,
    cre: str = None,
    sa: str = None,
    status: str = None,
    outcome: str = None,
    priority: str = None,
    docket: str = None,
    n1_status: str = None,
    recovered: str = None
):
    """Get appointments with filters"""
    user = await get_current_user(request)
    
    query = {}
    
    # Date filtering based on view
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    if view == "day":
        query["appointment_date"] = date or today
    elif view == "upcoming":
        query["appointment_date"] = {"$gt": today}
    elif view == "month" and month and year:
        # Get all dates in the month
        start = f"{year}-{month:02d}-01"
        if month == 12:
            end = f"{year + 1}-01-01"
        else:
            end = f"{year}-{month + 1:02d}-01"
        query["appointment_date"] = {"$gte": start, "$lt": end}
    elif view == "year" and year:
        start = f"{year}-01-01"
        end = f"{year + 1}-01-01"
        query["appointment_date"] = {"$gte": start, "$lt": end}
    elif view == "custom" and date_from and date_to:
        query["appointment_date"] = {"$gte": date_from, "$lte": date_to}
    
    # Apply filters
    if branch:
        query["branch"] = branch
    if source:
        query["source"] = source
    if service_type:
        query["service_type"] = service_type
    if cre:
        query["assigned_cre_user"] = cre
    if sa:
        query["allocated_sa"] = sa
    if status:
        query["appointment_status"] = status
    if outcome:
        query["appointment_day_outcome"] = outcome
    if priority == "true":
        query["priority_customer"] = True
    if docket == "true":
        query["docket_readiness"] = True
    if n1_status:
        query["n_minus_1_confirmation_status"] = n1_status
    if recovered == "true":
        query["recovered_lost_customer"] = True
    
    appointments = await db.appointments.find(
        query, {"_id": 0}
    ).sort([("appointment_date", 1), ("appointment_time", 1)]).to_list(1000)
    
    return appointments

@api_router.get("/appointments/{appointment_id}")
async def get_appointment(request: Request, appointment_id: str):
    """Get single appointment"""
    await get_current_user(request)
    
    appointment = await db.appointments.find_one(
        {"appointment_id": appointment_id},
        {"_id": 0}
    )
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return appointment

@api_router.put("/appointments/{appointment_id}")
async def update_appointment(request: Request, appointment_id: str, update_data: AppointmentUpdate):
    """Update appointment with role-based permissions"""
    user = await get_current_user(request)
    
    appointment = await db.appointments.find_one(
        {"appointment_id": appointment_id},
        {"_id": 0}
    )
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    role = user["role"]
    user_id = user["user_id"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    is_appointment_day = appointment["appointment_date"] == today
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # Role-based permission checks
    if role == "CRE":
        # CRE can only edit their own appointments
        if appointment["assigned_cre_user"] != user_id:
            raise HTTPException(status_code=403, detail="Can only edit your own appointments")
        
        # CRE cannot update appointment_day_outcome
        if "appointment_day_outcome" in update_dict or "appointment_day_outcome_notes" in update_dict:
            raise HTTPException(status_code=403, detail="CRE cannot update appointment day outcome")
        
        # CRE cannot reassign
        if "assigned_cre_user" in update_dict:
            raise HTTPException(status_code=403, detail="CRE cannot reassign appointments")
    
    elif role == "Receptionist":
        # Receptionist can update outcome only on appointment day
        if ("appointment_day_outcome" in update_dict or "appointment_day_outcome_notes" in update_dict) and not is_appointment_day:
            raise HTTPException(status_code=403, detail="Can only update outcome on appointment day")
        
        # Receptionist cannot reassign CRE
        if "assigned_cre_user" in update_dict:
            raise HTTPException(status_code=403, detail="Receptionist cannot reassign CRE")
    
    # CRM has full access
    
    # Log changes — only log meaningful differences (skip null ↔ empty string)
    for field, new_val in update_dict.items():
        old_val = appointment.get(field)
        norm_old = None if old_val in (None, "", "None") else old_val
        norm_new = None if new_val in (None, "", "None") else new_val
        if norm_old != norm_new:
            await log_activity(
                appointment_id,
                user_id,
                user["name"],
                f"Updated {field}",
                field,
                old_val,
                new_val
            )
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": update_dict}
    )
    
    # Handle reschedule: create new upcoming appointment with same booking_id
    if "appointment_status" in update_dict and update_dict["appointment_status"] == "Rescheduled":
        reschedule_date = update_dict.get("reschedule_date")
        if reschedule_date:
            # Build reschedule history entry
            history_entry = {
                "from_date": appointment.get("appointment_date"),
                "to_date": reschedule_date,
                "remarks": update_dict.get("reschedule_remarks", ""),
                "rescheduled_at": datetime.now(timezone.utc).isoformat(),
                "rescheduled_by": user["name"]
            }
            # Get existing reschedule_history from original
            existing_history = appointment.get("reschedule_history", [])
            existing_history.append(history_entry)
            
            # Get next sl_no
            last_appt = await db.appointments.find_one(
                {}, {"_id": 0, "sl_no": 1}, sort=[("sl_no", -1)]
            )
            new_sl = (last_appt.get("sl_no", 0) + 1) if last_appt else 1
            
            now_iso = datetime.now(timezone.utc).isoformat()
            new_appt = {
                "appointment_id": f"appt_{uuid.uuid4().hex[:12]}",
                "booking_id": appointment.get("booking_id"),
                "sl_no": new_sl,
                "branch": appointment.get("branch"),
                "appointment_date": reschedule_date,
                "appointment_time": appointment.get("appointment_time"),
                "source": appointment.get("source"),
                "customer_name": appointment.get("customer_name"),
                "customer_phone": appointment.get("customer_phone"),
                "customer_email": appointment.get("customer_email"),
                "vehicle_reg_no": appointment.get("vehicle_reg_no"),
                "vehicle_reg": appointment.get("vehicle_reg"),
                "vehicle_model": appointment.get("vehicle_model"),
                "model": appointment.get("model"),
                "current_km": appointment.get("current_km"),
                "ots": appointment.get("ots", False),
                "service_type": appointment.get("service_type"),
                "allocated_sa": appointment.get("allocated_sa"),
                "specific_repair_request": appointment.get("specific_repair_request"),
                "specific_repair": appointment.get("specific_repair"),
                "priority_customer": appointment.get("priority_customer", False),
                "docket_readiness": False,
                "n_minus_1_confirmation_status": "Pending",
                "appointment_status": "Booked",
                "lost_customer": appointment.get("lost_customer", False),
                "is_rescheduled": True,
                "reschedule_history": existing_history,
                "assigned_cre_user": appointment.get("assigned_cre_user"),
                "cre_name": appointment.get("cre_name"),
                "created_by": appointment.get("created_by") or appointment.get("created_by_user"),
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            await db.appointments.insert_one(new_appt)
            
            # Also store the history on the original appointment
            await db.appointments.update_one(
                {"appointment_id": appointment_id},
                {"$set": {"reschedule_history": existing_history}}
            )
            
            await log_activity(
                new_appt["appointment_id"],
                user["user_id"],
                user["name"],
                f"Rescheduled from {appointment.get('appointment_date')} to {reschedule_date}",
            )
    
    # Complete N-1 task if status updated
    if "n_minus_1_confirmation_status" in update_dict and update_dict["n_minus_1_confirmation_status"] != "Pending":
        await db.tasks.update_one(
            {"appointment_id": appointment_id, "task_type": "n_minus_1_reminder", "status": "pending"},
            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    updated = await db.appointments.find_one({"appointment_id": appointment_id}, {"_id": 0})
    return updated

@api_router.get("/appointments/{appointment_id}/activity")
async def get_appointment_activity(request: Request, appointment_id: str):
    """Get activity log for an appointment"""
    await get_current_user(request)
    
    logs = await db.activity_logs.find(
        {"appointment_id": appointment_id},
        {"_id": 0}
    ).sort([("timestamp", -1)]).to_list(100)
    
    return logs

@api_router.get("/appointments/duplicates/check")
async def check_duplicate_records(request: Request, phone: str = None, vehicle: str = None):
    """Check for duplicate records - excludes past-dated appointments"""
    await get_current_user(request)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    results = []
    
    if phone:
        matches = await db.appointments.find({
            "customer_phone": phone,
            "created_at": {"$gte": thirty_days_ago},
            "appointment_date": {"$gte": today}
        }, {"_id": 0}).to_list(10)
        results.extend(matches)
    
    if vehicle:
        matches = await db.appointments.find({
            "vehicle_reg_no": vehicle,
            "created_at": {"$gte": thirty_days_ago},
            "appointment_date": {"$gte": today}
        }, {"_id": 0}).to_list(10)
        results.extend(matches)
    
    # Remove duplicates
    seen = set()
    unique = []
    for r in results:
        if r["appointment_id"] not in seen:
            seen.add(r["appointment_id"])
            unique.append(r)
    
    return unique

# ============== TASKS ROUTES ==============

@api_router.get("/tasks")
async def get_tasks(request: Request, status: str = "pending"):
    """Get tasks for current user"""
    user = await get_current_user(request)
    
    query = {"status": status}
    
    # CRE sees only their tasks, CRM/DP sees all
    if user["role"] == "CRE":
        query["assigned_to"] = user["user_id"]
    
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(100)
    
    # Enrich with appointment info
    for task in tasks:
        appt = await db.appointments.find_one(
            {"appointment_id": task["appointment_id"]},
            {"_id": 0, "customer_name": 1, "customer_phone": 1, "appointment_date": 1, "appointment_time": 1}
        )
        if appt:
            task["appointment_info"] = appt
    
    return tasks

@api_router.put("/tasks/{task_id}")
async def update_task(request: Request, task_id: str, status: str = "completed"):
    """Update task status"""
    user = await get_current_user(request)
    
    update_dict = {"status": status}
    if status == "completed":
        update_dict["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tasks.update_one(
        {"task_id": task_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task updated"}

# ============== DASHBOARD ROUTES ==============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    """Get dashboard statistics"""
    user = await get_current_user(request)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Today's appointments
    today_query = {"appointment_date": today}
    today_count = await db.appointments.count_documents(today_query)
    
    # By branch
    by_branch = {}
    branches = await db.appointments.distinct("branch", today_query)
    for branch in branches:
        count = await db.appointments.count_documents({**today_query, "branch": branch})
        by_branch[branch] = count
    
    # By SA
    by_sa = {}
    sas = await db.appointments.distinct("allocated_sa", today_query)
    for sa in sas:
        if sa:
            count = await db.appointments.count_documents({**today_query, "allocated_sa": sa})
            by_sa[sa] = count
    
    # By CRE
    by_cre = {}
    cres = await db.appointments.distinct("assigned_cre_user", today_query)
    for cre in cres:
        count = await db.appointments.count_documents({**today_query, "assigned_cre_user": cre})
        # Get CRE name
        cre_user = await db.users.find_one({"user_id": cre}, {"_id": 0, "name": 1})
        cre_name = cre_user["name"] if cre_user else cre
        by_cre[cre_name] = count
    
    # Tomorrow pending confirmations
    pending_tomorrow = await db.appointments.count_documents({
        "appointment_date": tomorrow,
        "n_minus_1_confirmation_status": "Pending"
    })
    
    # No-show stats (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    total_last_30 = await db.appointments.count_documents({
        "appointment_date": {"$gte": thirty_days_ago}
    })
    no_show_last_30 = await db.appointments.count_documents({
        "appointment_date": {"$gte": thirty_days_ago},
        "appointment_day_outcome": "No-show"
    })
    no_show_rate = (no_show_last_30 / total_last_30 * 100) if total_last_30 > 0 else 0
    
    # Source funnel
    source_funnel = {}
    sources = await db.appointments.distinct("source", {"appointment_date": {"$gte": thirty_days_ago}})
    for source in sources:
        booked = await db.appointments.count_documents({
            "appointment_date": {"$gte": thirty_days_ago},
            "source": source
        })
        confirmed = await db.appointments.count_documents({
            "appointment_date": {"$gte": thirty_days_ago},
            "source": source,
            "appointment_status": {"$in": ["Confirmed", "Closed"]}
        })
        reported = await db.appointments.count_documents({
            "appointment_date": {"$gte": thirty_days_ago},
            "source": source,
            "appointment_day_outcome": "Reported"
        })
        source_funnel[source] = {"booked": booked, "confirmed": confirmed, "reported": reported}
    
    # Recovered lost customers
    recovered_count = await db.appointments.count_documents({
        "appointment_date": {"$gte": thirty_days_ago},
        "recovered_lost_customer": True
    })
    
    return {
        "today_total": today_count,
        "by_branch": by_branch,
        "by_sa": by_sa,
        "by_cre": by_cre,
        "pending_tomorrow": pending_tomorrow,
        "no_show_count": no_show_last_30,
        "no_show_rate": round(no_show_rate, 1),
        "source_funnel": source_funnel,
        "recovered_count": recovered_count
    }

# ============== EXPORT ROUTES ==============

@api_router.get("/export/csv")
async def export_csv(
    request: Request,
    view: str = "month",
    month: int = None,
    year: int = None
):
    """Export appointments to CSV"""
    await require_role(request, ["CRM", "DP"])
    
    query = {}
    
    if view == "month" and month and year:
        start = f"{year}-{month:02d}-01"
        if month == 12:
            end = f"{year + 1}-01-01"
        else:
            end = f"{year}-{month + 1:02d}-01"
        query["appointment_date"] = {"$gte": start, "$lt": end}
    elif view == "year" and year:
        start = f"{year}-01-01"
        end = f"{year + 1}-01-01"
        query["appointment_date"] = {"$gte": start, "$lt": end}
    
    appointments = await db.appointments.find(query, {"_id": 0}).to_list(10000)
    
    if not appointments:
        raise HTTPException(status_code=404, detail="No data to export")
    
    # Create CSV
    output = io.StringIO()
    if appointments:
        writer = csv.DictWriter(output, fieldnames=appointments[0].keys())
        writer.writeheader()
        writer.writerows(appointments)
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=appointments_export.csv"}
    )

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_data():
    """Seed initial data for testing"""
    # Check if admin already exists
    existing_admin = await db.users.find_one({"username": "admin"}, {"_id": 0})
    if existing_admin:
        return {"message": "Data already seeded"}
    
    # Create default settings
    await db.settings.delete_many({})
    await db.settings.insert_one(DEFAULT_SETTINGS.copy())
    
    # Create users with username/password
    users = [
        {
            "user_id": "user_admin_001",
            "username": "admin",
            "password_hash": hash_password("admin"),
            "name": "Tanshu Agarwal",
            "role": "DP",
            "email": "tanshu@bohania.com",
            "mobile": "9876543210",
            "department": "Admin",
            "designation": "Dealer Principal",
            "branch": "Main Branch",
            "is_active": True,
            "is_locked": False,
            "module_access": ["Dashboard", "Customer Relations", "Parts", "Bodyshop", "Mechanical", "Insurance", "HR", "Customers", "Settings", "Users"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": "user_receptionist_001",
            "username": "reception",
            "password_hash": hash_password("reception123"),
            "name": "Front Desk",
            "role": "Receptionist",
            "email": "reception@bohania.com",
            "mobile": "9876543211",
            "department": "Customer Relations",
            "designation": "Receptionist",
            "branch": "Main Branch",
            "is_active": True,
            "is_locked": False,
            "module_access": ["Dashboard", "Customer Relations"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": "user_cre_001",
            "username": "cre1",
            "password_hash": hash_password("cre123"),
            "name": "CRE Alex",
            "role": "CRE",
            "email": "cre1@bohania.com",
            "mobile": "9876543212",
            "department": "Customer Relations",
            "designation": "Customer Relationship Executive",
            "branch": "Main Branch",
            "is_active": True,
            "is_locked": False,
            "module_access": ["Dashboard", "Customer Relations"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": "user_cre_002",
            "username": "cre2",
            "password_hash": hash_password("cre123"),
            "name": "CRE Jordan",
            "role": "CRE",
            "email": "cre2@bohania.com",
            "mobile": "9876543213",
            "department": "Customer Relations",
            "designation": "Customer Relationship Executive",
            "branch": "North Branch",
            "is_active": True,
            "is_locked": False,
            "module_access": ["Dashboard", "Customer Relations"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.users.delete_many({})
    await db.users.insert_many(users)
    
    # Create sample appointments
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    
    await db.appointments.delete_many({})
    
    appointments = [
        {
            "appointment_id": f"appt_{uuid.uuid4().hex[:12]}",
            "sl_no": 1,
            "branch": "Main Branch",
            "appointment_date": today,
            "appointment_time": "09:00",
            "source": "SDR",
            "customer_name": "John Smith",
            "customer_phone": "9876543210",
            "customer_email": "john@example.com",
            "vehicle_reg_no": "KA01AB1234",
            "model": "Kwid",
            "current_km": 25000,
            "ots_recall": False,
            "service_type": "PMS",
            "allocated_sa": "SA - John",
            "specific_repair_request": "AC not cooling properly",
            "priority_customer": True,
            "docket_readiness": True,
            "n_minus_1_confirmation_status": "Confirmed",
            "n_minus_1_confirmation_notes": "Customer confirmed via call",
            "appointment_status": "Confirmed",
            "appointment_day_outcome": None,
            "appointment_day_outcome_notes": None,
            "recovered_lost_customer": False,
            "assigned_cre_user": "user_cre_001",
            "created_by_user": "user_cre_001",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "duplicate_phone_last_30_days": False,
            "duplicate_vehicle_last_30_days": False
        },
        {
            "appointment_id": f"appt_{uuid.uuid4().hex[:12]}",
            "sl_no": 2,
            "branch": "Main Branch",
            "appointment_date": today,
            "appointment_time": "10:30",
            "source": "Incoming",
            "customer_name": "Sarah Johnson",
            "customer_phone": "9876543211",
            "customer_email": "sarah@example.com",
            "vehicle_reg_no": "KA02CD5678",
            "model": "Duster",
            "current_km": 45000,
            "ots_recall": True,
            "service_type": "RR",
            "allocated_sa": "SA - Sarah",
            "specific_repair_request": "Recall service needed",
            "priority_customer": False,
            "docket_readiness": False,
            "n_minus_1_confirmation_status": "Pending",
            "n_minus_1_confirmation_notes": None,
            "appointment_status": "Booked",
            "appointment_day_outcome": None,
            "appointment_day_outcome_notes": None,
            "recovered_lost_customer": False,
            "assigned_cre_user": "user_cre_002",
            "created_by_user": "user_cre_002",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "duplicate_phone_last_30_days": False,
            "duplicate_vehicle_last_30_days": False
        },
        {
            "appointment_id": f"appt_{uuid.uuid4().hex[:12]}",
            "sl_no": 3,
            "branch": "North Branch",
            "appointment_date": tomorrow,
            "appointment_time": "11:00",
            "source": "MYR",
            "customer_name": "Mike Brown",
            "customer_phone": "9876543212",
            "customer_email": None,
            "vehicle_reg_no": "KA03EF9012",
            "model": "Triber",
            "current_km": 15000,
            "ots_recall": False,
            "service_type": "1FS",
            "allocated_sa": None,
            "specific_repair_request": "First free service",
            "priority_customer": False,
            "docket_readiness": True,
            "n_minus_1_confirmation_status": "Pending",
            "n_minus_1_confirmation_notes": None,
            "appointment_status": "Booked",
            "appointment_day_outcome": None,
            "appointment_day_outcome_notes": None,
            "recovered_lost_customer": True,
            "assigned_cre_user": "user_cre_001",
            "created_by_user": "user_cre_001",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "duplicate_phone_last_30_days": False,
            "duplicate_vehicle_last_30_days": False
        }
    ]
    
    await db.appointments.insert_many(appointments)
    
    # Create N-1 task for tomorrow's appointment
    await db.tasks.delete_many({})
    await db.tasks.insert_one({
        "task_id": f"task_{uuid.uuid4().hex[:12]}",
        "task_type": "n_minus_1_reminder",
        "appointment_id": appointments[2]["appointment_id"],
        "assigned_to": "user_cre_001",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    })
    
    return {"message": "Data seeded successfully", "admin_credentials": {"username": "admin", "password": "admin"}}

# ============== USER PREFERENCES ROUTES ==============

@api_router.get("/user-preferences/{page}")
async def get_user_preferences(request: Request, page: str):
    """Get column preferences for a page"""
    user = await get_current_user(request)
    prefs = await db.user_preferences.find_one(
        {"user_id": user["user_id"], "page": page},
        {"_id": 0}
    )
    return prefs or {"user_id": user["user_id"], "page": page, "hidden_columns": [], "column_order": []}

@api_router.put("/user-preferences/{page}")
async def save_user_preferences(request: Request, page: str, data: ColumnPreferences):
    """Save column preferences for a page"""
    user = await get_current_user(request)
    await db.user_preferences.update_one(
        {"user_id": user["user_id"], "page": page},
        {"$set": {
            "user_id": user["user_id"],
            "page": page,
            "hidden_columns": data.hidden_columns or [],
            "column_order": data.column_order or []
        }},
        upsert=True
    )
    return {"message": "Preferences saved"}

# ============== SEED DEMO APPOINTMENTS ==============

@api_router.post("/seed-demo-appointments")
async def seed_demo_appointments():
    """Generate 4 appointments per day from today through May 30, 2026. Keeps history intact."""
    import random

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    end_date = "2026-05-30"

    # Delete only today and future appointments
    await db.appointments.delete_many({"appointment_date": {"$gte": today}})

    customers = [
        ("Aarav Mehta", "9012345601", "aarav.m@gmail.com"),
        ("Diya Bose", "9012345602", "diya.b@yahoo.com"),
        ("Kabir Sinha", "9012345603", "kabir.s@gmail.com"),
        ("Ishita Ghosh", "9012345604", "ishita.g@outlook.com"),
        ("Rohan Chatterjee", "9012345605", "rohan.c@gmail.com"),
        ("Tanvi Mukherjee", "9012345606", "tanvi.m@outlook.com"),
        ("Arjun Nair", "9012345607", "arjun.n@gmail.com"),
        ("Priya Reddy", "9012345608", "priya.r@yahoo.com"),
        ("Vikram Shah", "9012345609", "vikram.s@gmail.com"),
        ("Neha Kapoor", "9012345610", "neha.k@outlook.com"),
        ("Pooja Agarwal", "9012345611", "pooja.a@gmail.com"),
        ("Rahul Verma", "9012345612", "rahul.v@yahoo.com"),
        ("Sneha Das", "9012345613", "sneha.d@gmail.com"),
        ("Amit Pal", "9012345614", "amit.p@outlook.com"),
        ("Ritu Sharma", "9012345615", "ritu.s@gmail.com"),
        ("Sanjay Kumar", "9012345616", "sanjay.k@yahoo.com"),
        ("Meera Joshi", "9012345617", "meera.j@gmail.com"),
        ("Deepak Tiwari", "9012345618", "deepak.t@outlook.com"),
        ("Ananya Roy", "9012345619", "ananya.r@gmail.com"),
        ("Kunal Banerjee", "9012345620", "kunal.b@yahoo.com"),
    ]
    models = ["Kiger", "Triber", "Duster", "Kwid", "Magnite"]
    reg_prefixes = ["WB74U", "AS01U", "WB73U", "BR01U", "WB72U", "KA01A", "MH02B", "DL03C"]
    sources = ["SDR", "Incoming", "MYR", "Other"]
    service_types = ["1FS", "2FS", "3FS", "PMS", "RR", "BP"]
    sas = ["Arjun", "Vivek"]
    cres = ["Pooja", "Rahul"]
    branches = ["Main Branch", "North Branch"]
    statuses_today = ["Booked", "Confirmed", "Reported", "Rescheduled"]
    statuses_upcoming = ["Booked", "Scheduled", "Confirmed"]
    times = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00"]
    n1_statuses = ["Confirmed", "Pending", "Not Reachable"]
    day_outcomes = ["Reported", "No Show", "Rescheduled", None]

    appointments = []
    current = datetime.strptime(today, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    sl = 100
    day_idx = 0

    while current <= end:
        date_str = current.strftime("%Y-%m-%d")
        is_today = date_str == today
        picked_times = random.sample(times, 4)
        picked_times.sort()

        for i in range(4):
            ci = (day_idx * 4 + i) % len(customers)
            name, phone, email = customers[ci]
            sl += 1
            reg = f"{random.choice(reg_prefixes)}{1000 + sl}"
            is_priority = random.random() < 0.2
            has_ots = random.random() < 0.15
            docket = random.random() < 0.5
            lost = random.random() < 0.1

            appt = {
                "appointment_id": f"apt_up_{sl:03d}",
                "booking_id": f"#SILB{sl:04d}",
                "sl_no": sl,
                "branch": random.choice(branches),
                "appointment_date": date_str,
                "appointment_time": picked_times[i],
                "source": random.choice(sources),
                "customer_name": name.upper() if is_priority else name,
                "customer_phone": phone,
                "customer_email": email,
                "vehicle_reg": reg,
                "vehicle_model": random.choice(models),
                "current_km": str(random.randint(5000, 80000)),
                "ots": has_ots,
                "service_type": random.choice(service_types),
                "allocated_sa": random.choice(sas),
                "specific_repair": random.choice(["", "AC service needed", "Brake pad replacement", "Engine noise check", "Full body wash", ""]),
                "priority_customer": is_priority,
                "docket_readiness": docket,
                "n_minus_1_confirmation": random.choice(n1_statuses) if not is_today else random.choice(["Confirmed", "Pending"]),
                "n_minus_1_confirmation_status": random.choice(n1_statuses),
                "upcoming_status": "Scheduled",
                "appointment_status": random.choice(statuses_today) if is_today else random.choice(statuses_upcoming),
                "appointment_day_outcome": random.choice(day_outcomes) if is_today else None,
                "cre_name": random.choice(cres),
                "lost_customer": lost,
                "is_rescheduled": False,
                "reschedule_history": [],
                "rescheduled_in_n1": False,
                "cancelled_in_n1": False,
                "assigned_cre_user": random.choice(["user_cre_001", "user_cre_002"]),
                "created_by": random.choice(["user_cre_001", "user_cre_002"]),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            appointments.append(appt)

        day_idx += 1
        current += timedelta(days=1)

    # Bulk insert
    if appointments:
        await db.appointments.insert_many(appointments)

    return {"message": f"Seeded {len(appointments)} appointments from {today} to {end_date} (4 per day)"}

# ============== ROOT ROUTE ==============

@api_router.get("/")
async def root():
    return {"message": "Bohania Renault Dealer Management System API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
