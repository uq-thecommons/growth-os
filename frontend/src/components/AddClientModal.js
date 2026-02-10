import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AddClientModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website_url: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    initial_goals: '',
    growth_lead_id: ''
  });
  const [growthLeads, setGrowthLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchGrowthLeads();
    }
  }, [isOpen]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orgId = localStorage.getItem('org_id') || 'org_thecommons001';
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/workspaces?org_id=${orgId}`,
        formData
      );
      
      onSuccess(response.data);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        industry: '',
        website_url: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        initial_goals: '',
        growth_lead_id: ''
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 className="text-xl font-semibold text-white">Add New Client</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Client Name */}
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
                placeholder="e.g., ACME Corporation"
              />
            </div>

            {/* Industry & Website */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="e.g., B2B SaaS"
                />
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
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Contact Person</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Contact Name"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                    placeholder="Email"
                  />
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
                    placeholder="Phone"
                  />
                </div>
              </div>
            </div>

            {/* Initial Goals */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Initial Goals & Objectives
              </label>
              <textarea
                value={formData.initial_goals}
                onChange={(e) => setFormData({...formData, initial_goals: e.target.value})}
                rows={3}
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white resize-none"
                placeholder="e.g., Increase qualified leads by 50% in Q1, improve conversion rate..."
              />
            </div>

            {/* Assign Growth Lead */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Assign Growth Lead
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

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-zinc-800 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name}
                className="px-5 py-2.5 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
