
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Users, TrendingUp, DollarSign, Target, Calendar,
  Phone, Mail, Building, Award, AlertCircle, CheckCircle,
  Clock, ArrowUp, ArrowDown, Filter, Search, Plus
} from 'lucide-react';

const CRMDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [leadsResponse, opportunitiesResponse, analyticsResponse] = await Promise.all([
          api.get('/api/leads'),
          api.get('/api/opportunities'),
          api.get('/api/analytics')
        ]);

        setLeads(leadsResponse.data);
        setOpportunities(opportunitiesResponse.data);
        setAnalytics(analyticsResponse.data);
      } catch (err) {
        console.error('Error fetching CRM data:', err);
        setError('Failed to load CRM data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-purple-100 text-purple-800',
      qualified: 'bg-green-100 text-green-800',
      proposal_sent: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      won: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const MetricCard = ({ icon: Icon, label, value, change, trend }) => (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-lg">
          <Icon className="w-6 h-6 text-green-300" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span>{change}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-300">{label}</div>
    </div>
  );

  const LeadCard = ({ lead }) => (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-green-400/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">{lead.companyName}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Mail className="w-4 h-4" />
            <span>{lead.contactEmail}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
            {lead.status.replace('_', ' ').toUpperCase()}
          </span>
          <div className={`flex items-center gap-1 ${getPriorityColor(lead.priority)}`}>
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">{lead.priority.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Lead Score</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                style={{ width: `${lead.leadScore}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-white">{lead.leadScore}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Potential Value</div>
          <div className="text-lg font-bold text-green-400">£{lead.potentialValue.toLocaleString()}/yr</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Recommended Services</div>
        <div className="flex flex-wrap gap-2">
          {lead.recommendedServices.map((service, idx) => (
            <span key={idx} className="px-2 py-1 bg-green-400/20 text-green-300 rounded text-xs">
              {service}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Follow-up: {new Date(lead.nextFollowUpDate).toLocaleDateString()}</span>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-green-500/50 transition-all">
          View Details
        </button>
      </div>
    </div>
  );

  const OpportunityCard = ({ opp }) => (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-green-400/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{opp.companyName}</h3>
          <span className="px-3 py-1 bg-gradient-to-r from-green-400/20 to-emerald-500/20 text-green-300 rounded-full text-xs font-medium">
            {opp.package} Package
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">£{opp.annualValue.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Annual Value</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Probability</div>
          <div className="text-lg font-semibold text-white">{opp.probability}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Expected</div>
          <div className="text-lg font-semibold text-emerald-400">£{opp.expectedValue.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-white capitalize">{opp.stage}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Target className="w-4 h-4" />
          <span>Close: {new Date(opp.expectedCloseDate).toLocaleDateString()}</span>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-green-500/50 transition-all">
          Manage
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Loading CRM Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-red-400 text-xl">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!loading && !error && leads.length === 0 && opportunities.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center text-white">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <div className="text-xl">No CRM data found</div>
            <p className="text-gray-400 mt-2">Start by adding leads and opportunities</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">CRM Dashboard</h1>
        <p className="text-gray-300">Manage leads, opportunities, and sales pipeline</p>
      </div>

      {/* Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={Users}
            label="Total Leads"
            value={analytics.totalLeads}
            change={12}
            trend="up"
          />
          <MetricCard
            icon={Target}
            label="Opportunities"
            value={analytics.totalOpportunities}
            change={8}
            trend="up"
          />
          <MetricCard
            icon={DollarSign}
            label="Pipeline Value"
            value={`£${(analytics.totalPipelineValue / 1000).toFixed(0)}k`}
            change={15}
            trend="up"
          />
          <MetricCard
            icon={TrendingUp}
            label="Conversion Rate"
            value={`${analytics.conversionRate}%`}
            change={5}
            trend="up"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'pipeline'
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Lead Pipeline
        </button>
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'opportunities'
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Opportunities
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Content */}
      {activeTab === 'pipeline' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Lead Pipeline ({leads.length})</h2>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Lead
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((lead) => (
              <LeadCard key={lead.leadId} lead={lead} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'opportunities' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Opportunities ({opportunities.length})</h2>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Opportunity
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.opportunityId} opp={opp} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">CRM Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-sm text-gray-300 mb-2">Conversion Rate</div>
              <div className="text-4xl font-bold text-green-400">{analytics.conversionRate}%</div>
              <p className="text-gray-400 mt-2">Leads converted to opportunities.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-sm text-gray-300 mb-2">Win Rate</div>
              <div className="text-4xl font-bold text-emerald-400">{analytics.winRate}%</div>
              <p className="text-gray-400 mt-2">Opportunities won vs. lost.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-sm text-gray-300 mb-2">Average Deal Size</div>
              <div className="text-4xl font-bold text-green-400">£{analytics.averageDealSize.toLocaleString()}</div>
              <p className="text-gray-400 mt-2">Average value of closed deals.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-sm text-gray-300 mb-2">Pipeline Velocity</div>
              <div className="text-4xl font-bold text-emerald-400">{analytics.pipelineVelocity} Days</div>
              <p className="text-gray-400 mt-2">Average time to close a deal.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-sm text-gray-300 mb-2">Total Pipeline Value</div>
              <div className="text-4xl font-bold text-green-400">£{analytics.totalPipelineValue.toLocaleString()}</div>
              <p className="text-gray-400 mt-2">Total value of all active opportunities.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-sm text-gray-300 mb-2">Expected Revenue</div>
              <div className="text-4xl font-bold text-emerald-400">£{analytics.expectedRevenue.toLocaleString()}</div>
              <p className="text-gray-400 mt-2">Weighted revenue from opportunities.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMDashboardPage;
