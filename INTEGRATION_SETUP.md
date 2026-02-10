# thecommons. Growth OS - Integration Setup Guide

This document provides detailed instructions for obtaining and configuring API credentials for all third-party integrations.

## Current Integration Status

✅ **Claude Sonnet 4.5 (AI)** - Pre-configured with Emergent LLM Key  
⏳ **Resend (Email)** - Awaiting API key  
⏳ **Google Analytics 4** - Awaiting credentials  
⏳ **Meta Ads** - Awaiting credentials  
⏳ **Google Ads** - Awaiting credentials  

---

## 1. Claude Sonnet 4.5 (AI) ✅

**Status**: Already configured  
**Key**: `EMERGENT_LLM_KEY=sk-emergent-d4cC84025Fe3eF3549`

This universal key is pre-configured and works for:
- Claude Sonnet 4 (text generation)
- OpenAI GPT models (text & image)
- Gemini models (text & image)

**Usage**: AI-powered weekly report generation, experiment suggestions, creative iterations

**No action needed** - This integration is ready to use!

---

## 2. Resend (Email Notifications)

**Purpose**: Send automated email notifications for report approvals and experiment decisions

### Setup Steps:

1. **Sign up for Resend**
   - Visit: https://resend.com
   - Create a free account

2. **Get API Key**
   - Go to Dashboard → API Keys
   - Click "Create API Key"
   - Copy the key (starts with `re_`)

3. **Verify Sender Email** (Optional for production)
   - For testing: Use `onboarding@resend.dev` (pre-verified)
   - For production: Add your domain and verify DNS records

4. **Add to .env**
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   SENDER_EMAIL=onboarding@resend.dev
   ```

5. **Restart backend**
   ```bash
   sudo supervisorctl restart backend
   ```

### Testing:
Once configured, email notifications will be sent when:
- Weekly reports are approved
- Experiment decisions are made

---

## 3. Google Analytics 4 (GA4)

**Purpose**: Pull website analytics, event tracking, and conversion data

### Setup Steps:

1. **Get Property ID**
   - Go to Google Analytics (analytics.google.com)
   - Select your property
   - Admin → Property Settings → Copy Property ID (format: `123456789`)

2. **Create Service Account**
   - Go to Google Cloud Console: https://console.cloud.google.com
   - Create/select a project
   - Enable "Google Analytics Data API"
   - Navigate to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name it (e.g., "Growth OS GA4")
   - Grant role: "Viewer"
   - Click "Create Key" → Choose JSON
   - Download the JSON file

3. **Grant Service Account Access to GA4**
   - In Google Analytics, go to Admin → Property Access Management
   - Click "+" → "Add users"
   - Enter the service account email (from JSON file)
   - Grant "Viewer" role

4. **Configure Environment Variables**
   - Open the downloaded JSON file
   - Copy the entire JSON content (minified, on one line)
   - Add to `/app/backend/.env`:
   ```bash
   GA4_PROPERTY_ID=123456789
   GA4_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"..."}'
   ```

5. **Restart backend**
   ```bash
   sudo supervisorctl restart backend
   ```

### What Data is Synced:
- Event counts (page views, sign ups, conversions, etc.)
- User metrics (total users, new users, sessions)
- Engagement metrics (bounce rate, session duration)
- Conversion tracking

---

## 4. Meta Ads (Facebook/Instagram)

**Purpose**: Pull campaign performance data from Meta advertising platform

### Setup Steps:

1. **Create Meta App**
   - Visit: https://developers.facebook.com
   - Go to "My Apps" → "Create App"
   - Choose "Business" type
   - Name your app (e.g., "Growth OS Connector")
   - Complete app creation

2. **Add Marketing API**
   - In your app dashboard, click "Add Product"
   - Find "Marketing API" and click "Set Up"

3. **Get Credentials**
   - **App ID**: Found in app dashboard (top left)
   - **App Secret**: Settings → Basic → Show "App Secret"

4. **Generate Access Token**
   - Go to Tools → Graph API Explorer
   - Select your app
   - Add Permissions: `ads_read`, `read_insights`
   - Click "Generate Access Token"
   - **Important**: Generate a long-lived token:
     ```
     https://graph.facebook.com/oauth/access_token?
       grant_type=fb_exchange_token&
       client_id={app-id}&
       client_secret={app-secret}&
       fb_exchange_token={short-lived-token}
     ```

5. **Get Ad Account ID**
   - Go to Meta Business Suite
   - Settings → Ad Accounts
   - Copy Ad Account ID (format: `act_123456789012345`)

6. **App Review** (Required for production)
   - Submit app for review to access production data
   - Request `ads_read` permission
   - Can use test accounts during development

7. **Add to .env**
   ```bash
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   META_ACCESS_TOKEN=your_long_lived_token
   META_AD_ACCOUNT_ID=123456789012345
   ```

8. **Restart backend**
   ```bash
   sudo supervisorctl restart backend
   ```

### What Data is Synced:
- Campaign hierarchy (campaigns, ad sets, ads)
- Performance metrics (impressions, clicks, spend, conversions)
- Cost metrics (CTR, CPC, CPA, frequency)

---

## 5. Google Ads

**Purpose**: Pull search and display campaign performance data

### Setup Steps:

1. **Apply for Developer Token**
   - Sign in to Google Ads
   - Go to Tools & Settings → Setup → API Center
   - Fill out the application form with:
     - Your business information
     - Website URL
     - Use case description
   - Submit for review (can take 3-5 business days)
   - You'll receive a developer token (starts with test account access)

2. **Create OAuth 2.0 Credentials**
   - Go to Google Cloud Console: https://console.cloud.google.com
   - Create/select a project
   - Enable "Google Ads API"
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Add authorized redirect URI: `http://localhost:8080`
   - Copy Client ID and Client Secret

