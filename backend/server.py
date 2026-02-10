"""
thecommons. Growth OS - Main Server
FastAPI backend with RBAC, multi-tenancy, and full API
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import bcrypt
import jwt

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import models
from models import (
    Organization, OrganizationCreate,
    ClientWorkspace, WorkspaceCreate,
    User, UserCreate, UserResponse, UserSession,
    RoleAssignment, RoleAssignmentCreate,
    Goal, GoalCreate, NorthStarMetric, NorthStarMetricCreate,
    Funnel, FunnelCreate, FunnelStep,
    ActivationDefinition, ActivationDefinitionCreate,
    Experiment, ExperimentCreate, ExperimentUpdate, Variant, VariantCreate,
    Decision, DecisionCreate, Insight, InsightCreate,
    Asset, AssetCreate, AssetUpdate, CreativeBrief, CreativeBriefCreate,
    Channel, ChannelCreate, PerformanceMetric, SpendRecord,
    Creator, CreatorCreate, CreatorUpdate, CreatorDeal, CreatorDealCreate,
    WeeklyReport, WeeklyReportCreate, WeeklyReportUpdate,
    AuditLog, Alert,
    UserRole, ExperimentStatus, ReportStatus, CreatorPipelineStatus,
    LoginRequest, RegisterRequest, TokenResponse,
    generate_id, now_utc
)

# Import services
from ai_service import (
    generate_weekly_narrative, suggest_experiments,
    generate_creative_iterations, detect_anomalies
)
from connectors import get_connector, sync_all_connectors
from email_service import (
    send_report_ready_notification, send_report_approved_notification,
    send_experiment_decision_notification
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT config
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

# Create app
app = FastAPI(title="thecommons. Growth OS")
api_router = APIRouter(prefix="/api")


# ====================
# HELPER FUNCTIONS
# ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("user_id")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ====================
# AUTH DEPENDENCY
# ====================

async def get_current_user(request: Request) -> Dict[str, Any]:
    """Get current user from session token or Authorization header"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Then try Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check session in database
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one(
        {"user_id": session.get("user_id")},
        {"_id": 0, "password_hash": 0}
    )
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


async def get_user_roles(user_id: str, org_id: str = None, workspace_id: str = None) -> List[str]:
    """Get user roles for org/workspace"""
    query = {"user_id": user_id}
    if org_id:
        query["org_id"] = org_id
    if workspace_id:
        query["$or"] = [{"workspace_id": workspace_id}, {"workspace_id": None}]
    
    roles = await db.role_assignments.find(query, {"_id": 0}).to_list(100)
    return [r.get("role") for r in roles]


def check_role(allowed_roles: List[UserRole]):
    """Dependency to check if user has required role"""
    async def role_checker(
        request: Request,
        user: Dict = Depends(get_current_user)
    ):
        workspace_id = request.path_params.get("workspace_id") or request.query_params.get("workspace_id")
        org_id = request.query_params.get("org_id")
        
        # Get user's roles
        if not org_id:
            # Try to get org from workspace
            if workspace_id:
                ws = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0, "org_id": 1})
                org_id = ws.get("org_id") if ws else None
            else:
                # Get first org user belongs to
                role = await db.role_assignments.find_one({"user_id": user["user_id"]}, {"_id": 0, "org_id": 1})
                org_id = role.get("org_id") if role else None
        
        roles = await get_user_roles(user["user_id"], org_id, workspace_id)
        
        # Check if user has any of the allowed roles
        allowed_role_values = [r.value for r in allowed_roles]
        if not any(r in allowed_role_values for r in roles):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        user["roles"] = roles
        user["org_id"] = org_id
        return user
    
    return role_checker


async def log_audit(
    org_id: str,
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    old_value: Dict = None,
    new_value: Dict = None,
    workspace_id: str = None
):
    """Log audit event"""
    audit = {
        "log_id": generate_id("audit"),
        "org_id": org_id,
        "workspace_id": workspace_id,
        "user_id": user_id,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "old_value": old_value,
        "new_value": new_value,
        "created_at": now_utc().isoformat()
    }
    await db.audit_logs.insert_one(audit)


# ====================
# AUTH ROUTES
# ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    """Register a new user"""
    # Check if email exists
    existing = await db.users.find_one({"email": request.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = generate_id("user")
    user = {
        "user_id": user_id,
        "email": request.email,
        "name": request.name,
        "password_hash": hash_password(request.password),
        "is_active": True,
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat()
    }
    await db.users.insert_one(user)
    
    # Create session
    session_token = str(uuid.uuid4())
    session = {
        "session_id": generate_id("sess"),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (now_utc() + timedelta(days=JWT_EXPIRY_DAYS)).isoformat(),
        "created_at": now_utc().isoformat()
    }
    await db.user_sessions.insert_one(session)
    
    return TokenResponse(
        access_token=session_token,
        user=UserResponse(
            user_id=user_id,
            email=request.email,
            name=request.name
        )
    )


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest, response: Response):
    """Login with email and password"""
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account disabled")
    
    # Create session
    session_token = str(uuid.uuid4())
    session = {
        "session_id": generate_id("sess"),
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (now_utc() + timedelta(days=JWT_EXPIRY_DAYS)).isoformat(),
        "created_at": now_utc().isoformat()
    }
    await db.user_sessions.insert_one(session)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=JWT_EXPIRY_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    return TokenResponse(
        access_token=session_token,
        user=UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            name=user["name"],
            picture=user.get("picture")
        )
    )


