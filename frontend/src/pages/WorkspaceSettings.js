import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../layouts/DashboardLayout';
import IntegrationsManager from '../components/IntegrationsManager';

export default function WorkspaceSettings() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [growthLeads, setGrowthLeads] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    website_url: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    initial_goals: '',
    current_constraint: '',
    growth_lead_id: ''
  });

  useEffect(() => {
    fetchWorkspace();
    fetchGrowthLeads();
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/workspaces/${workspaceId}`
      );
      setWorkspace(response.data);
      
      // Populate form
      setFormData({
        name: response.data.name || '',
        description: response.data.description || '',
        industry: response.data.industry || '',
        website_url: response.data.website_url || '',
        contact_name: response.data.contact_name || '',
        contact_email: response.data.contact_email || '',
        contact_phone: response.data.contact_phone || '',
        initial_goals: response.data.initial_goals || '',
        current_constraint: response.data.current_constraint || '',
        growth_lead_id: response.data.growth_lead_id || ''
      });
    } catch (err) {
      console.error('Error fetching workspace:', err);
      setError('Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  const fetchGrowthLeads = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users`);
      const leads = response.data.filter(u => 
        u.roles.some(r => r.role === 'growth_lead' || r.role === 'admin')
      );
      setGrowthLeads(leads);
    } catch (err) {
      console.error('Error fetching growth leads:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/workspaces/${workspaceId}`,
        formData
      );
      
      setWorkspace(response.data);
      setSuccess('Client details updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Client Settings</h1>
          <p className="text-zinc-400">
            Manage client details and advertising platform integrations
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-800">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Client Details
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'integrations'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Integrations
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'details' && (
          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-900/20 border border-green-900 text-green-400 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={2}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white resize-none"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
              </div>
            </div>

            {/* Goals & Strategy */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Goals & Strategy</h2>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Initial Goals & Objectives
                </label>
                <textarea
                  value={formData.initial_goals}
                  onChange={(e) => setFormData({...formData, initial_goals: e.target.value})}
                  rows={3}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Current Constraint
                </label>
                <textarea
                  value={formData.current_constraint}
                  onChange={(e) => setFormData({...formData, current_constraint: e.target.value})}
                  rows={2}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white resize-none"
                  placeholder="e.g., Top-of-funnel awareness limiting qualified lead volume"
                />
              </div>
            </div>

            {/* Team Assignment */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Team Assignment</h2>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Growth Lead
                </label>
                <select
                  value={formData.growth_lead_id}
                  onChange={(e) => setFormData({...formData, growth_lead_id: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="">Select Growth Lead</option>
                  {growthLeads.map(lead => (
                    <option key={lead.user_id} value={lead.user_id}>
                      {lead.name} ({lead.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="submit"
                disabled={saving || !formData.name}
                className="px-6 py-2.5 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'integrations' && (
          <IntegrationsManager workspaceId={workspaceId} />
        )}
      </div>
    </DashboardLayout>
  );
}