3. **Generate Refresh Token**
   - Install Google Ads API Python library locally:
     ```bash
     pip install google-ads
     ```
   - Run OAuth flow to get refresh token:
     ```bash
     python -c "
     from google_auth_oauthlib.flow import InstalledAppFlow
     flow = InstalledAppFlow.from_client_config(
         {'installed': {
             'client_id': 'YOUR_CLIENT_ID',
             'client_secret': 'YOUR_CLIENT_SECRET',
             'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
             'token_uri': 'https://oauth2.googleapis.com/token'
         }},
         scopes=['https://www.googleapis.com/auth/adwords']
     )
     credentials = flow.run_local_server(port=8080)
     print(f'Refresh Token: {credentials.refresh_token}')
     "
     ```
   - Save the refresh token that's printed

4. **Get Customer ID**
   - Log in to Google Ads
   - Top right corner → Click your account
   - Copy Customer ID (format: `123-456-7890`)

5. **Add to .env**
   ```bash
   GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
   GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_ADS_CLIENT_SECRET=your_client_secret
   GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
   GOOGLE_ADS_CUSTOMER_ID=123-456-7890
   ```

6. **Restart backend**
   ```bash
   sudo supervisorctl restart backend
   ```

### What Data is Synced:
- Campaign data (search, display, performance max)
- Performance metrics (impressions, clicks, spend, conversions)
- Quality metrics (CTR, CPC, CPA, conversion rate)
- Search impression share data

---

## Verification

After configuring any integration, verify it's working:

1. **Check backend logs**:
   ```bash
   tail -f /var/log/supervisor/backend.err.log
   ```
   Look for connection success messages

2. **Trigger a manual sync**:
   - Log in to the application
   - Go to a workspace
   - Navigate to Distribution or Measurement page
   - Click "Sync" button for the connected channel

3. **Check for real data**:
   - If configured correctly, you'll see `"source": "ga4_api"` (or `meta_ads_api`, `google_ads_api`)
   - If mock mode, you'll see `"source": "mock"`

---

## Fallback Behavior

The application is designed to work without API credentials:

- **Without credentials**: All connectors use mock data
- **With credentials**: Real data is fetched from APIs
- **On API error**: Automatically falls back to mock data with error logging

This ensures the application remains functional during development and provides a seamless experience.

---

## Security Best Practices

1. **Never commit credentials to git**
   - The `.env` file is already in `.gitignore`

2. **Use environment-specific keys**
   - Use test/sandbox keys for development
   - Use production keys only in production

3. **Rotate keys regularly**
   - Especially after team member changes
   - Set up key expiry reminders

4. **Monitor API usage**
   - Check quota usage in respective dashboards
   - Set up alerts for unusual activity

---

## Troubleshooting

### Issue: "API not available" warnings in logs
**Solution**: This is normal if the SDK isn't installed or credentials aren't set. The app will use mock data.

### Issue: "Connection failed" but credentials are set
**Solution**: 
1. Verify credentials are correct (no extra spaces)
2. Check API is enabled in respective platform
3. Verify account has necessary permissions
4. Check firewall/network isn't blocking API calls

### Issue: Email notifications not sending
**Solution**:
1. Verify `RESEND_API_KEY` is set in `.env`
2. Check sender email is verified
3. Look for error messages in backend logs
4. Test Resend API key at https://resend.com/docs/dashboard/api-keys

### Issue: Google Ads "Invalid developer token"
**Solution**: Apply for "Basic Access" level in Google Ads API Center. Test accounts work during approval process.

---

## Support

If you encounter issues:

1. Check backend error logs: `tail -f /var/log/supervisor/backend.err.log`
2. Verify environment variables are loaded: `grep API_KEY /app/backend/.env`
3. Test API credentials directly using platform's API explorer/testing tools
4. Reach out to integration platform support for credential-specific issues

---

## Next Steps

Once integrations are configured:

1. Set up regular sync schedules (can be added via background jobs)
2. Configure data retention policies
3. Set up monitoring and alerting for API failures
4. Build custom reports using the synced data
5. Enable webhook notifications from platforms (future enhancement)
