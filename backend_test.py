#!/usr/bin/env python3
"""
Backend API Testing for thecommons. Growth OS
Tests all major API endpoints and functionality
"""
import requests
import sys
import json
from datetime import datetime, timedelta

class GrowthOSAPITester:
    def __init__(self, base_url="https://growth-os-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_workspace_id = None
        self.test_experiment_id = None
        self.test_asset_id = None
        self.test_creator_id = None
        self.test_report_id = None

    def log_result(self, test_name, success, details="", error_msg=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {error_msg}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "error": error_msg
        })

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make API request with authentication"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}
            
            return success, response_data, response.status_code
            
        except Exception as e:
            return False, {"error": str(e)}, str(e)

    def test_health_check(self):
        """Test health endpoint"""
        success, data, status = self.make_request('GET', 'health')
        self.log_result(
            "Health Check", 
            success and data.get('status') == 'healthy',
            f"Status: {status}",
            f"Expected healthy status, got {data.get('status', 'unknown')}"
        )

    def test_seed_data(self):
        """Test seeding database"""
        success, data, status = self.make_request('POST', 'seed')
        # Seeding can return 200 (success) or already seeded message
        is_success = success or (status == 200 and data.get('skipped'))
        self.log_result(
            "Seed Database", 
            is_success,
            f"Status: {status}, Data: {data.get('message', '')}",
            f"Seed failed with status {status}"
        )

    def test_login(self):
        """Test login with admin credentials"""
        login_data = {
            "email": "admin@thecommons.io",
            "password": "admin123"
        }
        
        success, data, status = self.make_request('POST', 'auth/login', login_data)
        
        if success and data.get('access_token'):
            self.session_token = data['access_token']
            self.user_data = data.get('user', {})
            self.log_result(
                "Admin Login", 
                True,
                f"User: {self.user_data.get('email', 'unknown')}",
                ""
            )
        else:
            self.log_result(
                "Admin Login", 
                False,
                f"Status: {status}",
                f"Login failed: {data.get('detail', 'Unknown error')}"
            )

    def test_get_me(self):
        """Test getting current user info"""
        success, data, status = self.make_request('GET', 'auth/me')
        self.log_result(
            "Get Current User", 
            success and data.get('user_id'),
            f"User ID: {data.get('user_id', 'unknown')}",
            f"Failed to get user info: {status}"
        )

    def test_list_organizations(self):
        """Test listing organizations"""
        success, data, status = self.make_request('GET', 'organizations')
        self.log_result(
            "List Organizations", 
            success and isinstance(data, list),
            f"Found {len(data) if isinstance(data, list) else 0} organizations",
            f"Failed to list organizations: {status}"
        )

    def test_list_workspaces(self):
        """Test listing workspaces"""
        success, data, status = self.make_request('GET', 'workspaces')
        
        if success and isinstance(data, list) and len(data) > 0:
            self.test_workspace_id = data[0]['workspace_id']
            self.log_result(
                "List Workspaces", 
                True,
                f"Found {len(data)} workspaces, using {self.test_workspace_id}",
                ""
            )
        else:
            self.log_result(
                "List Workspaces", 
                False,
                f"Status: {status}",
                "No workspaces found or API failed"
            )

    def test_get_workspace_details(self):
        """Test getting workspace details"""
        if not self.test_workspace_id:
            self.log_result("Get Workspace Details", False, "", "No workspace ID available")
            return
            
        success, data, status = self.make_request('GET', f'workspaces/{self.test_workspace_id}')
        self.log_result(
            "Get Workspace Details", 
            success and data.get('workspace_id') == self.test_workspace_id,
            f"Workspace: {data.get('name', 'unknown')}",
            f"Failed to get workspace details: {status}"
        )

    def test_command_center(self):
        """Test command center endpoint"""
        success, data, status = self.make_request('GET', 'command-center')
        expected_keys = ['at_risk_workspaces', 'experiments_needing_decisions', 'report_status', 'tracking_health']
        has_keys = all(key in data for key in expected_keys) if isinstance(data, dict) else False
        
        self.log_result(
            "Command Center", 
            success and has_keys,
            f"Keys present: {list(data.keys()) if isinstance(data, dict) else 'none'}",
            f"Missing expected keys or API failed: {status}"
        )

    def test_experiments_crud(self):
        """Test experiments CRUD operations"""
        if not self.test_workspace_id:
            self.log_result("Experiments CRUD", False, "", "No workspace ID available")
            return

        # List experiments
        success, data, status = self.make_request('GET', f'workspaces/{self.test_workspace_id}/experiments')
        self.log_result(
            "List Experiments", 
            success,
            f"Found {len(data) if isinstance(data, list) else 0} experiments",
            f"Failed to list experiments: {status}"
        )

        # Create experiment
        exp_data = {
            "name": "Test Experiment API",
            "description": "Testing experiment creation via API",
            "hypothesis": {
                "belief": "better headlines",
                "target": "enterprise users", 
                "because": "they need clear value props"
            },
            "metric_target": "conversion_rate"
        }
        
        success, data, status = self.make_request('POST', f'workspaces/{self.test_workspace_id}/experiments', exp_data, 200)
        if success and data.get('experiment_id'):
            self.test_experiment_id = data['experiment_id']
            self.log_result(
                "Create Experiment", 
                True,
                f"Created experiment: {data.get('name')}",
                ""
            )
        else:
            self.log_result(
                "Create Experiment", 
                False,
                f"Status: {status}, Response: {data}",
                f"Failed to create experiment: {data.get('detail', data.get('error', 'Unknown error'))}"
            )

        # Update experiment status
        if self.test_experiment_id:
            update_data = {"status": "ready"}
            success, data, status = self.make_request('PUT', f'workspaces/{self.test_workspace_id}/experiments/{self.test_experiment_id}', update_data)
            self.log_result(
                "Update Experiment", 
                success and data.get('status') == 'ready',
                f"Status updated to: {data.get('status', 'unknown')}",
                f"Failed to update experiment: {status}"
            )

    def test_assets_crud(self):
        """Test assets CRUD operations"""
        if not self.test_workspace_id:
            self.log_result("Assets CRUD", False, "", "No workspace ID available")
            return

        # List assets
        success, data, status = self.make_request('GET', f'workspaces/{self.test_workspace_id}/assets')
        self.log_result(
            "List Assets", 
            success,
            f"Found {len(data) if isinstance(data, list) else 0} assets",
            f"Failed to list assets: {status}"
        )

        # Create asset
        asset_data = {
            "name": "Test Asset API",
            "description": "Testing asset creation via API",
            "file_type": "image",
            "file_url": "/test/api-asset.png",
            "is_client_visible": False
        }
        
        success, data, status = self.make_request('POST', f'workspaces/{self.test_workspace_id}/assets', asset_data, 200)
        if success and data.get('asset_id'):
            self.test_asset_id = data['asset_id']
            self.log_result(
                "Create Asset", 
                True,
                f"Created asset: {data.get('name')}",
                ""
            )
        else:
            self.log_result(
                "Create Asset", 
                False,
                f"Status: {status}",
                f"Failed to create asset: {data.get('detail', 'Unknown error')}"
            )

    def test_creators_crud(self):
        """Test creators CRUD operations"""
        if not self.test_workspace_id:
            self.log_result("Creators CRUD", False, "", "No workspace ID available")
            return

        # List creators
        success, data, status = self.make_request('GET', f'workspaces/{self.test_workspace_id}/creators')
        self.log_result(
            "List Creators", 
            success,
            f"Found {len(data) if isinstance(data, list) else 0} creators",
            f"Failed to list creators: {status}"
        )

        # Create creator
        creator_data = {
            "name": "Test Creator API",
            "handle": "@testcreator",
            "platform": "instagram",
            "follower_count": 50000,
            "engagement_rate": 3.5,
            "fit_score": 8
        }
        
        success, data, status = self.make_request('POST', f'workspaces/{self.test_workspace_id}/creators', creator_data, 200)
        if success and data.get('creator_id'):
            self.test_creator_id = data['creator_id']
            self.log_result(
                "Create Creator", 
                True,
                f"Created creator: {data.get('name')}",
                ""
            )
        else:
            self.log_result(
                "Create Creator", 
                False,
                f"Status: {status}",
                f"Failed to create creator: {data.get('detail', 'Unknown error')}"
            )

    def test_reports_crud(self):
        """Test weekly reports CRUD operations"""
        if not self.test_workspace_id:
            self.log_result("Reports CRUD", False, "", "No workspace ID available")
            return

        # List reports
        success, data, status = self.make_request('GET', f'workspaces/{self.test_workspace_id}/reports')
        self.log_result(
            "List Reports", 
            success,
            f"Found {len(data) if isinstance(data, list) else 0} reports",
            f"Failed to list reports: {status}"
        )

        # Create report
        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        report_data = {
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat()
        }
        
        success, data, status = self.make_request('POST', f'workspaces/{self.test_workspace_id}/reports', report_data, 200)
        if success and data.get('report_id'):
            self.test_report_id = data['report_id']
            self.log_result(
                "Create Report", 
                True,
                f"Created report for week {week_start.strftime('%Y-%m-%d')}",
                ""
            )
        else:
            self.log_result(
                "Create Report", 
                False,
                f"Status: {status}",
                f"Failed to create report: {data.get('detail', 'Unknown error')}"
            )

    def test_channels_and_performance(self):
        """Test channels and performance endpoints"""
        if not self.test_workspace_id:
            self.log_result("Channels & Performance", False, "", "No workspace ID available")
            return

        # List channels
        success, data, status = self.make_request('GET', f'workspaces/{self.test_workspace_id}/channels')
        self.log_result(
            "List Channels", 
            success,
            f"Found {len(data) if isinstance(data, list) else 0} channels",
            f"Failed to list channels: {status}"
        )

        # Get performance data
        success, data, status = self.make_request('GET', f'workspaces/{self.test_workspace_id}/performance')
        self.log_result(
            "Get Performance Data", 
            success,
            f"Performance data keys: {list(data.keys()) if isinstance(data, dict) else 'none'}",
            f"Failed to get performance data: {status}"
        )

    def test_ai_endpoints(self):
        """Test AI-powered endpoints"""
        if not self.test_workspace_id:
            self.log_result("AI Endpoints", False, "", "No workspace ID available")
            return

        # Test experiment suggestions
        success, data, status = self.make_request('POST', f'workspaces/{self.test_workspace_id}/ai/suggest-experiments')
        self.log_result(
            "AI Experiment Suggestions", 
            success and 'suggestions' in data,
            f"Got {len(data.get('suggestions', [])) if isinstance(data.get('suggestions'), list) else 0} suggestions",
            f"Failed to get AI suggestions: {status}"
        )

        # Test anomaly detection
        success, data, status = self.make_request('GET', f'workspaces/{self.test_workspace_id}/ai/anomalies')
        expected_keys = ['detected_anomalies', 'active_alerts']
        has_keys = all(key in data for key in expected_keys) if isinstance(data, dict) else False
        
        self.log_result(
            "AI Anomaly Detection", 
            success and has_keys,
            f"Anomalies: {len(data.get('detected_anomalies', [])) if isinstance(data.get('detected_anomalies'), list) else 0}",
            f"Failed to get anomalies: {status}"
        )

    def test_client_management_apis(self):
        """Test client management APIs - workspace creation and updates"""
        if not self.session_token:
            self.log_result("Client Management APIs", False, "", "No authentication token")
            return

        # Test creating a new client workspace
        import time
        timestamp = int(time.time())
        workspace_data = {
            "name": f"Acme Corporation {timestamp}",
            "industry": "Technology",
            "website_url": "https://acme.com",
            "contact_name": "John Smith",
            "contact_email": "john@acme.com",
            "contact_phone": "+1-555-0123",
            "initial_goals": "Increase user acquisition by 50% and improve conversion rates",
            "growth_lead_id": None  # Will be set if we have a growth lead user
        }
        
        success, data, status = self.make_request(
            'POST', 
            'workspaces?org_id=org_thecommons001', 
            workspace_data, 
            200
        )
        
        if success and data.get('workspace_id'):
            self.test_workspace_id = data['workspace_id']
            self.log_result(
                "Create Client Workspace", 
                True,
                f"Created workspace: {data.get('name')} (ID: {self.test_workspace_id})",
                ""
            )
            
            # Test updating client details
            update_data = {
                "description": "Updated description for Acme Corp",
                "contact_phone": "+1-555-9999",
                "current_constraint": "Limited budget for Q1",
                "this_week_focus": ["Landing page optimization", "Email campaign launch"]
            }
            
            success, data, status = self.make_request(
                'PUT', 
                f'workspaces/{self.test_workspace_id}', 
                update_data
            )
            
            self.log_result(
                "Update Client Details", 
                success and data.get('description') == update_data['description'],
                f"Updated workspace details successfully",
                f"Failed to update workspace: {status}"
            )
            
            # Test getting updated workspace details
            success, data, status = self.make_request('GET', f'workspaces/{self.test_workspace_id}')
            expected_fields = ['name', 'industry', 'website_url', 'contact_name', 'contact_email']
            has_fields = all(field in data for field in expected_fields) if isinstance(data, dict) else False
            
            self.log_result(
                "Get Updated Workspace Details", 
                success and has_fields,
                f"Retrieved workspace with all client fields",
                f"Missing client fields or API failed: {status}"
            )
            
        else:
            self.log_result(
                "Create Client Workspace", 
                False,
                f"Status: {status}, Response: {data}",
                f"Failed to create workspace: {data.get('detail', 'Unknown error')}"
            )

    def test_integration_config_apis(self):
        """Test integration configuration APIs"""
        if not self.test_workspace_id:
            self.log_result("Integration Config APIs", False, "", "No workspace ID available")
            return

        # Test listing integrations (should be empty initially)
        success, data, status = self.make_request('GET', f'workspaces/{self.test_workspace_id}/integrations')
        self.log_result(
            "List Integration Configs", 
            success and isinstance(data, list),
            f"Found {len(data) if isinstance(data, list) else 0} integration configs",
            f"Failed to list integrations: {status}"
        )

        # Test creating GA4 integration config
        ga4_config = {
            "platform": "ga4",
            "credentials": {
                "GA4_PROPERTY_ID": "123456789",
                "GA4_SERVICE_ACCOUNT_JSON": '{"type": "service_account", "project_id": "test-project"}'
            }
        }
        
        success, data, status = self.make_request(
            'POST', 
            f'workspaces/{self.test_workspace_id}/integrations', 
            ga4_config
        )
        
        ga4_config_id = None
        if success and data.get('config_id'):
            ga4_config_id = data['config_id']
            self.log_result(
                "Create GA4 Integration", 
                True,
                f"Created GA4 config (ID: {ga4_config_id}, Status: {data.get('status')})",
                ""
            )
        else:
            self.log_result(
                "Create GA4 Integration", 
                False,
                f"Status: {status}",
                f"Failed to create GA4 integration: {data.get('detail', 'Unknown error')}"
            )

        # Test creating Meta Ads integration config
        meta_config = {
            "platform": "meta_ads",
            "credentials": {
                "META_APP_ID": "123456789",
                "META_APP_SECRET": "test_secret",
                "META_ACCESS_TOKEN": "test_token",
                "META_AD_ACCOUNT_ID": "act_123456789"
            }
        }
        
        success, data, status = self.make_request(
            'POST', 
            f'workspaces/{self.test_workspace_id}/integrations', 
            meta_config
        )
        
        meta_config_id = None
        if success and data.get('config_id'):
            meta_config_id = data['config_id']
            self.log_result(
                "Create Meta Ads Integration", 
                True,
                f"Created Meta Ads config (ID: {meta_config_id}, Status: {data.get('status')})",
                ""
            )
        else:
            self.log_result(
                "Create Meta Ads Integration", 
                False,
                f"Status: {status}",
                f"Failed to create Meta Ads integration: {data.get('detail', 'Unknown error')}"
            )

        # Test creating Google Ads integration config
        google_ads_config = {
            "platform": "google_ads",
            "credentials": {
                "GOOGLE_ADS_DEVELOPER_TOKEN": "test_dev_token",
                "GOOGLE_ADS_CLIENT_ID": "test_client_id",
                "GOOGLE_ADS_CLIENT_SECRET": "test_client_secret",
                "GOOGLE_ADS_REFRESH_TOKEN": "test_refresh_token",
                "GOOGLE_ADS_CUSTOMER_ID": "123-456-7890"
            }
        }
        
        success, data, status = self.make_request(
            'POST', 
            f'workspaces/{self.test_workspace_id}/integrations', 
            google_ads_config
        )
        
        google_ads_config_id = None
        if success and data.get('config_id'):
            google_ads_config_id = data['config_id']
            self.log_result(
                "Create Google Ads Integration", 
                True,
                f"Created Google Ads config (ID: {google_ads_config_id}, Status: {data.get('status')})",
                ""
            )
        else:
            self.log_result(
                "Create Google Ads Integration", 
                False,
                f"Status: {status}",
                f"Failed to create Google Ads integration: {data.get('detail', 'Unknown error')}"
            )

        # Test connection testing for each integration
        for config_id, platform in [(ga4_config_id, "GA4"), (meta_config_id, "Meta Ads"), (google_ads_config_id, "Google Ads")]:
            if config_id:
                success, data, status = self.make_request(
                    'POST', 
                    f'workspaces/{self.test_workspace_id}/integrations/{config_id}/test'
                )
                
                self.log_result(
                    f"Test {platform} Connection", 
                    success and 'status' in data,
                    f"Connection test result: {data.get('status', 'unknown')}",
                    f"Failed to test {platform} connection: {status}"
                )

        # Test listing integrations again (should now have configs)
        success, data, status = self.make_request('GET', f'workspaces/{self.test_workspace_id}/integrations')
        expected_count = sum(1 for config_id in [ga4_config_id, meta_config_id, google_ads_config_id] if config_id)
        
        self.log_result(
            "List Integration Configs (After Creation)", 
            success and isinstance(data, list) and len(data) == expected_count,
            f"Found {len(data) if isinstance(data, list) else 0} integration configs (expected {expected_count})",
            f"Incorrect number of integrations or API failed: {status}"
        )

        # Test deleting an integration
        if ga4_config_id:
            success, data, status = self.make_request(
                'DELETE', 
                f'workspaces/{self.test_workspace_id}/integrations/{ga4_config_id}'
            )
            
            self.log_result(
                "Delete Integration Config", 
                success,
                f"Successfully deleted GA4 integration",
                f"Failed to delete integration: {status}"
            )

    def test_rbac_permissions(self):
        """Test RBAC permissions for client management and integrations"""
        # Test with Growth Lead credentials
        growth_lead_data = {
            "email": "growthld@thecommons.io",
            "password": "growth123"
        }
        
        success, data, status = self.make_request('POST', 'auth/login', growth_lead_data)
        
        if success and data.get('access_token'):
            growth_lead_token = data['access_token']
            original_token = self.session_token
            self.session_token = growth_lead_token
            
            # Test Growth Lead can create clients
            workspace_data = {
                "name": "Growth Lead Test Client",
                "industry": "E-commerce",
                "website_url": "https://testclient.com"
            }
            
            success, data, status = self.make_request(
                'POST', 
                'workspaces?org_id=org_thecommons001', 
                workspace_data
            )
            
            self.log_result(
                "Growth Lead Can Create Clients", 
                success,
                f"Growth Lead successfully created workspace",
                f"Growth Lead failed to create workspace: {status}"
            )
            
            # Test Growth Lead can manage integrations
            if success and data.get('workspace_id'):
                test_ws_id = data['workspace_id']
                integration_config = {
                    "platform": "ga4",
                    "credentials": {"GA4_PROPERTY_ID": "test123"}
                }
                
                success, data, status = self.make_request(
                    'POST', 
                    f'workspaces/{test_ws_id}/integrations', 
                    integration_config
                )
                
                self.log_result(
                    "Growth Lead Can Manage Integrations", 
                    success,
                    f"Growth Lead successfully created integration",
                    f"Growth Lead failed to create integration: {status}"
                )
            
            # Restore original token
            self.session_token = original_token
            
        else:
            self.log_result(
                "Growth Lead Login", 
                False,
                f"Status: {status}",
                f"Failed to login as Growth Lead: {data.get('detail', 'Unknown error')}"
            )

    def test_auto_connection_testing(self):
        """Test automatic connection testing when credentials are provided"""
        if not self.test_workspace_id:
            self.log_result("Auto Connection Testing", False, "", "No workspace ID available")
            return

        # Create integration with mock credentials and verify auto-testing
        config_data = {
            "platform": "meta_ads",
            "credentials": {
                "META_APP_ID": "auto_test_app",
                "META_APP_SECRET": "auto_test_secret",
                "META_ACCESS_TOKEN": "auto_test_token",
                "META_AD_ACCOUNT_ID": "act_auto_test"
            }
        }
        
        success, data, status = self.make_request(
            'POST', 
            f'workspaces/{self.test_workspace_id}/integrations', 
            config_data
        )
        
        if success and data.get('config_id'):
            # Check that status was automatically set (not "not_configured")
            auto_tested = data.get('status') in ['testing', 'connected', 'failed']
            has_test_timestamp = data.get('last_tested') is not None
            
            self.log_result(
                "Auto Connection Testing", 
                auto_tested and has_test_timestamp,
                f"Integration auto-tested with status: {data.get('status')}, last_tested: {data.get('last_tested')}",
                f"Auto-testing failed - status: {data.get('status')}, no test timestamp"
            )
        else:
            self.log_result(
                "Auto Connection Testing", 
                False,
                f"Status: {status}",
                f"Failed to create integration for auto-testing: {data.get('detail', 'Unknown error')}"
            )

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        # List users
        success, data, status = self.make_request('GET', 'admin/users')
        self.log_result(
            "Admin List Users", 
            success,
            f"Found {len(data) if isinstance(data, list) else 0} users",
            f"Failed to list users: {status}"
        )

    def test_logout(self):
        """Test logout"""
        success, data, status = self.make_request('POST', 'auth/logout')
        self.log_result(
            "Logout", 
            success,
            "Successfully logged out",
            f"Logout failed: {status}"
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting thecommons. Growth OS API Tests")
        print("=" * 50)
        
        # Core functionality tests
        self.test_health_check()
        self.test_seed_data()
        self.test_login()
        
        if not self.session_token:
            print("❌ Cannot continue without authentication")
            return self.generate_report()
        
        # Authenticated tests
        self.test_get_me()
        self.test_list_organizations()
        self.test_list_workspaces()
        
        # NEW: Client Management and Integration Tests
        self.test_client_management_apis()
        self.test_integration_config_apis()
        self.test_rbac_permissions()
        self.test_auto_connection_testing()
        
        if self.test_workspace_id:
            self.test_get_workspace_details()
            self.test_command_center()
            self.test_experiments_crud()
            self.test_assets_crud()
            self.test_creators_crud()
            self.test_reports_crud()
            self.test_channels_and_performance()
            self.test_ai_endpoints()
        
        self.test_admin_endpoints()
        self.test_logout()
        
        return self.generate_report()

    def generate_report(self):
        """Generate test report"""
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            
            # Show failed tests
            failed_tests = [r for r in self.test_results if not r['success']]
            if failed_tests:
                print("\nFailed Tests:")
                for test in failed_tests:
                    print(f"  ❌ {test['test']}: {test['error']}")
            
            return 1

def main():
    """Main test runner"""
    tester = GrowthOSAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())