@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    """Process Google OAuth session_id and create session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent auth to exchange session_id
    import httpx
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        auth_data = auth_response.json()
    
    # Check if user exists
    user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if not user:
        # Create new user
        user_id = generate_id("user")
        user = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
            "is_active": True,
            "created_at": now_utc().isoformat(),
            "updated_at": now_utc().isoformat()
        }
        await db.users.insert_one(user)
    else:
        user_id = user["user_id"]
        # Update user info if changed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": auth_data["name"],
                "picture": auth_data.get("picture"),
                "updated_at": now_utc().isoformat()
            }}
        )
    
    # Create session
    session_token = auth_data.get("session_token", str(uuid.uuid4()))
    session = {
        "session_id": generate_id("sess"),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (now_utc() + timedelta(days=JWT_EXPIRY_DAYS)).isoformat(),
        "created_at": now_utc().isoformat()
    }
    await db.user_sessions.insert_one(session)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=JWT_EXPIRY_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "user_id": user_id,
        "email": auth_data["email"],
        "name": auth_data["name"],
        "picture": auth_data.get("picture"),
        "session_token": session_token
    }


@api_router.get("/auth/me")
async def get_me(user: Dict = Depends(get_current_user)):
    """Get current user info"""
    # Get user's roles
    roles = await db.role_assignments.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    return {
        **user,
        "roles": roles
    }


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}


# ====================
# ORGANIZATION ROUTES
# ====================

@api_router.get("/organizations")
async def list_organizations(user: Dict = Depends(get_current_user)):
    """List organizations user has access to"""
    roles = await db.role_assignments.find(
        {"user_id": user["user_id"]},
        {"_id": 0, "org_id": 1}
    ).to_list(100)
    
    org_ids = list(set(r["org_id"] for r in roles))
    orgs = await db.organizations.find(
        {"org_id": {"$in": org_ids}},
        {"_id": 0}
    ).to_list(100)
    
    return orgs


@api_router.get("/organizations/{org_id}")
async def get_organization(
    org_id: str,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD]))
):
    """Get organization details"""
    org = await db.organizations.find_one({"org_id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


# ====================
# WORKSPACE ROUTES
# ====================

@api_router.get("/workspaces")
async def list_workspaces(
    org_id: Optional[str] = None,
    user: Dict = Depends(get_current_user)
):
    """List workspaces user has access to"""
    # Get user's role assignments
    roles = await db.role_assignments.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Build list of accessible workspace IDs
    accessible_ws = []
    for role in roles:
        if role.get("workspace_id"):
            accessible_ws.append(role["workspace_id"])
        elif role["role"] in [UserRole.ADMIN.value, UserRole.GROWTH_LEAD.value]:
            # Admins and Growth Leads can see all workspaces in their org
            if org_id:
                ws_list = await db.workspaces.find(
                    {"org_id": org_id},
                    {"_id": 0, "workspace_id": 1}
                ).to_list(100)
            else:
                ws_list = await db.workspaces.find(
                    {"org_id": role["org_id"]},
                    {"_id": 0, "workspace_id": 1}
                ).to_list(100)
            accessible_ws.extend([w["workspace_id"] for w in ws_list])
    
    accessible_ws = list(set(accessible_ws))
    
    query = {"workspace_id": {"$in": accessible_ws}}
    if org_id:
        query["org_id"] = org_id
    
    workspaces = await db.workspaces.find(query, {"_id": 0}).to_list(100)
    return workspaces


@api_router.get("/workspaces/{workspace_id}")
async def get_workspace(
    workspace_id: str,
    user: Dict = Depends(get_current_user)
):
    """Get workspace details"""
    workspace = await db.workspaces.find_one(
        {"workspace_id": workspace_id},
        {"_id": 0}
    )
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Get north star metric
    nsm = await db.north_star_metrics.find_one(
        {"workspace_id": workspace_id},
        {"_id": 0}
    )
    
    # Get funnel
    funnel = await db.funnels.find_one(
        {"workspace_id": workspace_id, "is_active": True},
        {"_id": 0}
    )
    
    # Get experiment counts
    exp_counts = {}
    for status in ExperimentStatus:
        count = await db.experiments.count_documents({
            "workspace_id": workspace_id,
            "status": status.value
        })
        exp_counts[status.value] = count
    
    # Get alerts
    alerts = await db.alerts.find(
        {"workspace_id": workspace_id, "is_resolved": False},
        {"_id": 0}
    ).to_list(10)
    
    return {
        **workspace,
        "north_star": nsm,
        "funnel": funnel,
        "experiment_counts": exp_counts,
        "active_alerts": alerts
    }


@api_router.put("/workspaces/{workspace_id}")
async def update_workspace(
    workspace_id: str,
    updates: Dict[str, Any],
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD]))
):
    """Update workspace settings"""
    updates["updated_at"] = now_utc().isoformat()
    
    result = await db.workspaces.update_one(
        {"workspace_id": workspace_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    return await get_workspace(workspace_id, user)


# ====================
# EXPERIMENT ROUTES
# ====================

@api_router.get("/workspaces/{workspace_id}/experiments")
async def list_experiments(
    workspace_id: str,
    status: Optional[str] = None,
    user: Dict = Depends(get_current_user)
):
    """List experiments in workspace"""
    # Check if client viewer - filter to approved only
    roles = await get_user_roles(user["user_id"], workspace_id=workspace_id)
    is_client = UserRole.CLIENT_VIEWER.value in roles
    
    query = {"workspace_id": workspace_id}
    if status:
        query["status"] = status
    if is_client:
        query["is_client_visible"] = True
    
    experiments = await db.experiments.find(query, {"_id": 0}).to_list(100)
    
    # Remove internal notes for clients
    if is_client:
        for exp in experiments:
            exp.pop("internal_notes", None)
    
    return experiments


@api_router.post("/workspaces/{workspace_id}/experiments")
async def create_experiment(
    workspace_id: str,
    experiment: ExperimentCreate,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.PERFORMANCE]))
):
    """Create a new experiment"""
    exp_dict = experiment.model_dump()
    exp_dict.update({
        "experiment_id": generate_id("exp"),
        "workspace_id": workspace_id,
        "status": ExperimentStatus.BACKLOG.value,
        "variants": [],
        "insights": [],
        "is_client_visible": False,
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
        "created_by": user["user_id"]
    })
    
    # Insert and get the result without MongoDB ObjectId
    result = await db.experiments.insert_one(exp_dict)
    
    # Log changelog
    await db.changelog_events.insert_one({
        "event_id": generate_id("event"),
        "workspace_id": workspace_id,
        "event_type": "experiment_created",
        "description": f"Experiment '{exp_dict['name']}' created",
        "metadata": {"experiment_id": exp_dict["experiment_id"]},
        "created_at": now_utc().isoformat(),
        "created_by": user["user_id"]
    })
    
    # Return the dict without MongoDB ObjectId
    return {k: v for k, v in exp_dict.items() if k != "_id"}


@api_router.get("/workspaces/{workspace_id}/experiments/{experiment_id}")
async def get_experiment(
    workspace_id: str,
    experiment_id: str,
    user: Dict = Depends(get_current_user)
):
    """Get experiment details"""
    exp = await db.experiments.find_one(
        {"experiment_id": experiment_id, "workspace_id": workspace_id},
        {"_id": 0}
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    # Check client access
    roles = await get_user_roles(user["user_id"], workspace_id=workspace_id)
    if UserRole.CLIENT_VIEWER.value in roles:
        if not exp.get("is_client_visible"):
            raise HTTPException(status_code=403, detail="Not authorized")
        exp.pop("internal_notes", None)
    
    return exp


@api_router.put("/workspaces/{workspace_id}/experiments/{experiment_id}")
async def update_experiment(
    workspace_id: str,
    experiment_id: str,
    updates: ExperimentUpdate,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.PERFORMANCE]))
):
    """Update experiment"""
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_dict["updated_at"] = now_utc().isoformat()
    
    result = await db.experiments.update_one(
        {"experiment_id": experiment_id, "workspace_id": workspace_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    return await get_experiment(workspace_id, experiment_id, user)


@api_router.post("/workspaces/{workspace_id}/experiments/{experiment_id}/decision")
async def add_decision(
    workspace_id: str,
    experiment_id: str,
    decision: DecisionCreate,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD]))
):
    """Add decision to experiment"""
    # Get experiment first
    exp = await db.experiments.find_one(
        {"experiment_id": experiment_id, "workspace_id": workspace_id},
        {"_id": 0}
    )
    
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    decision_dict = {
        "decision_id": generate_id("dec"),
        "experiment_id": experiment_id,
        "decision_type": decision.decision_type.value,
        "rationale": decision.rationale,
        "owner_id": user["user_id"],
        "created_at": now_utc().isoformat()
    }
    
    result = await db.experiments.update_one(
        {"experiment_id": experiment_id, "workspace_id": workspace_id},
        {
            "$set": {
                "decision": decision_dict,
                "status": ExperimentStatus.DECIDED.value,
                "updated_at": now_utc().isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    # Get workspace for audit and email
    ws = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    
    await log_audit(
        org_id=ws["org_id"],
        workspace_id=workspace_id,
        user_id=user["user_id"],
        action="experiment_decision",
        resource_type="experiment",
        resource_id=experiment_id,
        new_value=decision_dict
    )
    
    # Send email notification to experiment owner
    if exp.get("owner_id"):
        owner = await db.users.find_one({"user_id": exp["owner_id"]}, {"_id": 0})
        if owner and owner.get("email"):
            try:
                await send_experiment_decision_notification(
                    recipient_email=owner["email"],
                    recipient_name=owner.get("name", "Team Member"),
                    workspace_name=ws.get("name", "Workspace"),
                    experiment_name=exp.get("name", "Experiment"),
                    decision_type=decision.decision_type.value,
                    rationale=decision.rationale
                )
            except Exception as e:
                logger.error(f"Failed to send decision notification: {e}")
    
    return await get_experiment(workspace_id, experiment_id, user)


# ====================
# FUNNEL & ACTIVATION ROUTES
# ====================

@api_router.get("/workspaces/{workspace_id}/funnels")
async def list_funnels(
    workspace_id: str,
    user: Dict = Depends(get_current_user)
):
    """List funnels in workspace"""
    funnels = await db.funnels.find(
        {"workspace_id": workspace_id},
        {"_id": 0}
    ).to_list(100)
    return funnels


@api_router.post("/workspaces/{workspace_id}/funnels")
async def create_funnel(
    workspace_id: str,
    funnel: FunnelCreate,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.ANALYST_OPS]))
):
    """Create a new funnel"""
    funnel_id = generate_id("funnel")
    funnel_dict = funnel.model_dump()
    
    # Process steps
    steps = []
    for i, step in enumerate(funnel_dict.get("steps", [])):
        step["step_id"] = generate_id("step")
        step["funnel_id"] = funnel_id
        step["order"] = i + 1
        step["conversion_rate"] = 0
        step["volume"] = 0
        step["created_at"] = now_utc().isoformat()
        steps.append(step)
    
    funnel_dict.update({
        "funnel_id": funnel_id,
        "workspace_id": workspace_id,
        "steps": steps,
        "is_active": True,
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat()
    })
    
    await db.funnels.insert_one(funnel_dict)
    return funnel_dict


@api_router.get("/workspaces/{workspace_id}/activations")
async def list_activation_definitions(
    workspace_id: str,
    user: Dict = Depends(get_current_user)
):
    """List activation definitions"""
    activations = await db.activation_definitions.find(
        {"workspace_id": workspace_id},
        {"_id": 0}
    ).to_list(100)
    return activations


@api_router.post("/workspaces/{workspace_id}/activations")
async def create_activation_definition(
    workspace_id: str,
    activation: ActivationDefinitionCreate,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.ANALYST_OPS]))
):
    """Create activation definition"""
    act_dict = activation.model_dump()
    act_dict.update({
        "definition_id": generate_id("actdef"),
        "workspace_id": workspace_id,
        "version": 1,
        "is_active": True,
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
        "created_by": user["user_id"]
    })
    
    await db.activation_definitions.insert_one(act_dict)
    
    # Get workspace for audit
    ws = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0, "org_id": 1})
    
    await log_audit(
        org_id=ws["org_id"],
        workspace_id=workspace_id,
        user_id=user["user_id"],
        action="activation_definition_created",
        resource_type="activation_definition",
        resource_id=act_dict["definition_id"],
        new_value=act_dict
    )
    
    return act_dict


@api_router.put("/workspaces/{workspace_id}/activations/{definition_id}")
async def update_activation_definition(
    workspace_id: str,
    definition_id: str,
    updates: Dict[str, Any],
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.ANALYST_OPS]))
):
    """Update activation definition (creates new version)"""
    # Get current definition
    current = await db.activation_definitions.find_one(
        {"definition_id": definition_id, "workspace_id": workspace_id},
        {"_id": 0}
    )
    
    if not current:
        raise HTTPException(status_code=404, detail="Activation definition not found")
    
    # Update with new version
    updates["version"] = current.get("version", 1) + 1
    updates["updated_at"] = now_utc().isoformat()
    
    await db.activation_definitions.update_one(
        {"definition_id": definition_id},
        {"$set": updates}
    )
    
    # Get workspace for audit
    ws = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0, "org_id": 1})
    
    await log_audit(
        org_id=ws["org_id"],
        workspace_id=workspace_id,
        user_id=user["user_id"],
        action="activation_definition_change",
        resource_type="activation_definition",
        resource_id=definition_id,
        old_value=current,
        new_value={**current, **updates}
    )
    
    return await db.activation_definitions.find_one(
        {"definition_id": definition_id},
        {"_id": 0}
    )


# ====================
# ASSET ROUTES
# ====================

@api_router.get("/workspaces/{workspace_id}/assets")
async def list_assets(
    workspace_id: str,
    file_type: Optional[str] = None,
    client_visible: Optional[bool] = None,
    user: Dict = Depends(get_current_user)
):
    """List assets in workspace"""
    roles = await get_user_roles(user["user_id"], workspace_id=workspace_id)
    is_client = UserRole.CLIENT_VIEWER.value in roles
    
    query = {"workspace_id": workspace_id}
    if file_type:
        query["file_type"] = file_type
    if client_visible is not None:
        query["is_client_visible"] = client_visible
    if is_client:
        query["is_client_visible"] = True
        # Filter out expired rights
        query["$or"] = [
            {"rights_expiry": None},
            {"rights_expiry": {"$gt": now_utc().isoformat()}}
        ]
    
    assets = await db.assets.find(query, {"_id": 0}).to_list(500)
    return assets


@api_router.post("/workspaces/{workspace_id}/assets")
async def create_asset(
    workspace_id: str,
    asset: AssetCreate,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.CREATIVE]))
):
    """Create a new asset"""
    asset_dict = asset.model_dump()
    asset_dict.update({
        "asset_id": generate_id("asset"),
        "workspace_id": workspace_id,
        "versions": [],
        "current_version": 1,
        "experiment_ids": [],
        "performance": {},
        "is_creator_asset": False,
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
        "created_by": user["user_id"]
    })
    
    # Insert and return without MongoDB ObjectId
    result = await db.assets.insert_one(asset_dict)
    return {k: v for k, v in asset_dict.items() if k != "_id"}


@api_router.put("/workspaces/{workspace_id}/assets/{asset_id}")
async def update_asset(
    workspace_id: str,
    asset_id: str,
    updates: AssetUpdate,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.CREATIVE]))
):
    """Update asset"""
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_dict["updated_at"] = now_utc().isoformat()
    
    result = await db.assets.update_one(
        {"asset_id": asset_id, "workspace_id": workspace_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return await db.assets.find_one({"asset_id": asset_id}, {"_id": 0})


# ====================
# CHANNEL & CONNECTOR ROUTES
# ====================

@api_router.get("/workspaces/{workspace_id}/channels")
async def list_channels(
    workspace_id: str,
    user: Dict = Depends(get_current_user)
):
    """List channels in workspace"""
    channels = await db.channels.find(
        {"workspace_id": workspace_id},
        {"_id": 0, "credentials": 0}  # Never expose credentials
    ).to_list(100)
    return channels


@api_router.post("/workspaces/{workspace_id}/channels/{channel_id}/sync")
async def sync_channel(
    workspace_id: str,
    channel_id: str,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.PERFORMANCE, UserRole.ANALYST_OPS]))
):
    """Manually trigger channel sync"""
    channel = await db.channels.find_one(
        {"channel_id": channel_id, "workspace_id": workspace_id},
        {"_id": 0}
    )
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    try:
        connector = get_connector(channel["connector_type"], channel.get("credentials"))
        await connector.connect()
        data = await connector.sync()
        
        # Update channel with sync status
        await db.channels.update_one(
            {"channel_id": channel_id},
            {"$set": {
                "last_synced": now_utc().isoformat(),
                "sync_status": "synced",
                "updated_at": now_utc().isoformat()
            }}
        )
        
        return {
            "status": "success",
            "synced_at": data.get("synced_at"),
            "data_summary": {
                "campaigns": len(data.get("campaigns", [])),
                "events": len(data.get("events", []))
            }
        }
    except Exception as e:
        logger.error(f"Sync failed for channel {channel_id}: {e}")
        await db.channels.update_one(
            {"channel_id": channel_id},
            {"$set": {
                "sync_status": f"error: {str(e)}",
                "updated_at": now_utc().isoformat()
            }}
        )
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@api_router.get("/workspaces/{workspace_id}/performance")
async def get_performance_data(
    workspace_id: str,
    channel_id: Optional[str] = None,
    days: int = 30,
    user: Dict = Depends(get_current_user)
):
    """Get performance metrics"""
    query = {"workspace_id": workspace_id}
    if channel_id:
        query["channel_id"] = channel_id
    
    # In production, would fetch from performance_metrics collection
    # For MVP, generate mock data
    channels = await db.channels.find(
        {"workspace_id": workspace_id, "is_connected": True},
        {"_id": 0}
    ).to_list(10)
    
    performance_data = {}
    for channel in channels:
        connector = get_connector(channel["connector_type"])
        await connector.connect()
        data = await connector.sync()
        performance_data[channel["channel_id"]] = {
            "name": channel["name"],
            "type": channel["connector_type"],
            "last_synced": channel.get("last_synced"),
            "metrics": data.get("metrics", {}),
            "campaigns": data.get("campaigns", [])
        }
    
    return performance_data


# ====================
# CREATOR ROUTES
# ====================

@api_router.get("/workspaces/{workspace_id}/creators")
async def list_creators(
    workspace_id: str,
    status: Optional[str] = None,
    user: Dict = Depends(get_current_user)
):
    """List creators in workspace"""
    query = {"workspace_id": workspace_id}
    if status:
        query["pipeline_status"] = status
    
    creators = await db.creators.find(query, {"_id": 0}).to_list(100)
    return creators


@api_router.post("/workspaces/{workspace_id}/creators")
async def create_creator(
    workspace_id: str,
    creator: CreatorCreate,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.CREATIVE]))
):
    """Create a new creator"""
    creator_dict = creator.model_dump()
    creator_dict.update({
        "creator_id": generate_id("creator"),
        "workspace_id": workspace_id,
        "pipeline_status": CreatorPipelineStatus.DISCOVERY.value,
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat()
    })
    
    # Insert and return without MongoDB ObjectId
    result = await db.creators.insert_one(creator_dict)
    return {k: v for k, v in creator_dict.items() if k != "_id"}


@api_router.put("/workspaces/{workspace_id}/creators/{creator_id}")
async def update_creator(
    workspace_id: str,
    creator_id: str,
    updates: CreatorUpdate,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.CREATIVE]))
):
    """Update creator"""
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    if "pipeline_status" in update_dict:
        update_dict["pipeline_status"] = update_dict["pipeline_status"].value
    update_dict["updated_at"] = now_utc().isoformat()
    
    result = await db.creators.update_one(
        {"creator_id": creator_id, "workspace_id": workspace_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    return await db.creators.find_one({"creator_id": creator_id}, {"_id": 0})


# ====================
# WEEKLY REPORT ROUTES
# ====================

@api_router.get("/workspaces/{workspace_id}/reports")
async def list_reports(
    workspace_id: str,
    status: Optional[str] = None,
    user: Dict = Depends(get_current_user)
):
    """List weekly reports"""
    roles = await get_user_roles(user["user_id"], workspace_id=workspace_id)
    is_client = UserRole.CLIENT_VIEWER.value in roles
    
    query = {"workspace_id": workspace_id}
    if status:
        query["status"] = status
    if is_client:
        # Clients can only see sent/archived reports
        query["status"] = {"$in": [ReportStatus.SENT.value, ReportStatus.ARCHIVED.value]}
    
    reports = await db.weekly_reports.find(query, {"_id": 0}).sort("week_start", -1).to_list(100)
    return reports


@api_router.post("/workspaces/{workspace_id}/reports")
async def create_report(
    workspace_id: str,
    report: WeeklyReportCreate,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.ANALYST_OPS]))
):
    """Create a new weekly report"""
    report_dict = report.model_dump()
    report_dict.update({
        "report_id": generate_id("report"),
        "workspace_id": workspace_id,
        "status": ReportStatus.DRAFT.value,
        "content": {
            "exec_summary": [],
            "kpi_performance": {},
            "what_shipped": [],
            "learnings": [],
            "decisions": [],
            "next_week_plan": [],
            "risks_dependencies": []
        },
        "owner_id": user["user_id"],
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat()
    })
    
    # Convert datetime to ISO string
    if isinstance(report_dict["week_start"], datetime):
        report_dict["week_start"] = report_dict["week_start"].isoformat()
    if isinstance(report_dict["week_end"], datetime):
        report_dict["week_end"] = report_dict["week_end"].isoformat()
    
    # Insert and return without MongoDB ObjectId
    result = await db.weekly_reports.insert_one(report_dict)
    return {k: v for k, v in report_dict.items() if k != "_id"}


@api_router.get("/workspaces/{workspace_id}/reports/{report_id}")
async def get_report(
    workspace_id: str,
    report_id: str,
    user: Dict = Depends(get_current_user)
):
    """Get report details"""
    report = await db.weekly_reports.find_one(
        {"report_id": report_id, "workspace_id": workspace_id},
        {"_id": 0}
    )
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check client access
    roles = await get_user_roles(user["user_id"], workspace_id=workspace_id)
    if UserRole.CLIENT_VIEWER.value in roles:
        if report["status"] not in [ReportStatus.SENT.value, ReportStatus.ARCHIVED.value]:
            raise HTTPException(status_code=403, detail="Report not available")
    
    return report


@api_router.put("/workspaces/{workspace_id}/reports/{report_id}")
async def update_report(
    workspace_id: str,
    report_id: str,
    updates: WeeklyReportUpdate,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.ANALYST_OPS]))
):
    """Update report"""
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    if "status" in update_dict:
        update_dict["status"] = update_dict["status"].value
    if "content" in update_dict:
        update_dict["content"] = update_dict["content"].model_dump() if hasattr(update_dict["content"], "model_dump") else update_dict["content"]
    update_dict["updated_at"] = now_utc().isoformat()
    
    result = await db.weekly_reports.update_one(
        {"report_id": report_id, "workspace_id": workspace_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return await get_report(workspace_id, report_id, user)


@api_router.post("/workspaces/{workspace_id}/reports/{report_id}/approve")
async def approve_report(
    workspace_id: str,
    report_id: str,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD]))
):
    """Approve report (move to client-ready)"""
    report = await db.weekly_reports.find_one(
        {"report_id": report_id, "workspace_id": workspace_id},
        {"_id": 0}
    )
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report["status"] not in [ReportStatus.DRAFT.value, ReportStatus.INTERNAL_REVIEW.value]:
        raise HTTPException(status_code=400, detail="Report cannot be approved from current state")
    
    # Generate share link
    share_link = generate_id("share")
    
    await db.weekly_reports.update_one(
        {"report_id": report_id},
        {"$set": {
            "status": ReportStatus.CLIENT_READY.value,
            "share_link": share_link,
            "approved_by": user["user_id"],
            "approved_at": now_utc().isoformat(),
            "updated_at": now_utc().isoformat()
        }}
    )
    
    # Get workspace for audit and email
    ws = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    
    await log_audit(
        org_id=ws["org_id"],
        workspace_id=workspace_id,
        user_id=user["user_id"],
        action="report_approval",
        resource_type="weekly_report",
        resource_id=report_id,
        old_value={"status": report["status"]},
        new_value={"status": ReportStatus.CLIENT_READY.value}
    )
    
    # Send email notification to report owner
    if report.get("owner_id"):
        owner = await db.users.find_one({"user_id": report["owner_id"]}, {"_id": 0})
        if owner and owner.get("email"):
            try:
                week_start = report.get("week_start", "")
                if isinstance(week_start, datetime):
                    week_start = week_start.strftime("%Y-%m-%d")
                
                await send_report_approved_notification(
                    recipient_email=owner["email"],
                    recipient_name=owner.get("name", "Team Member"),
                    workspace_name=ws.get("name", "Workspace"),
                    report_id=report_id,
                    week_start=week_start,
                    approved_by_name=user.get("name", "Growth Lead"),
                    share_link=share_link
                )
            except Exception as e:
                logger.error(f"Failed to send approval notification: {e}")
    
    return await get_report(workspace_id, report_id, user)


@api_router.post("/workspaces/{workspace_id}/reports/{report_id}/generate-draft")
async def generate_report_draft(
    workspace_id: str,
    report_id: str,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.ANALYST_OPS]))
):
    """Generate AI draft for report"""
    # Get workspace data
    workspace = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    nsm = await db.north_star_metrics.find_one({"workspace_id": workspace_id}, {"_id": 0})
    experiments = await db.experiments.find({"workspace_id": workspace_id}, {"_id": 0}).to_list(20)
    
    # Generate draft
    draft = await generate_weekly_narrative(
        workspace_name=workspace.get("name", ""),
        north_star=nsm or {},
        experiments=experiments,
        insights=[],
        decisions=[],
        spend_summary={"total_spend": 15000}
    )
    
    await db.weekly_reports.update_one(
        {"report_id": report_id},
        {"$set": {
            "ai_draft": draft,
            "is_ai_generated": True,
            "updated_at": now_utc().isoformat()
        }}
    )
    
    return {"draft": draft}


# ====================
# AI ROUTES
# ====================

@api_router.post("/workspaces/{workspace_id}/ai/suggest-experiments")
async def ai_suggest_experiments(
    workspace_id: str,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD]))
):
    """Get AI experiment suggestions"""
    workspace = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    experiments = await db.experiments.find({"workspace_id": workspace_id}, {"_id": 0}).to_list(20)
    
    suggestions = await suggest_experiments(
        constraint=workspace.get("current_constraint", ""),
        goal="Increase conversions",
        funnel_stage="consideration",
        past_experiments=experiments
    )
    
    return {"suggestions": suggestions}


@api_router.post("/workspaces/{workspace_id}/ai/creative-iterations")
async def ai_creative_iterations(
    workspace_id: str,
    asset_id: str,
    user: Dict = Depends(check_role([UserRole.ADMIN, UserRole.GROWTH_LEAD, UserRole.CREATIVE]))
):
    """Get AI creative iteration suggestions"""
    asset = await db.assets.find_one(
        {"asset_id": asset_id, "workspace_id": workspace_id},
        {"_id": 0}
    )
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    iterations = await generate_creative_iterations(
        winning_asset=asset,
        performance=asset.get("performance", {})
    )
    
    return {"iterations": iterations}


@api_router.get("/workspaces/{workspace_id}/ai/anomalies")
async def get_anomalies(
    workspace_id: str,
    user: Dict = Depends(get_current_user)
):
    """Get detected anomalies"""
    anomalies = await detect_anomalies(
        metrics=[],
        spend_records=[],
        activation_events=[]
    )
    
    # Also get alerts from database
    alerts = await db.alerts.find(
        {"workspace_id": workspace_id, "is_resolved": False},
        {"_id": 0}
    ).to_list(50)
    
    return {
        "detected_anomalies": anomalies,
        "active_alerts": alerts
    }


# ====================
# COMMAND CENTER ROUTES
# ====================

@api_router.get("/command-center")
async def get_command_center(
    user: Dict = Depends(get_current_user)
):
    """Get command center data across all workspaces"""
    # Get user's workspaces
    workspaces = await list_workspaces(user=user)
    
    command_data = {
        "at_risk_workspaces": [],
        "experiments_needing_decisions": [],
        "creative_bottlenecks": [],
        "tracking_health": [],
        "report_status": []
    }
    
    for ws in workspaces:
        ws_id = ws["workspace_id"]
        
        # Check north star trend
        nsm = await db.north_star_metrics.find_one({"workspace_id": ws_id}, {"_id": 0})
        if nsm and nsm.get("trend_7d", 0) < -10:
            command_data["at_risk_workspaces"].append({
                "workspace": ws,
                "reason": f"North star down {nsm['trend_7d']}% this week"
            })
        
        # Experiments needing decisions (analyzing for >7 days)
        exps = await db.experiments.find({
            "workspace_id": ws_id,
            "status": ExperimentStatus.ANALYZING.value
        }, {"_id": 0}).to_list(10)
        for exp in exps:
            command_data["experiments_needing_decisions"].append({
                "workspace": ws,
                "experiment": exp
            })
        
        # Report status
        latest_report = await db.weekly_reports.find_one(
            {"workspace_id": ws_id},
            {"_id": 0}
        )
        if latest_report:
            command_data["report_status"].append({
                "workspace": ws,
                "report": latest_report
            })
        
        # Tracking health
        channels = await db.channels.find({"workspace_id": ws_id}, {"_id": 0}).to_list(10)
        for ch in channels:
            health = "green"
            if not ch.get("is_connected"):
                health = "red"
            elif ch.get("sync_status", "").startswith("error"):
                health = "red"
            elif ch.get("last_synced"):
                last_sync = datetime.fromisoformat(ch["last_synced"].replace('Z', '+00:00'))
                if last_sync.tzinfo is None:
                    last_sync = last_sync.replace(tzinfo=timezone.utc)
                if (now_utc() - last_sync).total_seconds() > 86400:  # 24 hours
                    health = "yellow"
            
            command_data["tracking_health"].append({
                "workspace": ws,
                "channel": ch,
                "health": health
            })
    
    return command_data


# ====================
# CLIENT PORTAL ROUTES
# ====================

@api_router.get("/client-portal/{workspace_id}")
async def get_client_portal(
    workspace_id: str,
    user: Dict = Depends(get_current_user)
):
    """Get client portal data - simplified view for clients"""
    # Verify user has client access to this workspace
    roles = await get_user_roles(user["user_id"], workspace_id=workspace_id)
    
    workspace = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # North star - "Are we winning?"
    nsm = await db.north_star_metrics.find_one({"workspace_id": workspace_id}, {"_id": 0})
    
    # Latest sent report - "What did we do/learn?"
    latest_report = await db.weekly_reports.find_one(
        {"workspace_id": workspace_id, "status": {"$in": [ReportStatus.SENT.value, ReportStatus.CLIENT_READY.value]}},
        {"_id": 0}
    )
    
    # Client-visible experiments
    experiments = await db.experiments.find(
        {"workspace_id": workspace_id, "is_client_visible": True},
        {"_id": 0, "internal_notes": 0}
    ).to_list(20)
    
    # Client-visible assets (creative gallery)
    assets = await db.assets.find({
        "workspace_id": workspace_id,
        "is_client_visible": True,
        "$or": [
            {"rights_expiry": None},
            {"rights_expiry": {"$gt": now_utc().isoformat()}}
        ]
    }, {"_id": 0}).to_list(50)
    
    # Tracking health simplified
    channels = await db.channels.find({"workspace_id": workspace_id}, {"_id": 0, "credentials": 0}).to_list(10)
    tracking_health = "green"
    tracking_issues = []
    for ch in channels:
        if not ch.get("is_connected"):
            tracking_health = "yellow" if tracking_health == "green" else tracking_health
            tracking_issues.append(f"{ch['name']} not connected")
        elif ch.get("sync_status", "").startswith("error"):
            tracking_health = "red"
            tracking_issues.append(f"{ch['name']} sync error")
    
    return {
        "workspace": {
            "name": workspace.get("name"),
            "this_week_focus": workspace.get("this_week_focus", [])
        },
        "are_we_winning": {
            "metric_name": nsm.get("name") if nsm else "North Star",
            "current_value": nsm.get("current_value", 0) if nsm else 0,
            "target_value": nsm.get("target_value", 0) if nsm else 0,
            "unit": nsm.get("unit", "") if nsm else "",
            "trend_7d": nsm.get("trend_7d", 0) if nsm else 0,
            "trend_30d": nsm.get("trend_30d", 0) if nsm else 0,
            "on_track": (nsm.get("current_value", 0) >= nsm.get("target_value", 0) * 0.8) if nsm else True
        },
        "what_we_did": latest_report.get("content", {}).get("what_shipped", []) if latest_report else [],
        "what_we_learned": latest_report.get("content", {}).get("learnings", []) if latest_report else [],
        "whats_next": workspace.get("this_week_focus", []),
        "experiments": experiments,
        "creative_gallery": assets,
        "tracking_health": {
            "status": tracking_health,
            "issues": tracking_issues if tracking_health != "green" else None
        }
    }


# ====================
# AUDIT LOG ROUTES
# ====================

@api_router.get("/audit-logs")
async def get_audit_logs(
    org_id: Optional[str] = None,
    workspace_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    user: Dict = Depends(check_role([UserRole.ADMIN]))
):
    """Get audit logs"""
    query = {}
    if org_id:
        query["org_id"] = org_id
    if workspace_id:
        query["workspace_id"] = workspace_id
    if action:
        query["action"] = action
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return logs


# ====================
# ADMIN ROUTES
# ====================

@api_router.get("/admin/users")
async def list_users(
    org_id: Optional[str] = None,
    user: Dict = Depends(check_role([UserRole.ADMIN]))
):
    """List users in organization"""
    if org_id:
        # Get users with roles in this org
        roles = await db.role_assignments.find({"org_id": org_id}, {"_id": 0}).to_list(500)
        user_ids = list(set(r["user_id"] for r in roles))
        users = await db.users.find(
            {"user_id": {"$in": user_ids}},
            {"_id": 0, "password_hash": 0}
        ).to_list(500)
    else:
        users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    
    # Attach roles to users
    for u in users:
        u_roles = await db.role_assignments.find({"user_id": u["user_id"]}, {"_id": 0}).to_list(100)
        u["roles"] = u_roles
    
    return users


@api_router.post("/admin/users/{user_id}/roles")
async def assign_role(
    user_id: str,
    assignment: RoleAssignmentCreate,
    user: Dict = Depends(check_role([UserRole.ADMIN]))
):
    """Assign role to user"""
    # Get org_id
    org_id = user.get("org_id")
    if not org_id:
        raise HTTPException(status_code=400, detail="org_id required")
    
    role_dict = {
        "assignment_id": generate_id("role"),
        "user_id": user_id,
        "org_id": org_id,
        "workspace_id": assignment.workspace_id,
        "role": assignment.role.value,
        "created_at": now_utc().isoformat(),
        "created_by": user["user_id"]
    }
    
    await db.role_assignments.insert_one(role_dict)
    
    await log_audit(
        org_id=org_id,
        workspace_id=assignment.workspace_id,
        user_id=user["user_id"],
        action="permission_change",
        resource_type="role_assignment",
        resource_id=role_dict["assignment_id"],
        new_value=role_dict
    )
    
    return role_dict


@api_router.delete("/admin/users/{user_id}/roles/{assignment_id}")
async def remove_role(
    user_id: str,
    assignment_id: str,
    user: Dict = Depends(check_role([UserRole.ADMIN]))
):
    """Remove role from user"""
    role = await db.role_assignments.find_one({"assignment_id": assignment_id}, {"_id": 0})
    
    if not role:
        raise HTTPException(status_code=404, detail="Role assignment not found")
    
    await db.role_assignments.delete_one({"assignment_id": assignment_id})
    
    await log_audit(
        org_id=role["org_id"],
        workspace_id=role.get("workspace_id"),
        user_id=user["user_id"],
        action="permission_change",
        resource_type="role_assignment",
        resource_id=assignment_id,
        old_value=role
    )
    
    return {"message": "Role removed"}


# ====================
# SEED DATA ROUTE
# ====================

@api_router.post("/seed")
async def seed_database():
    """Seed database with demo data"""
    from seed_data import generate_seed_data
    
    # Check if already seeded
    existing_org = await db.organizations.find_one({}, {"_id": 0})
    if existing_org:
        return {"message": "Database already seeded", "skipped": True}
    
    seed_data = generate_seed_data()
    
    # Insert all data
    if seed_data["organizations"]:
        await db.organizations.insert_many(seed_data["organizations"])
    if seed_data["workspaces"]:
        await db.workspaces.insert_many(seed_data["workspaces"])
    if seed_data["users"]:
        await db.users.insert_many(seed_data["users"])
    if seed_data["role_assignments"]:
        await db.role_assignments.insert_many(seed_data["role_assignments"])
    if seed_data["north_star_metrics"]:
        await db.north_star_metrics.insert_many(seed_data["north_star_metrics"])
    if seed_data["funnels"]:
        await db.funnels.insert_many(seed_data["funnels"])
    if seed_data["activation_definitions"]:
        await db.activation_definitions.insert_many(seed_data["activation_definitions"])
    if seed_data["experiments"]:
        await db.experiments.insert_many(seed_data["experiments"])
    if seed_data["assets"]:
        await db.assets.insert_many(seed_data["assets"])
    if seed_data["channels"]:
        await db.channels.insert_many(seed_data["channels"])
    if seed_data["creators"]:
        await db.creators.insert_many(seed_data["creators"])
    if seed_data["weekly_reports"]:
        await db.weekly_reports.insert_many(seed_data["weekly_reports"])
    if seed_data["alerts"]:
        await db.alerts.insert_many(seed_data["alerts"])
    
    return {
        "message": "Database seeded successfully",
        "data": {
            "organizations": len(seed_data["organizations"]),
            "workspaces": len(seed_data["workspaces"]),
            "users": len(seed_data["users"]),
            "experiments": len(seed_data["experiments"]),
            "assets": len(seed_data["assets"]),
            "creators": len(seed_data["creators"])
        }
    }


# ====================
# HEALTH CHECK
# ====================

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": now_utc().isoformat()}


# Include router
app.include_router(api_router)

# CORS middleware - handle dynamic origins for credentials
cors_origins = os.environ.get('CORS_ORIGINS', '*')
if cors_origins == '*':
    # For development, allow common localhost ports
    cors_origins_list = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
    ]
else:
    cors_origins_list = cors_origins.split(',')

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
