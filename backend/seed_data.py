"""
thecommons. Growth OS - Seed Data
Demo data for immediate usability after deployment
"""
from datetime import datetime, timezone, timedelta
from models import (
    UserRole, ExperimentStatus, ReportStatus, CreatorPipelineStatus,
    ConfidenceLevel, ConnectorType, HealthStatus,
    generate_id, now_utc
)
import bcrypt
import random


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def generate_seed_data():
    """Generate complete seed data for the platform"""
    
    # IDs that will be referenced across entities
    org_id = "org_thecommons001"
    ws1_id = "ws_acme_growth"
    ws2_id = "ws_startup_xyz"
    
    admin_id = "user_admin_001"
    growth_lead_id = "user_growthld_001"
    performance_id = "user_perf_001"
    creative_id = "user_creative_001"
    analyst_id = "user_analyst_001"
    client_viewer_id = "user_client_001"
    
    now = now_utc()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # ====================
    # ORGANIZATION
    # ====================
    organization = {
        "org_id": org_id,
        "name": "thecommons. Growth Agency",
        "slug": "thecommons",
        "logo_url": "https://customer-assets.emergentagent.com/job_748ef24b-f1b0-4292-8fd8-756f578df920/artifacts/w50htqda_thecommons_Logo.png",
        "settings": {
            "default_timezone": "America/New_York",
            "weekly_report_day": "friday"
        },
        "created_at": month_ago.isoformat(),
        "updated_at": now.isoformat()
    }
    
    # ====================
    # WORKSPACES
    # ====================
    workspaces = [
        {
            "workspace_id": ws1_id,
            "org_id": org_id,
            "name": "ACME Corp",
            "slug": "acme-corp",
            "description": "B2B SaaS growth engagement",
            "logo_url": None,
            "current_constraint": "Top-of-funnel awareness limiting qualified lead volume",
            "this_week_focus": [
                "Launch new LinkedIn campaign targeting enterprise",
                "A/B test landing page headline variants",
                "Review creator partnership proposals"
            ],
            "settings": {"industry": "B2B SaaS", "target_market": "Enterprise"},
            "is_active": True,
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "workspace_id": ws2_id,
            "org_id": org_id,
            "name": "Startup XYZ",
            "slug": "startup-xyz",
            "description": "D2C e-commerce growth",
            "logo_url": None,
            "current_constraint": "Checkout abandonment rate above benchmark",
            "this_week_focus": [
                "Implement exit-intent popup test",
                "Optimize retargeting creative",
                "Analyze creator campaign ROI"
            ],
            "settings": {"industry": "E-commerce", "target_market": "D2C"},
            "is_active": True,
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat()
        }
    ]
    
    # ====================
    # USERS
    # ====================
    users = [
        {
            "user_id": admin_id,
            "email": "admin@thecommons.io",
            "name": "Alex Admin",
            "picture": "https://images.unsplash.com/photo-1670881391783-9c55ba592f93?w=150",
            "password_hash": hash_password("admin123"),
            "is_active": True,
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "user_id": growth_lead_id,
            "email": "growthld@thecommons.io",
            "name": "Grace GrowthLead",
            "picture": "https://images.unsplash.com/photo-1766022411633-e88e3650538b?w=150",
            "password_hash": hash_password("growth123"),
            "is_active": True,
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "user_id": performance_id,
            "email": "perf@thecommons.io",
            "name": "Paul Performance",
            "picture": "https://images.unsplash.com/photo-1763757321139-e7e4de128cd9?w=150",
            "password_hash": hash_password("perf123"),
            "is_active": True,
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "user_id": creative_id,
            "email": "creative@thecommons.io",
            "name": "Carla Creative",
            "picture": "https://images.unsplash.com/photo-1585402627084-e80d83061b76?w=150",
            "password_hash": hash_password("creative123"),
            "is_active": True,
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "user_id": analyst_id,
            "email": "analyst@thecommons.io",
            "name": "Andy Analyst",
            "picture": None,
            "password_hash": hash_password("analyst123"),
            "is_active": True,
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "user_id": client_viewer_id,
            "email": "client@acme.com",
            "name": "Chris Client",
            "picture": None,
            "password_hash": hash_password("client123"),
            "is_active": True,
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat()
        }
    ]
    
    # ====================
    # ROLE ASSIGNMENTS
    # ====================
    role_assignments = [
        # Admin - org level
        {
            "assignment_id": generate_id("role"),
            "user_id": admin_id,
            "org_id": org_id,
            "workspace_id": None,
            "role": UserRole.ADMIN.value,
            "created_at": month_ago.isoformat(),
            "created_by": admin_id
        },
        # Growth Lead - workspace 1
        {
            "assignment_id": generate_id("role"),
            "user_id": growth_lead_id,
            "org_id": org_id,
            "workspace_id": ws1_id,
            "role": UserRole.GROWTH_LEAD.value,
            "created_at": month_ago.isoformat(),
            "created_by": admin_id
        },
        # Growth Lead - workspace 2
        {
            "assignment_id": generate_id("role"),
            "user_id": growth_lead_id,
            "org_id": org_id,
            "workspace_id": ws2_id,
            "role": UserRole.GROWTH_LEAD.value,
            "created_at": month_ago.isoformat(),
            "created_by": admin_id
        },
        # Performance - workspace 1
        {
            "assignment_id": generate_id("role"),
            "user_id": performance_id,
            "org_id": org_id,
            "workspace_id": ws1_id,
            "role": UserRole.PERFORMANCE.value,
            "created_at": month_ago.isoformat(),
            "created_by": admin_id
        },
        # Creative - workspace 1
        {
            "assignment_id": generate_id("role"),
            "user_id": creative_id,
            "org_id": org_id,
            "workspace_id": ws1_id,
            "role": UserRole.CREATIVE.value,
            "created_at": month_ago.isoformat(),
            "created_by": admin_id
        },
        # Analyst - workspace 1
        {
            "assignment_id": generate_id("role"),
            "user_id": analyst_id,
            "org_id": org_id,
            "workspace_id": ws1_id,
            "role": UserRole.ANALYST_OPS.value,
            "created_at": month_ago.isoformat(),
            "created_by": admin_id
        },
        # Client Viewer - workspace 1 only
        {
            "assignment_id": generate_id("role"),
            "user_id": client_viewer_id,
            "org_id": org_id,
            "workspace_id": ws1_id,
            "role": UserRole.CLIENT_VIEWER.value,
            "created_at": month_ago.isoformat(),
            "created_by": admin_id
        }
    ]
    
    # ====================
    # NORTH STAR METRICS
    # ====================
    north_star_metrics = [
        {
            "metric_id": generate_id("nsm"),
            "workspace_id": ws1_id,
            "name": "Qualified Leads",
            "description": "Marketing qualified leads from all channels",
            "current_value": 847,
            "target_value": 1000,
            "unit": "leads/month",
            "trend_7d": 12.5,
            "trend_30d": 28.3,
            "trend_90d": 45.2,
            "last_updated": now.isoformat(),
            "created_at": month_ago.isoformat()
        },
        {
            "metric_id": generate_id("nsm"),
            "workspace_id": ws2_id,
            "name": "Revenue",
            "description": "Monthly recurring revenue",
            "current_value": 125000,
            "target_value": 150000,
            "unit": "USD",
            "trend_7d": 3.2,
            "trend_30d": 15.8,
            "trend_90d": 42.1,
            "last_updated": now.isoformat(),
            "created_at": month_ago.isoformat()
        }
    ]
    
    # ====================
    # FUNNELS
    # ====================
    funnel1_id = generate_id("funnel")
    funnels = [
        {
            "funnel_id": funnel1_id,
            "workspace_id": ws1_id,
            "name": "Lead Generation Funnel",
            "description": "Main B2B lead funnel",
            "steps": [
                {
                    "step_id": generate_id("step"),
                    "funnel_id": funnel1_id,
                    "name": "Site Visit",
                    "description": "User lands on website",
                    "order": 1,
                    "event_name": "page_view",
                    "conversion_rate": 100,
                    "volume": 15000,
                    "created_at": month_ago.isoformat()
                },
                {
                    "step_id": generate_id("step"),
                    "funnel_id": funnel1_id,
                    "name": "Engagement",
                    "description": "User engages with content",
                    "order": 2,
                    "event_name": "scroll_depth_50",
                    "conversion_rate": 45,
                    "volume": 6750,
                    "created_at": month_ago.isoformat()
                },
                {
                    "step_id": generate_id("step"),
                    "funnel_id": funnel1_id,
                    "name": "Lead Form Start",
                    "description": "User starts lead form",
                    "order": 3,
                    "event_name": "form_start",
                    "conversion_rate": 12,
                    "volume": 1800,
                    "created_at": month_ago.isoformat()
                },
                {
                    "step_id": generate_id("step"),
                    "funnel_id": funnel1_id,
                    "name": "Lead Submitted",
                    "description": "User submits lead form",
                    "order": 4,
                    "event_name": "form_submit",
                    "conversion_rate": 8,
                    "volume": 1200,
                    "created_at": month_ago.isoformat()
                },
                {
                    "step_id": generate_id("step"),
                    "funnel_id": funnel1_id,
                    "name": "MQL",
                    "description": "Lead qualified by marketing",
                    "order": 5,
                    "event_name": "mql_created",
                    "conversion_rate": 5.6,
                    "volume": 847,
                    "created_at": month_ago.isoformat()
                }
            ],
            "is_active": True,
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat()
        }
    ]
    
    # ====================
    # ACTIVATION DEFINITIONS
    # ====================
    activation_definitions = [
        {
            "definition_id": generate_id("actdef"),
            "workspace_id": ws1_id,
            "name": "MQL Activation",
            "description": "User becomes a marketing qualified lead",
            "rule": {
                "rule_type": "sequence",
                "events": ["form_submit", "email_verified"],
                "time_window_hours": 48
            },
            "confidence": ConfidenceLevel.HIGH.value,
            "last_verified": week_ago.isoformat(),
            "version": 2,
            "is_active": True,
            "created_at": month_ago.isoformat(),
            "updated_at": week_ago.isoformat(),
            "created_by": analyst_id
        },
        {
            "definition_id": generate_id("actdef"),
            "workspace_id": ws2_id,
            "name": "Purchase Activation",
            "description": "User completes first purchase",
            "rule": {
                "rule_type": "single_event",
                "event_name": "purchase"
            },
            "confidence": ConfidenceLevel.HIGH.value,
            "last_verified": now.isoformat(),
            "version": 1,
            "is_active": True,
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat(),
            "created_by": analyst_id
        }
    ]
    
    # ====================
    # EXPERIMENTS
    # ====================
    experiments = [
        {
            "experiment_id": generate_id("exp"),
            "workspace_id": ws1_id,
            "name": "Headline Value Prop Test",
            "description": "Testing specific vs. generic value propositions",
            "hypothesis": {
                "belief": "A specific ROI-focused headline",
                "target": "enterprise decision makers",
                "because": "they need to justify spend internally"
            },
            "funnel_step_ids": [],
            "metric_target": "Form start rate",
            "metric_threshold": 0.15,
            "status": ExperimentStatus.LIVE.value,
            "variants": [
                {
                    "variant_id": generate_id("var"),
                    "experiment_id": "",
                    "name": "Control - Generic",
                    "description": "Grow your business faster",
                    "asset_ids": [],
                    "results": {"form_starts": 234, "visitors": 2100, "rate": 0.111}
                },
                {
                    "variant_id": generate_id("var"),
                    "experiment_id": "",
                    "name": "Variant A - ROI Focused",
                    "description": "Cut CAC by 40% in 90 days",
                    "asset_ids": [],
                    "results": {"form_starts": 312, "visitors": 2050, "rate": 0.152}
                }
            ],
            "budget_allocation": 5000,
            "runtime_notes": "Running for 2 weeks, significant at 95%",
            "decision": None,
            "insights": [],
            "internal_notes": "Variant A showing promise, may scale next week",
            "is_client_visible": True,
            "start_date": week_ago.isoformat(),
            "end_date": None,
            "created_at": (week_ago - timedelta(days=3)).isoformat(),
            "updated_at": now.isoformat(),
            "created_by": growth_lead_id
        },
        {
            "experiment_id": generate_id("exp"),
            "workspace_id": ws1_id,
            "name": "Video vs Static Ads",
            "description": "Comparing video and static creative performance",
            "hypothesis": {
                "belief": "Short-form video ads",
                "target": "cold audiences",
                "because": "video stops scroll better than static"
            },
            "funnel_step_ids": [],
            "metric_target": "CTR",
            "metric_threshold": 0.025,
            "status": ExperimentStatus.DECIDED.value,
            "variants": [],
            "budget_allocation": 8000,
            "runtime_notes": "Ran for 3 weeks",
            "decision": {
                "decision_id": generate_id("dec"),
                "experiment_id": "",
                "decision_type": "scale",
                "rationale": "Video outperformed static by 2.3x on CTR and 1.8x on conversion rate. Scaling video to all cold audiences.",
                "owner_id": growth_lead_id,
                "created_at": (now - timedelta(days=2)).isoformat()
            },
            "insights": [
                {
                    "insight_id": generate_id("ins"),
                    "experiment_id": "",
                    "workspace_id": ws1_id,
                    "content": "15-second videos outperform 30-second by 40% on completion rate",
                    "evidence": "Completion rates: 15s = 68%, 30s = 48%",
                    "is_client_visible": True,
                    "created_at": (now - timedelta(days=2)).isoformat(),
                    "created_by": performance_id
                }
            ],
            "internal_notes": "Need to brief creative team on video templates",
            "is_client_visible": True,
            "start_date": (month_ago + timedelta(days=5)).isoformat(),
            "end_date": (now - timedelta(days=2)).isoformat(),
            "created_at": month_ago.isoformat(),
            "updated_at": (now - timedelta(days=2)).isoformat(),
            "created_by": growth_lead_id
        },
        {
            "experiment_id": generate_id("exp"),
            "workspace_id": ws1_id,
            "name": "Social Proof Placement",
            "description": "Testing testimonial placement above vs below fold",
            "hypothesis": {
                "belief": "Testimonials above the fold",
                "target": "consideration-stage visitors",
                "because": "social proof builds trust early in the journey"
            },
            "funnel_step_ids": [],
            "metric_target": "Scroll depth",
            "metric_threshold": 0.60,
            "status": ExperimentStatus.BACKLOG.value,
            "variants": [],
            "budget_allocation": None,
            "runtime_notes": None,
            "decision": None,
            "insights": [],
            "internal_notes": "Waiting for dev resources to implement",
            "is_client_visible": False,
            "start_date": None,
            "end_date": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "created_by": growth_lead_id
        }
    ]
    
    # ====================
    # ASSETS
    # ====================
    assets = [
        {
            "asset_id": generate_id("asset"),
            "workspace_id": ws1_id,
            "name": "Hero Video - Product Demo",
            "description": "15-second product demonstration video",
            "file_type": "video",
            "file_url": "/uploads/demo_video_001.mp4",
            "thumbnail_url": "https://images.unsplash.com/photo-1637909336971-9367a156f4c5?w=300",
            "preview_url": None,
            "tags": {
                "angle": "product_demo",
                "hook": "problem_agitation",
                "format": "video_15s",
                "icp": "enterprise_buyer",
                "funnel_stage": "awareness",
                "custom_tags": ["winner", "q4_campaign"]
            },
            "versions": [],
            "current_version": 1,
            "experiment_ids": [],
            "performance": {"ctr": 0.032, "cpc": 1.45, "cvr": 0.08, "cpa": 18.12},
            "is_client_visible": True,
            "rights_expiry": None,
            "usage_terms": None,
            "is_creator_asset": False,
            "creator_id": None,
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat(),
            "created_by": creative_id
        },
        {
            "asset_id": generate_id("asset"),
            "workspace_id": ws1_id,
            "name": "Static - ROI Calculator",
            "description": "Static image highlighting ROI calculator",
            "file_type": "image",
            "file_url": "/uploads/static_roi_001.png",
            "thumbnail_url": "https://images.unsplash.com/photo-1738918941142-00fe2cbe3c0d?w=300",
            "preview_url": None,
            "tags": {
                "angle": "value_prop",
                "hook": "curiosity",
                "format": "static_1x1",
                "icp": "finance_decision_maker",
                "funnel_stage": "consideration",
                "custom_tags": ["calculator", "interactive"]
            },
            "versions": [],
            "current_version": 2,
            "experiment_ids": [],
            "performance": {"ctr": 0.018, "cpc": 2.10, "cvr": 0.045, "cpa": 46.67},
            "is_client_visible": True,
            "rights_expiry": None,
            "usage_terms": None,
            "is_creator_asset": False,
            "creator_id": None,
            "created_at": month_ago.isoformat(),
            "updated_at": week_ago.isoformat(),
            "created_by": creative_id
        },
        {
            "asset_id": generate_id("asset"),
            "workspace_id": ws1_id,
            "name": "Creator Testimonial - Sarah",
            "description": "UGC testimonial from creator Sarah",
            "file_type": "video",
            "file_url": "/uploads/ugc_sarah_001.mp4",
            "thumbnail_url": "https://images.unsplash.com/photo-1722199617938-5d299b43371c?w=300",
            "preview_url": None,
            "tags": {
                "angle": "testimonial",
                "hook": "social_proof",
                "format": "video_30s",
                "icp": "small_business",
                "funnel_stage": "decision",
                "custom_tags": ["ugc", "creator_content"]
            },
            "versions": [],
            "current_version": 1,
            "experiment_ids": [],
            "performance": {"ctr": 0.028, "cpc": 1.65, "cvr": 0.062, "cpa": 26.61},
            "is_client_visible": True,
            "rights_expiry": (now + timedelta(days=60)).isoformat(),
            "usage_terms": "90 days paid media usage",
            "is_creator_asset": True,
            "creator_id": None,
            "created_at": week_ago.isoformat(),
            "updated_at": week_ago.isoformat(),
            "created_by": creative_id
        }
    ]
    
    # ====================
    # CHANNELS
    # ====================
    channels = [
        {
            "channel_id": generate_id("ch"),
            "workspace_id": ws1_id,
            "name": "Google Analytics 4",
            "connector_type": ConnectorType.GA4.value,
            "is_connected": True,
            "last_synced": (now - timedelta(hours=2)).isoformat(),
            "sync_status": "synced",
            "credentials": {},
            "settings": {"property_id": "GA4-XXXXX"},
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "channel_id": generate_id("ch"),
            "workspace_id": ws1_id,
            "name": "Meta Ads",
            "connector_type": ConnectorType.META_ADS.value,
            "is_connected": True,
            "last_synced": (now - timedelta(hours=1)).isoformat(),
            "sync_status": "synced",
            "credentials": {},
            "settings": {"ad_account_id": "act_XXXXX"},
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "channel_id": generate_id("ch"),
            "workspace_id": ws1_id,
            "name": "Google Ads",
            "connector_type": ConnectorType.GOOGLE_ADS.value,
            "is_connected": True,
            "last_synced": (now - timedelta(hours=3)).isoformat(),
            "sync_status": "synced",
            "credentials": {},
            "settings": {"customer_id": "XXX-XXX-XXXX"},
            "created_at": month_ago.isoformat(),
            "updated_at": now.isoformat()
        }
    ]
    
    # ====================
    # CREATORS
    # ====================
    creators = [
        {
            "creator_id": generate_id("creator"),
            "workspace_id": ws1_id,
            "name": "Sarah Johnson",
            "handle": "@sarahj_business",
            "platform": "instagram",
            "follower_count": 45000,
            "engagement_rate": 4.2,
            "notes": "Great fit for B2B content, authentic voice",
            "fit_score": 9,
            "contact_email": "sarah@creators.com",
            "pipeline_status": CreatorPipelineStatus.LIVE.value,
            "created_at": month_ago.isoformat(),
            "updated_at": week_ago.isoformat()
        },
        {
            "creator_id": generate_id("creator"),
            "workspace_id": ws1_id,
            "name": "Mike Chen",
            "handle": "@mikechentech",
            "platform": "tiktok",
            "follower_count": 120000,
            "engagement_rate": 6.8,
            "notes": "Tech reviewer, could be good for product demos",
            "fit_score": 7,
            "contact_email": "mike@creators.com",
            "pipeline_status": CreatorPipelineStatus.CONTACTED.value,
            "created_at": week_ago.isoformat(),
            "updated_at": now.isoformat()
        },
        {
            "creator_id": generate_id("creator"),
            "workspace_id": ws1_id,
            "name": "Emma Davis",
            "handle": "@emmadavis_founder",
            "platform": "linkedin",
            "follower_count": 28000,
            "engagement_rate": 3.5,
            "notes": "Startup founder, great for thought leadership",
            "fit_score": 8,
            "contact_email": "emma@founders.com",
            "pipeline_status": CreatorPipelineStatus.DISCOVERY.value,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
    ]
    
    # ====================
    # WEEKLY REPORTS
    # ====================
    weekly_reports = [
        {
            "report_id": generate_id("report"),
            "workspace_id": ws1_id,
            "week_start": (now - timedelta(days=14)).isoformat(),
            "week_end": (now - timedelta(days=7)).isoformat(),
            "status": ReportStatus.SENT.value,
            "content": {
                "exec_summary": [
                    "North Star (MQLs) up 12% WoW, tracking ahead of monthly target",
                    "Video creative experiment concluded with 2.3x improvement in CTR",
                    "New creator partnership launched with strong initial engagement"
                ],
                "kpi_performance": {
                    "mqls": {"value": 756, "change": 12, "target": 1000},
                    "cac": {"value": 42.50, "change": -8, "target": 50},
                    "conversion_rate": {"value": 5.2, "change": 0.3, "target": 5.5}
                },
                "what_shipped": [
                    "Launched video creative across all Meta campaigns",
                    "Deployed new landing page variant for headline test",
                    "Published 3 new creator testimonial assets"
                ],
                "learnings": [
                    "15-second videos outperform 30-second by 40% on completion rate",
                    "Enterprise audience responds better to ROI-specific messaging",
                    "Morning posting times showing 20% higher engagement"
                ],
                "decisions": [
                    {"experiment": "Video vs Static", "decision": "Scale", "rationale": "Clear winner at 95% significance"}
                ],
                "next_week_plan": [
                    "Scale winning video creative to Google Ads",
                    "Launch headline test variant B",
                    "Onboard 2 new creators for Q1"
                ],
                "risks_dependencies": [
                    "Landing page dev resources constrained - may delay social proof test"
                ]
            },
            "ai_draft": None,
            "is_ai_generated": False,
            "share_link": generate_id("share"),
            "owner_id": growth_lead_id,
            "approved_by": growth_lead_id,
            "approved_at": (now - timedelta(days=7)).isoformat(),
            "sent_at": (now - timedelta(days=7)).isoformat(),
            "created_at": (now - timedelta(days=8)).isoformat(),
            "updated_at": (now - timedelta(days=7)).isoformat()
        },
        {
            "report_id": generate_id("report"),
            "workspace_id": ws1_id,
            "week_start": (now - timedelta(days=7)).isoformat(),
            "week_end": now.isoformat(),
            "status": ReportStatus.DRAFT.value,
            "content": {
                "exec_summary": [
                    "North Star (MQLs) at 847, 15% ahead of pace",
                    "Headline test showing promising early results (+37% form starts)",
                    "Two new creator partnerships in negotiation"
                ],
                "kpi_performance": {
                    "mqls": {"value": 847, "change": 12.5, "target": 1000},
                    "cac": {"value": 39.20, "change": -7.8, "target": 50},
                    "conversion_rate": {"value": 5.6, "change": 0.4, "target": 5.5}
                },
                "what_shipped": [],
                "learnings": [],
                "decisions": [],
                "next_week_plan": [],
                "risks_dependencies": []
            },
            "ai_draft": "## Weekly Report Draft\n*AI DRAFT - Requires Human Review*\n\nThis week showed continued momentum...",
            "is_ai_generated": True,
            "share_link": None,
            "owner_id": growth_lead_id,
            "approved_by": None,
            "approved_at": None,
            "sent_at": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
    ]
    
    # ====================
    # ALERTS
    # ====================
    alerts = [
        {
            "alert_id": generate_id("alert"),
            "workspace_id": ws1_id,
            "alert_type": "rights_expiry",
            "severity": "medium",
            "title": "Creator Asset Rights Expiring",
            "description": "Sarah's testimonial video rights expire in 60 days",
            "is_resolved": False,
            "resolved_at": None,
            "resolved_by": None,
            "created_at": now.isoformat()
        }
    ]
    
    return {
        "organizations": [organization],
        "workspaces": workspaces,
        "users": users,
        "role_assignments": role_assignments,
        "north_star_metrics": north_star_metrics,
        "funnels": funnels,
        "activation_definitions": activation_definitions,
        "experiments": experiments,
        "assets": assets,
        "channels": channels,
        "creators": creators,
        "weekly_reports": weekly_reports,
        "alerts": alerts
    }


if __name__ == "__main__":
    import json
    data = generate_seed_data()
    print(json.dumps(data, indent=2, default=str))
