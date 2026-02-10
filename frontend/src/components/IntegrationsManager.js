import React, { useState, useEffect } from 'react';
import axios from 'axios';

const platformInfo = {
  ga4: {
    name: 'Google Analytics 4',
    icon: '📊',
    fields: [
      { key: 'GA4_PROPERTY_ID', label: 'Property ID', placeholder: '123456789', type: 'text' },
      { key: 'GA4_SERVICE_ACCOUNT_JSON', label: 'Service Account JSON', placeholder: 'Paste entire JSON file content', type: 'textarea' }
    ]
  },
  meta_ads: {
    name: 'Meta Ads (Facebook/Instagram)',
    icon: '📱',
    fields: [
      { key: 'META_APP_ID', label: 'App ID', placeholder: 'Your app ID', type: 'text' },
      { key: 'META_APP_SECRET', label: 'App Secret', placeholder: 'Your app secret', type: 'password' },
      { key: 'META_ACCESS_TOKEN', label: 'Access Token', placeholder: 'Long-lived access token', type: 'password' },
      { key: 'META_AD_ACCOUNT_ID', label: 'Ad Account ID', placeholder: '123456789012345 (without act_)', type: 'text' }
    ]
  },
  google_ads: {
    name: 'Google Ads',
    icon: '🔍',
    fields: [
      { key: 'GOOGLE_ADS_DEVELOPER_TOKEN', label: 'Developer Token', placeholder: 'Your developer token', type: 'password' },
      { key: 'GOOGLE_ADS_CLIENT_ID', label: 'Client ID', placeholder: 'xxxxx.apps.googleusercontent.com', type: 'text' },
      { key: 'GOOGLE_ADS_CLIENT_SECRET', label: 'Client Secret', placeholder: 'Your client secret', type: 'password' },
      { key: 'GOOGLE_ADS_REFRESH_TOKEN', label: 'Refresh Token', placeholder: 'Your refresh token', type: 'password' },
      { key: 'GOOGLE_ADS_CUSTOMER_ID', label: 'Customer ID', placeholder: '123-456-7890', type: 'text' }
    ]
  }
};

const statusColors = {
  not_configured: 'bg-zinc-800 text-zinc-400',
  testing: 'bg-yellow-900/20 text-yellow-400 border-yellow-900',
  connected: 'bg-green-900/20 text-green-400 border-green-900',
  failed: 'bg-red-900/20 text-red-400 border-red-900',
  disconnected: 'bg-zinc-800 text-zinc-400'
};

const statusLabels = {
  not_configured: 'Not Configured',
  testing: 'Testing...',
  connected: 'Connected',
  failed: 'Failed',
  disconnected: 'Disconnected'
};

export default function IntegrationsManager({ workspaceId }) {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [credentials, setCredentials] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIntegrations();
  }, [workspaceId]);

  const fetchIntegrations = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/workspaces/${workspaceId}/integrations`
      );
      setIntegrations(response.data);
    } catch (err) {
      console.error('Error fetching integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationStatus = (platform) => {
    const integration = integrations.find(i => i.platform === platform);
    return integration || { status: 'not_configured', platform };
  };

  const handleEdit = (platform) => {
    setEditingPlatform(platform);
    setCredentials({});
    setError('');
  };

  const handleSave = async (platform) => {
    setSaving(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/workspaces/${workspaceId}/integrations`,
        {
          platform,
          credentials
        }
      );
      
      // Update integrations list
      const updated = integrations.filter(i => i.platform !== platform);
      setIntegrations([...updated, response.data]);
      
      setEditingPlatform(null);
      setCredentials({});
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save integration');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (configId) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/workspaces/${workspaceId}/integrations/${configId}/test`
      );
      
      // Refresh integrations
      await fetchIntegrations();
      
      if (response.data.status === 'connected') {
        alert('Connection test successful! ✅');
      } else {
        alert(`Connection test failed: ${response.data.error_message || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Connection test failed: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleDelete = async (configId, platform) => {
    if (!window.confirm(`Are you sure you want to remove the ${platformInfo[platform].name} integration?`)) {
      return;
    }

    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/workspaces/${workspaceId}/integrations/${configId}`
      );
      
      // Refresh integrations
      await fetchIntegrations();
    } catch (err) {
      alert('Failed to delete integration: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-400">Loading integrations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Ads Account Integrations</h2>
        <p className="text-zinc-400 text-sm">
          Connect your advertising platforms to sync campaign performance data automatically.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(platformInfo).map(([platform, info]) => {
          const status = getIntegrationStatus(platform);
          const isEditing = editingPlatform === platform;

          return (
            <div key={platform} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{info.icon}</span>
                  <div>
                    <h3 className="text-lg font-medium text-white">{info.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[status.status]}`}>
                        {statusLabels[status.status]}
                      </span>
                      {status.last_tested && (
                        <span className="text-xs text-zinc-500">
                          Last tested: {new Date(status.last_tested).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {status.error_message && (
                      <p className="text-xs text-red-400 mt-1">{status.error_message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {status.status === 'connected' && (
                    <button
                      onClick={() => handleTest(status.config_id)}
                      className="px-3 py-1.5 text-sm border border-zinc-700 text-white rounded hover:bg-zinc-800 transition-colors"
                    >
                      Test
                    </button>
                  )}
                  {!isEditing && status.has_credentials && (
                    <button
                      onClick={() => handleDelete(status.config_id, platform)}
                      className="px-3 py-1.5 text-sm border border-red-900 text-red-400 rounded hover:bg-red-900/20 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  {!isEditing && (
                    <button
                      onClick={() => handleEdit(platform)}
                      className="px-3 py-1.5 text-sm bg-white text-black rounded hover:bg-zinc-200 transition-colors font-medium"
                    >
                      {status.has_credentials ? 'Edit' : 'Configure'}
                    </button>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
                  {error && (
                    <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {info.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-white mb-2">
                        {field.label}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={credentials[field.key] || ''}
                          onChange={(e) => setCredentials({...credentials, [field.key]: e.target.value})}
                          rows={4}
                          className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white font-mono text-xs resize-none"
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={credentials[field.key] || ''}
                          onChange={(e) => setCredentials({...credentials, [field.key]: e.target.value})}
                          className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setEditingPlatform(null);
                        setCredentials({});
                        setError('');
                      }}
                      className="px-4 py-2 border border-zinc-700 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(platform)}
                      disabled={saving || Object.keys(credentials).length === 0}
                      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving & Testing...' : 'Save & Test Connection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <p className="text-sm text-zinc-400">
          💡 <strong>Need help?</strong> Check <code className="bg-black px-2 py-1 rounded text-xs">/app/INTEGRATION_SETUP.md</code> for detailed setup instructions for each platform.
        </p>
      </div>
    </div>
  );
}
