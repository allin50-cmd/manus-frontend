import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Target, Calendar,
  BarChart3, PieChart, LineChart, Activity, Award, Clock,
  ArrowUp, ArrowDown, Minus, Filter, Download, RefreshCw
} from 'lucide-react';

const EnhancedAnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);
  
  // Mock analytics data
  const analytics = {
    revenue: {
      current: 125000,
      previous: 98000,
      growth: 27.6,
      trend: 'up',
      forecast: 145000
    },
    leads: {
      total: 48,
      new: 12,
      qualified: 18,
      converted: 8,
      conversionRate: 16.7,
      trend: 'up',
      growth: 15.4
    },
    opportunities: {
      total: 15,
      open: 10,
      won: 3,
      lost: 2,
      winRate: 60.0,
      avgDealSize: 5250,
      trend: 'up'
    },
    pipeline: {
      totalValue: 78500,
      expectedValue: 52340,
      velocity: 28,
      stages: [
        { name: 'Discovery', count: 4, value: 18000 },
        { name: 'Proposal', count: 3, value: 22500 },
        { name: 'Negotiation', count: 3, value: 38000 }
      ]
    },
    performance: {
      avgResponseTime: 2.4,
      customerSatisfaction: 4.8,
      retentionRate: 94.5,
      churnRate: 5.5
    },
    topServices: [
      { name: 'Taxation Services', revenue: 45000, count: 12, growth: 22 },
      { name: 'Financial Planning', revenue: 32000, count: 8, growth: 18 },
      { name: 'Payroll Services', revenue: 28000, count: 15, growth: 12 },
      { name: 'Company Secretarial', revenue: 20000, count: 6, growth: 8 }
    ],
    monthlyTrend: [
      { month: 'Jan', revenue: 85000, leads: 32, opportunities: 12 },
      { month: 'Feb', revenue: 92000, leads: 38, opportunities: 14 },
      { month: 'Mar', revenue: 98000, leads: 42, opportunities: 13 },
      { month: 'Apr', revenue: 105000, leads: 45, opportunities: 15 },
      { month: 'May', revenue: 115000, leads: 48, opportunities: 16 },
      { month: 'Jun', revenue: 125000, leads: 52, opportunities: 18 }
    ]
  };

  const MetricCard = ({ icon: Icon, label, value, change, trend, subtitle }) => (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-green-400/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-lg">
          <Icon className="w-6 h-6 text-green-300" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
            trend === 'up' ? 'bg-green-500/20 text-green-300' :
            trend === 'down' ? 'bg-red-500/20 text-red-300' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            {trend === 'up' && <ArrowUp className="w-4 h-4" />}
            {trend === 'down' && <ArrowDown className="w-4 h-4" />}
            {trend === 'stable' && <Minus className="w-4 h-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-300">{label}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );

  const ProgressBar = ({ label, value, max, color = 'green' }) => {
    const percentage = (value / max) * 100;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-300">{label}</span>
          <span className="text-white font-semibold">{value} / {max}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className={`bg-gradient-to-r from-${color}-400 to-${color}-500 h-2 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Enhanced Analytics</h1>
          <p className="text-gray-300">Comprehensive business intelligence and insights</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-green-400"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={`£${(analytics.revenue.current / 1000).toFixed(0)}k`}
          change={analytics.revenue.growth}
          trend={analytics.revenue.trend}
          subtitle={`Forecast: £${(analytics.revenue.forecast / 1000).toFixed(0)}k`}
        />
        <MetricCard
          icon={Users}
          label="Total Leads"
          value={analytics.leads.total}
          change={analytics.leads.growth}
          trend={analytics.leads.trend}
          subtitle={`${analytics.leads.new} new this month`}
        />
        <MetricCard
          icon={Target}
          label="Win Rate"
          value={`${analytics.opportunities.winRate}%`}
          change={8.5}
          trend="up"
          subtitle={`${analytics.opportunities.won} won / ${analytics.opportunities.total} total`}
        />
        <MetricCard
          icon={Clock}
          label="Pipeline Velocity"
          value={`${analytics.pipeline.velocity} days`}
          change={12}
          trend="down"
          subtitle="Average time to close"
        />
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-400" />
            Pipeline by Stage
          </h2>
          {analytics.pipeline.stages.map((stage, idx) => (
            <ProgressBar
              key={idx}
              label={stage.name}
              value={stage.count}
              max={10}
              color="green"
            />
          ))}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Total Pipeline Value</div>
                <div className="text-2xl font-bold text-green-400">£{(analytics.pipeline.totalValue / 1000).toFixed(0)}k</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Expected Value</div>
                <div className="text-2xl font-bold text-emerald-400">£{(analytics.pipeline.expectedValue / 1000).toFixed(0)}k</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-green-400" />
            Top Services
          </h2>
          {analytics.topServices.map((service, idx) => (
            <div key={idx} className="mb-4 pb-4 border-b border-white/10 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{service.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-bold">£{(service.revenue / 1000).toFixed(0)}k</span>
                  <span className="text-xs text-gray-400">({service.count} clients)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                    style={{ width: `${(service.revenue / 45000) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${service.growth > 15 ? 'text-green-400' : 'text-yellow-400'}`}>
                  +{service.growth}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <LineChart className="w-6 h-6 text-green-400" />
          6-Month Trend
        </h2>
        <div className="grid grid-cols-6 gap-4">
          {analytics.monthlyTrend.map((month, idx) => (
            <div key={idx} className="text-center">
              <div className="text-sm text-gray-400 mb-2">{month.month}</div>
              <div className="bg-white/5 rounded-lg p-3 mb-2">
                <div className="text-lg font-bold text-green-400">£{(month.revenue / 1000).toFixed(0)}k</div>
                <div className="text-xs text-gray-400">Revenue</div>
              </div>
              <div className="text-sm text-white">{month.leads} leads</div>
              <div className="text-xs text-gray-400">{month.opportunities} opps</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Response Time</h3>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-2">{analytics.performance.avgResponseTime}h</div>
          <div className="text-sm text-gray-300">Average response time</div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Satisfaction</h3>
          </div>
          <div className="text-3xl font-bold text-yellow-400 mb-2">{analytics.performance.customerSatisfaction}/5.0</div>
          <div className="text-sm text-gray-300">Customer satisfaction score</div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Retention</h3>
          </div>
          <div className="text-3xl font-bold text-green-400 mb-2">{analytics.performance.retentionRate}%</div>
          <div className="text-sm text-gray-300">Customer retention rate</div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="w-8 h-8 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Churn</h3>
          </div>
          <div className="text-3xl font-bold text-red-400 mb-2">{analytics.performance.churnRate}%</div>
          <div className="text-sm text-gray-300">Monthly churn rate</div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalyticsPage;

