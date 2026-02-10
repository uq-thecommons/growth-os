"""
thecommons. Growth OS - Backend Models
Database models for multi-tenant growth operations platform
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timezone
from enum import Enum
import uuid

# ====================
# ENUMS
# ====================

class UserRole(str, Enum):
    ADMIN = "admin"
    GROWTH_LEAD = "growth_lead"
    PERFORMANCE = "performance"
    CREATIVE = "creative"
    ANALYST_OPS = "analyst_ops"
    CLIENT_VIEWER = "client_viewer"

class ExperimentStatus(str, Enum):
    BACKLOG = "backlog"
    READY = "ready"
    LIVE = "live"
    ANALYZING = "analyzing"
    DECIDED = "decided"

class DecisionType(str, Enum):
    KILL = "kill"
    ITERATE = "iterate"
    SCALE = "scale"

class ReportStatus(str, Enum):
    DRAFT = "draft"
    INTERNAL_REVIEW = "internal_review"
    CLIENT_READY = "client_ready"
    SENT = "sent"
    ARCHIVED = "archived"

class CreatorPipelineStatus(str, Enum):
    DISCOVERY = "discovery"
    CONTACTED = "contacted"
    CONFIRMED = "confirmed"
    BRIEFED = "briefed"
    DELIVERED = "delivered"
    LIVE = "live"
    AMPLIFIED = "amplified"
    COMPLETE = "complete"

class HealthStatus(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"

class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ConnectorType(str, Enum):
    GA4 = "ga4"
    META_ADS = "meta_ads"
    GOOGLE_ADS = "google_ads"

# ====================
# HELPER FUNCTIONS
# ====================

def generate_id(prefix: str = "") -> str:
    """Generate a unique ID with optional prefix"""
    return f"{prefix}_{uuid.uuid4().hex[:12]}" if prefix else uuid.uuid4().hex[:12]

def now_utc() -> datetime:
    """Get current UTC datetime"""
    return datetime.now(timezone.utc)

# ====================
# BASE MODELS
# ====================

class BaseDBModel(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

# ====================
# TENANCY & USERS
# ====================

class Organization(BaseDBModel):
    org_id: str = Field(default_factory=lambda: generate_id("org"))
    name: str
    slug: str
    logo_url: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class OrganizationCreate(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None

class ClientWorkspace(BaseDBModel):
    workspace_id: str = Field(default_factory=lambda: generate_id("ws"))
    org_id: str
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    # Client details
    industry: Optional[str] = None
    website_url: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    # Goals and focus
    initial_goals: Optional[str] = None
    current_constraint: Optional[str] = None
    this_week_focus: List[str] = Field(default_factory=list)
    # Assignment
    growth_lead_id: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class WorkspaceCreate(BaseModel):
    name: str
    slug: Optional[str] = None  # Auto-generate if not provided
    description: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    website_url: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    initial_goals: Optional[str] = None
    growth_lead_id: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    website_url: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    initial_goals: Optional[str] = None
    current_constraint: Optional[str] = None
    this_week_focus: Optional[List[str]] = None
    growth_lead_id: Optional[str] = None
    is_active: Optional[bool] = None

class User(BaseDBModel):
    user_id: str = Field(default_factory=lambda: generate_id("user"))
    email: str
    name: str
    picture: Optional[str] = None
    password_hash: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class UserCreate(BaseModel):
    email: str
    name: str
    password: Optional[str] = None

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_active: bool = True

class RoleAssignment(BaseDBModel):
    assignment_id: str = Field(default_factory=lambda: generate_id("role"))
    user_id: str
    org_id: str
    workspace_id: Optional[str] = None  # None = org-level role
    role: UserRole
    created_at: datetime = Field(default_factory=now_utc)
    created_by: str

class RoleAssignmentCreate(BaseModel):
    user_id: str
    workspace_id: Optional[str] = None
    role: UserRole

class UserSession(BaseDBModel):
    session_id: str = Field(default_factory=lambda: generate_id("sess"))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=now_utc)

# ====================
# STRATEGY
# ====================

class Goal(BaseDBModel):
    goal_id: str = Field(default_factory=lambda: generate_id("goal"))
    workspace_id: str
    name: str
    description: Optional[str] = None
    target_value: Optional[float] = None
    target_date: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class GoalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_value: Optional[float] = None
    target_date: Optional[datetime] = None

class NorthStarMetric(BaseDBModel):
    metric_id: str = Field(default_factory=lambda: generate_id("nsm"))
    workspace_id: str
    name: str
    description: Optional[str] = None
    current_value: float = 0
    target_value: float = 0
    unit: str = ""
    trend_7d: float = 0
    trend_30d: float = 0
    trend_90d: float = 0
    last_updated: datetime = Field(default_factory=now_utc)
    created_at: datetime = Field(default_factory=now_utc)

class NorthStarMetricCreate(BaseModel):
    name: str
    description: Optional[str] = None
    current_value: float = 0
    target_value: float = 0
    unit: str = ""

# ====================
# FUNNEL & ACTIVATION
# ====================

class FunnelStep(BaseDBModel):
    step_id: str = Field(default_factory=lambda: generate_id("step"))
    funnel_id: str
    name: str
    description: Optional[str] = None
    order: int
    event_name: Optional[str] = None
    conversion_rate: float = 0
    volume: int = 0
    created_at: datetime = Field(default_factory=now_utc)

class FunnelStepCreate(BaseModel):
    name: str
    description: Optional[str] = None
    order: int
    event_name: Optional[str] = None

class Funnel(BaseDBModel):
    funnel_id: str = Field(default_factory=lambda: generate_id("funnel"))
    workspace_id: str
    name: str
    description: Optional[str] = None
    steps: List[FunnelStep] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class FunnelCreate(BaseModel):
    name: str
    description: Optional[str] = None
    steps: List[FunnelStepCreate] = Field(default_factory=list)

class ActivationRule(BaseModel):
    """Flexible activation rule structure"""
    rule_type: Literal["single_event", "sequence", "composite"]
    event_name: Optional[str] = None
    events: Optional[List[str]] = None  # For sequence
    time_window_hours: Optional[int] = None
    operator: Optional[Literal["AND", "OR"]] = None
    sub_rules: Optional[List["ActivationRule"]] = None

class ActivationDefinition(BaseDBModel):
    definition_id: str = Field(default_factory=lambda: generate_id("actdef"))
    workspace_id: str
    name: str
    description: Optional[str] = None
    rule: ActivationRule
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    last_verified: Optional[datetime] = None
    version: int = 1
    is_active: bool = True
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    created_by: str

class ActivationDefinitionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    rule: ActivationRule
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM

# ====================
# EXPERIMENTATION
# ====================

class Hypothesis(BaseModel):
    belief: str  # "We believe..."
    target: str  # "for..."
    because: str  # "because..."

class Variant(BaseDBModel):
    variant_id: str = Field(default_factory=lambda: generate_id("var"))
    experiment_id: str
    name: str
    description: Optional[str] = None
    asset_ids: List[str] = Field(default_factory=list)
    audience_description: Optional[str] = None
    landing_page_url: Optional[str] = None
    results: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now_utc)

class VariantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    asset_ids: List[str] = Field(default_factory=list)
    audience_description: Optional[str] = None
    landing_page_url: Optional[str] = None

class Decision(BaseDBModel):
    decision_id: str = Field(default_factory=lambda: generate_id("dec"))
    experiment_id: str
    decision_type: DecisionType
    rationale: str
    owner_id: str
    created_at: datetime = Field(default_factory=now_utc)

class DecisionCreate(BaseModel):
    decision_type: DecisionType
    rationale: str

class Insight(BaseDBModel):
    insight_id: str = Field(default_factory=lambda: generate_id("ins"))
    experiment_id: str
    workspace_id: str
    content: str
    evidence: Optional[str] = None
    is_client_visible: bool = False
    created_at: datetime = Field(default_factory=now_utc)
    created_by: str

class InsightCreate(BaseModel):
    content: str
    evidence: Optional[str] = None
    is_client_visible: bool = False

class Experiment(BaseDBModel):
    experiment_id: str = Field(default_factory=lambda: generate_id("exp"))
    workspace_id: str
    name: str
    description: Optional[str] = None
    hypothesis: Optional[Hypothesis] = None
    funnel_step_ids: List[str] = Field(default_factory=list)
    metric_target: Optional[str] = None
    metric_threshold: Optional[float] = None
    status: ExperimentStatus = ExperimentStatus.BACKLOG
    variants: List[Variant] = Field(default_factory=list)
    budget_allocation: Optional[float] = None
    runtime_notes: Optional[str] = None
    decision: Optional[Decision] = None
    insights: List[Insight] = Field(default_factory=list)
    internal_notes: Optional[str] = None  # Never shown to clients
    is_client_visible: bool = False
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    created_by: str

class ExperimentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    hypothesis: Optional[Hypothesis] = None
    funnel_step_ids: List[str] = Field(default_factory=list)
    metric_target: Optional[str] = None
    metric_threshold: Optional[float] = None
    budget_allocation: Optional[float] = None

class ExperimentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    hypothesis: Optional[Hypothesis] = None
    status: Optional[ExperimentStatus] = None
    funnel_step_ids: Optional[List[str]] = None
    metric_target: Optional[str] = None
    metric_threshold: Optional[float] = None
    budget_allocation: Optional[float] = None
    runtime_notes: Optional[str] = None
    internal_notes: Optional[str] = None
    is_client_visible: Optional[bool] = None

# ====================
# CREATIVE (ASSETS)
# ====================

class AssetVersion(BaseDBModel):
    version_id: str = Field(default_factory=lambda: generate_id("ver"))
    asset_id: str
    version_number: int
    file_url: str
    file_size: Optional[int] = None
    created_at: datetime = Field(default_factory=now_utc)
    created_by: str

class AssetTag(BaseModel):
    angle: Optional[str] = None
    hook: Optional[str] = None
    format: Optional[str] = None
    icp: Optional[str] = None  # Ideal Customer Profile
    funnel_stage: Optional[str] = None
    custom_tags: List[str] = Field(default_factory=list)

class Asset(BaseDBModel):
    asset_id: str = Field(default_factory=lambda: generate_id("asset"))
    workspace_id: str
    name: str
    description: Optional[str] = None
    file_type: str  # image, video, document
    file_url: str  # Cloudinary public_id or local path
    thumbnail_url: Optional[str] = None
    preview_url: Optional[str] = None  # For videos
    tags: AssetTag = Field(default_factory=AssetTag)
    versions: List[AssetVersion] = Field(default_factory=list)
    current_version: int = 1
    experiment_ids: List[str] = Field(default_factory=list)
    performance: Dict[str, float] = Field(default_factory=dict)  # CTR, CPC, CVR, CPA
    is_client_visible: bool = False
    rights_expiry: Optional[datetime] = None
    usage_terms: Optional[str] = None
    is_creator_asset: bool = False
    creator_id: Optional[str] = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    created_by: str

class AssetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    file_type: str
    file_url: str
    thumbnail_url: Optional[str] = None
    tags: Optional[AssetTag] = None
    is_client_visible: bool = False
    rights_expiry: Optional[datetime] = None
    usage_terms: Optional[str] = None

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[AssetTag] = None
    is_client_visible: Optional[bool] = None
    rights_expiry: Optional[datetime] = None
    usage_terms: Optional[str] = None

class CreativeBrief(BaseDBModel):
    brief_id: str = Field(default_factory=lambda: generate_id("brief"))
    workspace_id: str
    name: str
    objective: str
    target_audience: Optional[str] = None
    key_messages: List[str] = Field(default_factory=list)
    deliverables: List[str] = Field(default_factory=list)
    reference_asset_ids: List[str] = Field(default_factory=list)
    due_date: Optional[datetime] = None
    status: str = "draft"
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    created_by: str

class CreativeBriefCreate(BaseModel):
    name: str
    objective: str
    target_audience: Optional[str] = None
    key_messages: List[str] = Field(default_factory=list)
    deliverables: List[str] = Field(default_factory=list)
    due_date: Optional[datetime] = None

# ====================
# DISTRIBUTION & PERFORMANCE
# ====================

class Channel(BaseDBModel):
    channel_id: str = Field(default_factory=lambda: generate_id("ch"))
    workspace_id: str
    name: str
    connector_type: ConnectorType
    is_connected: bool = False
    last_synced: Optional[datetime] = None
    sync_status: Optional[str] = None
    credentials: Dict[str, Any] = Field(default_factory=dict)  # Encrypted in production
    settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class ChannelCreate(BaseModel):
    name: str
    connector_type: ConnectorType

class PlatformObjectRef(BaseDBModel):
    """Reference to platform objects (campaigns, adsets, ads)"""
    ref_id: str = Field(default_factory=lambda: generate_id("ref"))
    channel_id: str
    workspace_id: str
    object_type: str  # campaign, adset, ad
    platform_id: str  # ID on the platform
    name: str
    parent_ref_id: Optional[str] = None
    asset_ids: List[str] = Field(default_factory=list)
    status: str = "active"
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class PerformanceMetric(BaseDBModel):
    metric_id: str = Field(default_factory=lambda: generate_id("perf"))
    workspace_id: str
    channel_id: str
    ref_id: Optional[str] = None  # Platform object reference
    date: datetime
    impressions: int = 0
    clicks: int = 0
    spend: float = 0
    conversions: int = 0
    revenue: float = 0
    ctr: float = 0
    cpc: float = 0
    cpa: float = 0
    roas: float = 0
    custom_metrics: Dict[str, float] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now_utc)

class SpendRecord(BaseDBModel):
    record_id: str = Field(default_factory=lambda: generate_id("spend"))
    workspace_id: str
    channel_id: str
    date: datetime
    budget: float = 0
    actual_spend: float = 0
    pacing_status: str = "on_track"  # on_track, underpacing, overpacing
    created_at: datetime = Field(default_factory=now_utc)

# ====================
# CREATOR MODULE
# ====================

class Creator(BaseDBModel):
    creator_id: str = Field(default_factory=lambda: generate_id("creator"))
    workspace_id: str
    name: str
    handle: Optional[str] = None
    platform: str  # instagram, tiktok, youtube, etc.
    follower_count: Optional[int] = None
    engagement_rate: Optional[float] = None
    notes: Optional[str] = None
    fit_score: Optional[int] = None  # 1-10
    contact_email: Optional[str] = None
    pipeline_status: CreatorPipelineStatus = CreatorPipelineStatus.DISCOVERY
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class CreatorCreate(BaseModel):
    name: str
    handle: Optional[str] = None
    platform: str
    follower_count: Optional[int] = None
    engagement_rate: Optional[float] = None
    notes: Optional[str] = None
    fit_score: Optional[int] = None
    contact_email: Optional[str] = None

class CreatorUpdate(BaseModel):
    name: Optional[str] = None
    handle: Optional[str] = None
    platform: Optional[str] = None
    follower_count: Optional[int] = None
    engagement_rate: Optional[float] = None
    notes: Optional[str] = None
    fit_score: Optional[int] = None
    contact_email: Optional[str] = None
    pipeline_status: Optional[CreatorPipelineStatus] = None

class CreatorDeal(BaseDBModel):
    deal_id: str = Field(default_factory=lambda: generate_id("deal"))
    creator_id: str
    workspace_id: str
    rate: float
    rate_type: str  # flat, per_post, per_view
    deliverables: List[str] = Field(default_factory=list)
    terms: Optional[str] = None
    usage_rights: Optional[str] = None
    rights_expiry: Optional[datetime] = None
    status: str = "negotiating"
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class CreatorDealCreate(BaseModel):
    rate: float
    rate_type: str
    deliverables: List[str] = Field(default_factory=list)
    terms: Optional[str] = None
    usage_rights: Optional[str] = None
    rights_expiry: Optional[datetime] = None

class CreatorAsset(BaseDBModel):
    creator_asset_id: str = Field(default_factory=lambda: generate_id("crasset"))
    creator_id: str
    asset_id: str
    workspace_id: str
    rights_status: str = "active"
    rights_expiry: Optional[datetime] = None
    whitelisting_status: Optional[str] = None  # Meta whitelisting
    spark_status: Optional[str] = None  # TikTok Spark Ads
    created_at: datetime = Field(default_factory=now_utc)

# ====================
# REPORTING & TIMELINE
# ====================

class WeeklyReportSection(BaseModel):
    exec_summary: List[str] = Field(default_factory=list)
    kpi_performance: Dict[str, Any] = Field(default_factory=dict)
    what_shipped: List[str] = Field(default_factory=list)
    learnings: List[str] = Field(default_factory=list)
    decisions: List[Dict[str, Any]] = Field(default_factory=list)
    next_week_plan: List[str] = Field(default_factory=list)
    risks_dependencies: List[str] = Field(default_factory=list)

class WeeklyReport(BaseDBModel):
    report_id: str = Field(default_factory=lambda: generate_id("report"))
    workspace_id: str
    week_start: datetime
    week_end: datetime
    status: ReportStatus = ReportStatus.DRAFT
    content: WeeklyReportSection = Field(default_factory=WeeklyReportSection)
    ai_draft: Optional[str] = None
    is_ai_generated: bool = False
    share_link: Optional[str] = None
    owner_id: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class WeeklyReportCreate(BaseModel):
    week_start: datetime
    week_end: datetime

class WeeklyReportUpdate(BaseModel):
    content: Optional[WeeklyReportSection] = None
    status: Optional[ReportStatus] = None

class WeeklyPlan(BaseDBModel):
    plan_id: str = Field(default_factory=lambda: generate_id("plan"))
    workspace_id: str
    week_start: datetime
    priorities: List[str] = Field(default_factory=list)
    planned_experiments: List[str] = Field(default_factory=list)
    planned_launches: List[str] = Field(default_factory=list)
    resources_needed: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    created_by: str

class ChangelogEvent(BaseDBModel):
    event_id: str = Field(default_factory=lambda: generate_id("event"))
    workspace_id: str
    event_type: str  # tracking_edit, launch, release, experiment_decision, etc.
    description: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now_utc)
    created_by: str

# ====================
# AUDIT LOG
# ====================

class AuditLog(BaseDBModel):
    log_id: str = Field(default_factory=lambda: generate_id("audit"))
    org_id: str
    workspace_id: Optional[str] = None
    user_id: str
    action: str  # activation_definition_change, report_approval, permission_change, etc.
    resource_type: str
    resource_id: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=now_utc)

# ====================
# AUTH MODELS
# ====================

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ====================
# ALERTS
# ====================

class Alert(BaseDBModel):
    alert_id: str = Field(default_factory=lambda: generate_id("alert"))
    workspace_id: str
    alert_type: str  # activation_flatline, tracking_break, kpi_anomaly, rights_expiry
    severity: str  # low, medium, high, critical
    title: str
    description: str
    is_resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    created_at: datetime = Field(default_factory=now_utc)
