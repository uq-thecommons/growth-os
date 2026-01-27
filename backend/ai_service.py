"""
thecommons. Growth OS - AI Service
Claude Sonnet 4.5 integration for AI-powered features
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Try to import emergent integrations
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    EMERGENT_AVAILABLE = True
except ImportError:
    EMERGENT_AVAILABLE = False
    logger.warning("emergentintegrations not available, using mock AI responses")


async def generate_weekly_narrative(
    workspace_name: str,
    north_star: Dict[str, Any],
    experiments: List[Dict[str, Any]],
    insights: List[str],
    decisions: List[Dict[str, Any]],
    spend_summary: Dict[str, Any]
) -> str:
    """Generate AI draft for weekly report narrative"""
    
    if not EMERGENT_AVAILABLE:
        return _mock_weekly_narrative(workspace_name, north_star, experiments)
    
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            return _mock_weekly_narrative(workspace_name, north_star, experiments)
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"weekly_narrative_{datetime.now(timezone.utc).isoformat()}",
            system_message="""You are a growth marketing strategist writing a weekly client report. 
Write in a clear, data-driven but approachable tone. 
Focus on insights and actionable next steps.
Keep the summary concise but comprehensive."""
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        prompt = f"""Generate a weekly report narrative for {workspace_name}.

North Star Metric: {north_star.get('name', 'N/A')}
- Current: {north_star.get('current_value', 0)} {north_star.get('unit', '')}
- Target: {north_star.get('target_value', 0)} {north_star.get('unit', '')}
- 7-day trend: {north_star.get('trend_7d', 0)}%

Active Experiments: {len(experiments)}
Key Insights: {', '.join(insights[:5]) if insights else 'None this week'}
Decisions Made: {len(decisions)}

Spend: ${spend_summary.get('total_spend', 0):,.2f}

Write:
1. Executive Summary (3 bullet points)
2. What's Working (2-3 points)
3. Key Learnings
4. Next Week Focus

Keep it under 300 words. Be specific and actionable."""

        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        return response
        
    except Exception as e:
        logger.error(f"AI narrative generation failed: {e}")
        return _mock_weekly_narrative(workspace_name, north_star, experiments)


async def suggest_experiments(
    constraint: str,
    goal: str,
    funnel_stage: str,
    past_experiments: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Generate experiment suggestions based on current constraint and goal"""
    
    if not EMERGENT_AVAILABLE:
        return _mock_experiment_suggestions(constraint, funnel_stage)
    
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            return _mock_experiment_suggestions(constraint, funnel_stage)
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"exp_suggest_{datetime.now(timezone.utc).isoformat()}",
            system_message="""You are a growth experimentation expert. 
Suggest data-driven experiments with clear hypotheses.
Format each experiment with: name, hypothesis (We believe X for Y because Z), metric to track."""
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        past_exp_names = [e.get('name', '') for e in past_experiments[:5]]
        
        prompt = f"""Suggest 3 experiments given:
- Current Constraint: {constraint}
- Goal: {goal}
- Funnel Stage: {funnel_stage}
- Past experiments (avoid similar): {', '.join(past_exp_names)}

For each experiment provide:
1. Name (concise)
2. Hypothesis: "We believe [change] for [audience] because [reasoning]"
3. Primary metric to track
4. Expected impact (low/medium/high)"""

        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        # Parse response into structured format
        return _parse_experiment_suggestions(response)
        
    except Exception as e:
        logger.error(f"Experiment suggestion failed: {e}")
        return _mock_experiment_suggestions(constraint, funnel_stage)


async def generate_creative_iterations(
    winning_asset: Dict[str, Any],
    performance: Dict[str, float]
) -> List[Dict[str, str]]:
    """Suggest creative iterations based on winning assets"""
    
    if not EMERGENT_AVAILABLE:
        return _mock_creative_iterations()
    
    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            return _mock_creative_iterations()
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"creative_iter_{datetime.now(timezone.utc).isoformat()}",
            system_message="""You are a creative strategist for performance marketing.
Suggest iterations on winning creative concepts.
Focus on hooks, angles, and formats that can be tested."""
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        prompt = f"""Based on this winning creative:
- Name: {winning_asset.get('name', 'N/A')}
- Type: {winning_asset.get('file_type', 'N/A')}
- Tags: {winning_asset.get('tags', {})}
- Performance: CTR {performance.get('ctr', 0):.2%}, CPC ${performance.get('cpc', 0):.2f}

Suggest 3 creative iterations:
1. New hook angle
2. Format variation
3. Audience-specific version

For each provide: concept name, description, expected improvement area."""

        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        return _parse_creative_iterations(response)
        
    except Exception as e:
        logger.error(f"Creative iteration failed: {e}")
        return _mock_creative_iterations()


