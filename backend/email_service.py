"""
thecommons. Growth OS - Email Notification Service
Resend email integration for report notifications
"""
import os
import asyncio
import logging
import resend
from dotenv import load_dotenv
from typing import Dict, Any, List, Optional

load_dotenv()
logger = logging.getLogger(__name__)

# Initialize Resend
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
    logger.info("Resend email service initialized")
else:
    logger.warning("RESEND_API_KEY not set - email notifications disabled")


async def send_report_ready_notification(
    recipient_email: str,
    recipient_name: str,
    workspace_name: str,
    report_id: str,
    week_start: str,
    share_link: str = None
) -> Dict[str, Any]:
    """Send email notification when report is ready for review"""
    
    if not RESEND_API_KEY:
        logger.warning(f"Skipping email to {recipient_email} - RESEND_API_KEY not configured")
        return {"status": "skipped", "reason": "api_key_missing"}
    
    subject = f"Weekly Report Ready: {workspace_name} - Week of {week_start}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #000000; background-color: #ffffff; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #000000; color: #ffffff; padding: 30px 20px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
            .content {{ padding: 30px 20px; background-color: #ffffff; }}
            .content p {{ margin: 0 0 15px 0; color: #000000; }}
            .button {{ display: inline-block; padding: 14px 28px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: 600; }}
            .button:hover {{ background-color: #333333; }}
            .footer {{ padding: 20px; text-align: center; color: #666666; font-size: 12px; }}
            .highlight {{ background-color: #f0f0f0; padding: 15px; border-left: 4px solid #000000; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Weekly Report Ready</h1>
            </div>
            <div class="content">
                <p>Hi {recipient_name},</p>
                
                <p>The weekly report for <strong>{workspace_name}</strong> is ready for your review.</p>
                
                <div class="highlight">
                    <strong>Report Period:</strong> Week of {week_start}<br>
                    <strong>Status:</strong> Ready for Review
                </div>
                
                <p>Please review the report and approve it when ready.</p>
                
                <a href="{share_link or '#'}" class="button">View Report</a>
                
                <p style="margin-top: 30px; color: #666666; font-size: 14px;">
                    This report contains performance insights, experiments progress, and key decisions from the week.
                </p>
            </div>
            <div class="footer">
                <p>thecommons. Growth OS - Weekly Report Notification</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [recipient_email],
            "subject": subject,
            "html": html_content
        }
        
        # Run sync SDK in thread to keep FastAPI non-blocking
        email_response = await asyncio.to_thread(resend.Emails.send, params)
        
        logger.info(f"Report notification sent to {recipient_email}, email_id: {email_response.get('id')}")
        
        return {
            "status": "success",
            "email_id": email_response.get("id"),
            "recipient": recipient_email
        }
        
    except Exception as e:
        logger.error(f"Failed to send report notification to {recipient_email}: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "recipient": recipient_email
        }


async def send_report_approved_notification(
    recipient_email: str,
    recipient_name: str,
    workspace_name: str,
    report_id: str,
    week_start: str,
    approved_by_name: str,
    share_link: str = None
) -> Dict[str, Any]:
    """Send email notification when report is approved"""
    
    if not RESEND_API_KEY:
        logger.warning(f"Skipping email to {recipient_email} - RESEND_API_KEY not configured")
        return {"status": "skipped", "reason": "api_key_missing"}
    
    subject = f"Report Approved: {workspace_name} - Week of {week_start}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #000000; background-color: #ffffff; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #000000; color: #ffffff; padding: 30px 20px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
            .content {{ padding: 30px 20px; background-color: #ffffff; }}
            .content p {{ margin: 0 0 15px 0; color: #000000; }}
            .button {{ display: inline-block; padding: 14px 28px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: 600; }}
            .button:hover {{ background-color: #333333; }}
            .footer {{ padding: 20px; text-align: center; color: #666666; font-size: 12px; }}
            .success-badge {{ background-color: #10b981; color: #ffffff; padding: 6px 12px; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Report Approved</h1>
            </div>
            <div class="content">
                <p>Hi {recipient_name},</p>
                
                <p><span class="success-badge">APPROVED</span></p>
                
                <p>The weekly report for <strong>{workspace_name}</strong> (Week of {week_start}) has been approved by {approved_by_name} and is now ready to share with clients.</p>
                
                <a href="{share_link or '#'}" class="button">View Approved Report</a>
                
                <p style="margin-top: 30px; color: #666666; font-size: 14px;">
                    You can now share this report with clients using the share link.
                </p>
            </div>
            <div class="footer">
                <p>thecommons. Growth OS - Weekly Report Notification</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [recipient_email],
            "subject": subject,
            "html": html_content
        }
        
        email_response = await asyncio.to_thread(resend.Emails.send, params)
        
        logger.info(f"Report approval notification sent to {recipient_email}, email_id: {email_response.get('id')}")
        
        return {
            "status": "success",
            "email_id": email_response.get("id"),
            "recipient": recipient_email
        }
        
    except Exception as e:
        logger.error(f"Failed to send approval notification to {recipient_email}: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "recipient": recipient_email
        }


async def send_experiment_decision_notification(
    recipient_email: str,
    recipient_name: str,
    workspace_name: str,
    experiment_name: str,
    decision_type: str,
    rationale: str
) -> Dict[str, Any]:
    """Send email notification when experiment decision is made"""
    
    if not RESEND_API_KEY:
        logger.warning(f"Skipping email to {recipient_email} - RESEND_API_KEY not configured")
        return {"status": "skipped", "reason": "api_key_missing"}
    
    decision_labels = {
        "kill": {"emoji": "❌", "label": "Killed", "color": "#ef4444"},
        "iterate": {"emoji": "🔄", "label": "Iterate", "color": "#f59e0b"},
        "scale": {"emoji": "🚀", "label": "Scale", "color": "#10b981"}
    }
    
    decision_info = decision_labels.get(decision_type.lower(), {"emoji": "📊", "label": decision_type, "color": "#6b7280"})
    
    subject = f"Experiment Decision: {experiment_name} - {decision_info['label']}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #000000; background-color: #ffffff; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #000000; color: #ffffff; padding: 30px 20px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
            .content {{ padding: 30px 20px; background-color: #ffffff; }}
            .content p {{ margin: 0 0 15px 0; color: #000000; }}
            .decision-badge {{ background-color: {decision_info['color']}; color: #ffffff; padding: 8px 16px; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 16px; }}
            .rationale {{ background-color: #f9fafb; padding: 15px; border-left: 4px solid {decision_info['color']}; margin: 20px 0; }}
            .footer {{ padding: 20px; text-align: center; color: #666666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{decision_info['emoji']} Experiment Decision Made</h1>
            </div>
            <div class="content">
                <p>Hi {recipient_name},</p>
                
                <p>A decision has been made for the experiment <strong>{experiment_name}</strong> in <strong>{workspace_name}</strong>.</p>
                
                <p><span class="decision-badge">{decision_info['emoji']} {decision_info['label']}</span></p>
                
                <div class="rationale">
                    <strong>Rationale:</strong><br>
                    {rationale}
                </div>
                
                <p style="margin-top: 30px; color: #666666; font-size: 14px;">
                    View the full experiment details in your Growth OS dashboard.
                </p>
            </div>
            <div class="footer">
                <p>thecommons. Growth OS - Experiment Notification</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [recipient_email],
            "subject": subject,
            "html": html_content
        }
        
        email_response = await asyncio.to_thread(resend.Emails.send, params)
        
        logger.info(f"Experiment decision notification sent to {recipient_email}, email_id: {email_response.get('id')}")
        
        return {
            "status": "success",
            "email_id": email_response.get("id"),
            "recipient": recipient_email
        }
        
    except Exception as e:
        logger.error(f"Failed to send experiment decision notification to {recipient_email}: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "recipient": recipient_email
        }
