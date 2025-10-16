import React, { useState } from 'react';
import api from '../utils/api';
import { 
  Users, Bot, User, Calendar, DollarSign, TrendingUp, 
  CheckCircle, Clock, Award, Briefcase, Mail, Phone,
  Zap, Target, BarChart3, Settings
} from 'lucide-react';

const AccountantTeamPage = () => {
  const [selectedTab, setSelectedTab] = useState('team');
  const [selectedAccountant, setSelectedAccountant] = useState(null);
  const [taskForm, setTaskForm] = useState({
    category: 'bookkeeping',
    priority: 'medium',
    complexity: 'medium',
    estimatedHours: 2,
    description: ''
  });
  const [costComparison, setCostComparison] = useState(null);

  // Mock data - in production, fetch from API
  const accountants = [
    {
      id: 'JA-001',
      name: 'Sarah Mitchell',
      type: 'junior_accountant',
      avatar: '👩‍💼',
      specialties: ['Bookkeeping', 'Payroll', 'Data Entry'],
      availability: 'Mon-Fri 9am-5pm',
      capacity: 20,
      costPerHour: 35,
      accuracy: 95.0,
      speedMultiplier: 1.0,
      email: 'sarah.mitchell@devonshiregreen.uk',
      phone: '01959 565 772',
      tasksCompleted: 342,
      rating: 4.7
    },
    {
      id: 'SA-001',
      name: 'Michael Roberts',
      type: 'senior_accountant',
      avatar: '👨‍💼',
      specialties: ['Tax Returns', 'Financial Planning', 'Consulting'],
      availability: 'Mon-Fri 9am-6pm',
      capacity: 15,
      costPerHour: 75,
      accuracy: 98.0,
      speedMultiplier: 1.5,
      qualifications: ['ACCA', '15 years experience'],
      email: 'michael.roberts@devonshiregreen.uk',
      phone: '01959 565 772',
      tasksCompleted: 567,
      rating: 4.9
    },
    {
      id: 'CA-001',
      name: 'David Patterson',
      type: 'chartered_accountant',
      avatar: '👔',
      specialties: ['Audit', 'Financial Planning', 'Consulting', 'Tax Planning'],
      availability: 'Mon-Fri 9am-7pm',
      capacity: 10,
      costPerHour: 150,
      accuracy: 99.5,
      speedMultiplier: 2.0,
      qualifications: ['FCA', '25 years experience', 'Partner'],
      email: 'david.patterson@devonshiregreen.uk',
      phone: '01959 565 772',
      tasksCompleted: 892,
      rating: 5.0
    },
    {
      id: 'TS-001',
      name: 'Rachel Green',
      type: 'tax_specialist',
      avatar: '📊',
      specialties: ['Tax Returns', 'Tax Planning', 'Inheritance Tax', 'Capital Gains'],
      availability: 'Mon-Fri 9am-6pm',
      capacity: 12,
      costPerHour: 120,
      accuracy: 99.0,
      speedMultiplier: 1.8,
      qualifications: ['CTA', 'ATT', '18 years experience'],
      email: 'rachel.green@devonshiregreen.uk',
      phone: '01959 565 772',
      tasksCompleted: 445,
      rating: 4.9
    }
  ];

  const services = [
    {
      category: 'Bookkeeping',
      icon: '📚',
      aiSupported: true,
      startingPrice: 150,
      services: ['Transaction recording', 'Bank reconciliation', 'Accounts payable/receivable']
    },
    {
      category: 'Tax Returns',
      icon: '📋',
      aiSupported: false,
      startingPrice: 250,
      services: ['Personal tax returns', 'Corporate tax returns', 'Tax planning']
    },
    {
      category: 'Payroll',
      icon: '💰',
      aiSupported: true,
      startingPrice: 100,
      services: ['Payroll processing', 'RTI submissions', 'PAYE/NI calculations']
    },
    {
      category: 'VAT',
      icon: '🧾',
      aiSupported: true,
      startingPrice: 120,
      services: ['VAT returns', 'VAT registration', 'Making Tax Digital compliance']
    },
    {
      category: 'Audit',
      icon: '🔍',
      aiSupported: false,
      startingPrice: 1500,
      services: ['Statutory audit', 'Internal audit', 'Compliance audit']
    },
    {
      category: 'Financial Planning',
      icon: '📈',
      aiSupported: false,
      startingPrice: 500,
      services: ['Business planning', 'Cash flow forecasting', 'Investment advice']
    }
  ];

  const teamCapacity = {
    totalCapacity: 1067,
    aiCapacity: 1000,
    humanCapacity: 67,
    currentTasks: 234,
    utilization: 21.9,
    availableSlots: 833,
    teamSize: 5,
    aiAccountants: 1,
    humanAccountants: 4
  };

  const handleCalculateCost = () => {
    // Simulate cost comparison
    const aiCost = 0;
    const humanCost = taskForm.estimatedHours * 75;
    const savings = humanCost - aiCost;
    
    setCostComparison({
      ai: {
        cost: aiCost,
        time: (taskForm.estimatedHours / 10).toFixed(1) + ' hours',
        accountant: 'FineGuard AI Assistant'
      },
      human: {
        cost: humanCost,
        time: taskForm.estimatedHours + ' hours',
        accountant: 'Michael Roberts'
      },
      savings: savings,
      savingsPercentage: 100,
      recommendation: taskForm.complexity === 'high' ? 'human' : 'ai'
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      ai_assistant: 'from-purple-500 to-blue-500',
      junior_accountant: 'from-green-500 to-teal-500',
      senior_accountant: 'from-blue-500 to-indigo-500',
      chartered_accountant: 'from-indigo-500 to-purple-500',
      tax_specialist: 'from-orange-500 to-red-500'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const getTypeBadge = (type) => {
    const badges = {
      ai_assistant: { label: 'AI Assistant', color: 'bg-purple-500' },
      junior_accountant: { label: 'Junior', color: 'bg-green-500' },
      senior_accountant: { label: 'Senior', color: 'bg-blue-500' },
      chartered_accountant: { label: 'Chartered', color: 'bg-indigo-500' },
      tax_specialist: { label: 'Tax Specialist', color: 'bg-orange-500' }
    };
    return badges[type] || { label: 'Accountant', color: 'bg-gray-500' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-10 h-10 text-purple-400" />
            Accountant Team
          </h1>
          <p className="text-gray-300">AI-powered automation meets human expertise</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {[
            { id: 'team', label: 'Team', icon: Users },
            { id: 'services', label: 'Services', icon: Briefcase },
            { id: 'assign', label: 'Assign Task', icon: Target },
            { id: 'capacity', label: 'Capacity', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Team Tab */}
        {selectedTab === 'team' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accountants.map(accountant => {
              const badge = getTypeBadge(accountant.type);
              return (
                <div
                  key={accountant.id}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all cursor-pointer"
                  onClick={() => setSelectedAccountant(accountant)}
                >
                  {/* Avatar & Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getTypeColor(accountant.type)} flex items-center justify-center text-3xl`}>
                      {accountant.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{accountant.name}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1">Accuracy</div>
                      <div className="text-white font-bold">{accountant.accuracy}%</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1">Rating</div>
                      <div className="text-white font-bold flex items-center gap-1">
                        ⭐ {accountant.rating}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1">Tasks Done</div>
                      <div className="text-white font-bold">{accountant.tasksCompleted.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1">Cost/Hour</div>
                      <div className="text-white font-bold">
                        {accountant.costPerHour === 0 ? 'Free' : `£${accountant.costPerHour}`}
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mb-4">
                    <div className="text-gray-400 text-xs mb-2">Specialties</div>
                    <div className="flex flex-wrap gap-2">
                      {accountant.specialties.slice(0, 3).map((specialty, idx) => (
                        <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock className="w-4 h-4" />
                    {accountant.availability}
                  </div>

                  {/* Contact (for humans) */}
                  {accountant.email && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Mail className="w-4 h-4" />
                        {accountant.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Phone className="w-4 h-4" />
                        {accountant.phone}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Services Tab */}
        {selectedTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{service.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{service.category}</h3>
                      <div className="text-sm text-gray-400">From £{service.startingPrice}/month</div>
                    </div>
                  </div>
                  {service.aiSupported && (
                    <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      AI
                    </div>
                  )}
                </div>

                <ul className="space-y-2">
                  {service.services.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <button className="w-full mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                  Request Service
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Assign Task Tab */}
        {selectedTab === 'assign' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-purple-400" />
                Assign New Task
              </h2>

              <div className="space-y-6">
                {/* Category */}
                <div>
                  <label className="block text-white mb-2 font-medium">Service Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({...taskForm, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                  >
                    <option value="bookkeeping">Bookkeeping</option>
                    <option value="tax_returns">Tax Returns</option>
                    <option value="payroll">Payroll</option>
                    <option value="vat">VAT</option>
                    <option value="audit">Audit</option>
                    <option value="financial_planning">Financial Planning</option>
                  </select>
                </div>

                {/* Priority & Complexity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white mb-2 font-medium">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">Complexity</label>
                    <select
                      value={taskForm.complexity}
                      onChange={(e) => setTaskForm({...taskForm, complexity: e.target.value})}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="block text-white mb-2 font-medium">Estimated Hours</label>
                  <input
                    type="number"
                    value={taskForm.estimatedHours}
                    onChange={(e) => setTaskForm({...taskForm, estimatedHours: parseFloat(e.target.value)})}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                    min="0.5"
                    step="0.5"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-white mb-2 font-medium">Task Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white h-32"
                    placeholder="Describe the task in detail..."
                  />
                </div>

                {/* Calculate Cost Button */}
                <button
                  onClick={handleCalculateCost}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-5 h-5" />
                  Calculate Cost Comparison
                </button>

                {/* Cost Comparison Result */}
                {costComparison && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-400/30">
                    <h3 className="text-xl font-bold text-white mb-4">Cost Comparison</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* AI Option */}
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Bot className="w-5 h-5 text-purple-400" />
                          <span className="font-bold text-white">AI Assistant</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Cost:</span>
                            <span className="text-white font-bold">£{costComparison.ai.cost}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Time:</span>
                            <span className="text-white font-bold">{costComparison.ai.time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Human Option */}
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-5 h-5 text-blue-400" />
                          <span className="font-bold text-white">Human Accountant</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Cost:</span>
                            <span className="text-white font-bold">£{costComparison.human.cost}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Time:</span>
                            <span className="text-white font-bold">{costComparison.human.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Savings */}
                    <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-green-300 font-medium">Potential Savings with AI:</span>
                        <span className="text-green-400 font-bold text-xl">£{costComparison.savings} ({costComparison.savingsPercentage}%)</span>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="mt-4 p-4 bg-white/10 rounded-lg">
                      <div className="flex items-center gap-2 text-white">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span className="font-bold">Recommendation:</span>
                        <span className="capitalize">{costComparison.recommendation}</span>
                      </div>
                    </div>

                    {/* Assign Button */}
                    <button className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all">
                      Assign to {costComparison.recommendation === 'ai' ? 'AI Assistant' : 'Human Accountant'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Capacity Tab */}
        {selectedTab === 'capacity' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                Team Capacity & Utilization
              </h2>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-400/30">
                  <div className="text-gray-300 text-sm mb-1">Total Capacity</div>
                  <div className="text-white text-2xl font-bold">{teamCapacity.totalCapacity}</div>
                  <div className="text-gray-400 text-xs">tasks/day</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-400/30">
                  <div className="text-gray-300 text-sm mb-1">Current Tasks</div>
                  <div className="text-white text-2xl font-bold">{teamCapacity.currentTasks}</div>
                  <div className="text-gray-400 text-xs">active</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-400/30">
                  <div className="text-gray-300 text-sm mb-1">Utilization</div>
                  <div className="text-white text-2xl font-bold">{teamCapacity.utilization}%</div>
                  <div className="text-gray-400 text-xs">of capacity</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl p-4 border border-blue-400/30">
                  <div className="text-gray-300 text-sm mb-1">Available</div>
                  <div className="text-white text-2xl font-bold">{teamCapacity.availableSlots}</div>
                  <div className="text-gray-400 text-xs">slots</div>
                </div>
              </div>

              {/* Capacity Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">Capacity Breakdown</h3>
                
                {/* AI Capacity */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">AI Assistant Capacity</span>
                    </div>
                    <span className="text-white font-bold">{teamCapacity.aiCapacity} tasks/day</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
                      style={{width: '23%'}}
                    ></div>
                  </div>
                  <div className="text-gray-400 text-sm mt-1">23% utilized (230 tasks)</div>
                </div>

                {/* Human Capacity */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">Human Accountants Capacity</span>
                    </div>
                    <span className="text-white font-bold">{teamCapacity.humanCapacity} tasks/day</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full"
                      style={{width: '6%'}}
                    ></div>
                  </div>
                  <div className="text-gray-400 text-sm mt-1">6% utilized (4 tasks)</div>
                </div>
              </div>

              {/* Team Size */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="text-white font-bold text-xl">{teamCapacity.aiAccountants}</div>
                  <div className="text-gray-400 text-sm">AI Assistant</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-white font-bold text-xl">{teamCapacity.humanAccountants}</div>
                  <div className="text-gray-400 text-sm">Human Accountants</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="text-white font-bold text-xl">{teamCapacity.teamSize}</div>
                  <div className="text-gray-400 text-sm">Total Team</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountantTeamPage;