async def detect_anomalies(
    metrics: List[Dict[str, Any]],
    spend_records: List[Dict[str, Any]],
    activation_events: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Detect anomalies in performance data"""
    
    # This can be rule-based or AI-enhanced
    anomalies = []
    
    # Rule: Spend spike (>50% increase day-over-day)
    if len(spend_records) >= 2:
        today = spend_records[-1].get('actual_spend', 0)
        yesterday = spend_records[-2].get('actual_spend', 0)
        if yesterday > 0 and (today - yesterday) / yesterday > 0.5:
            anomalies.append({
                "type": "spend_spike",
                "severity": "high",
                "title": "Spend Spike Detected",
                "description": f"Spend increased {((today - yesterday) / yesterday) * 100:.0f}% day-over-day",
                "value": today
            })
    
    # Rule: Activation flatline
    recent_activations = sum(e.get('count', 0) for e in activation_events[-7:]) if activation_events else 0
    recent_spend = sum(s.get('actual_spend', 0) for s in spend_records[-7:]) if spend_records else 0
    
    if recent_activations == 0 and recent_spend > 100:
        anomalies.append({
            "type": "activation_flatline",
            "severity": "critical",
            "title": "Activation Flatline Alert",
            "description": f"0 activations detected with ${recent_spend:.2f} spend in last 7 days",
            "value": 0
        })
    
    # Rule: CTR drop
    if len(metrics) >= 7:
        recent_ctr = sum(m.get('ctr', 0) for m in metrics[-3:]) / 3
        previous_ctr = sum(m.get('ctr', 0) for m in metrics[-7:-3]) / 4
        if previous_ctr > 0 and (previous_ctr - recent_ctr) / previous_ctr > 0.3:
            anomalies.append({
                "type": "ctr_drop",
                "severity": "medium",
                "title": "CTR Decline",
                "description": f"CTR dropped {((previous_ctr - recent_ctr) / previous_ctr) * 100:.0f}% vs previous period",
                "value": recent_ctr
            })
    
    return anomalies


# ====================
# MOCK RESPONSES
# ====================

def _mock_weekly_narrative(workspace_name: str, north_star: Dict, experiments: List) -> str:
    """Generate mock weekly narrative"""
    return f"""## Weekly Report - {workspace_name}
*AI DRAFT - Requires Human Review*

### Executive Summary
• North Star metric at {north_star.get('current_value', 0)} {north_star.get('unit', '')} ({north_star.get('trend_7d', 0):+.1f}% WoW)
• {len(experiments)} experiments in progress across funnel stages
• Key focus: Improving top-of-funnel conversion rates

### What's Working
• Video creative outperforming static by 2.3x on engagement
• Retargeting audiences showing strong intent signals
• New landing page variant improving form completion

### Key Learnings
This week validated our hypothesis that shorter-form video content resonates better with our target audience. The 15-second variants consistently outperformed 30-second versions.

### Next Week Focus
1. Scale winning video creative to additional audiences
2. Launch new headline testing on landing pages
3. Implement retargeting sequence optimization

---
*Draft generated on {datetime.now(timezone.utc).strftime('%Y-%m-%d')}*"""


def _mock_experiment_suggestions(constraint: str, funnel_stage: str) -> List[Dict[str, Any]]:
    """Generate mock experiment suggestions"""
    return [
        {
            "name": "Headline Value Prop Test",
            "hypothesis": {
                "belief": "A more specific value proposition",
                "target": "new visitors",
                "because": "current headline is too generic based on heatmap data"
            },
            "metric": "Click-through rate",
            "expected_impact": "medium"
        },
        {
            "name": "Social Proof Placement",
            "hypothesis": {
                "belief": "Moving testimonials above the fold",
                "target": "consideration-stage users",
                "because": "users scroll past current placement before converting"
            },
            "metric": "Form start rate",
            "expected_impact": "high"
        },
        {
            "name": "CTA Button Color & Copy",
            "hypothesis": {
                "belief": "Action-oriented CTA copy with contrast color",
                "target": "all landing page visitors",
                "because": "current CTA blends with page design"
            },
            "metric": "Button click rate",
            "expected_impact": "low"
        }
    ]


def _mock_creative_iterations() -> List[Dict[str, str]]:
    """Generate mock creative iteration suggestions"""
    return [
        {
            "concept": "Problem-First Hook",
            "description": "Lead with the pain point instead of the solution. Open with a question that resonates with the target audience's daily frustration.",
            "improvement_area": "Scroll-stop rate"
        },
        {
            "concept": "UGC-Style Reformat",
            "description": "Recreate the winning message in a more authentic, user-generated style. Less polished, more relatable.",
            "improvement_area": "Engagement rate"
        },
        {
            "concept": "Vertical Video Adaptation",
            "description": "Optimize the creative for 9:16 format with text overlays for sound-off viewing.",
            "improvement_area": "Platform-specific performance"
        }
    ]


def _parse_experiment_suggestions(response: str) -> List[Dict[str, Any]]:
    """Parse AI response into structured experiment suggestions"""
    # Simplified parsing - in production would be more robust
    return _mock_experiment_suggestions("", "")


def _parse_creative_iterations(response: str) -> List[Dict[str, str]]:
    """Parse AI response into structured creative iterations"""
    # Simplified parsing - in production would be more robust
    return _mock_creative_iterations()
