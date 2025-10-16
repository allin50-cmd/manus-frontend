import React, { useState, useEffect } from 'react';
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

  // State for fetched data and loading states
  const [accountants, setAccountants] = useState([]);
  const [loadingAccountants, setLoadingAccountants] = useState(true);
  const [errorAccountants, setErrorAccountants] = useState(null);

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [errorServices, setErrorServices] = useState(null);

  const [teamCapacity, setTeamCapacity] = useState(null);
  const [loadingTeamCapacity, setLoadingTeamCapacity] = useState(true);
  const [errorTeamCapacity, setErrorTeamCapacity] = useState(null);

  // Fetch accountants data
  useEffect(() => {
    const fetchAccountants = async () => {
      try {
        setLoadingAccountants(true);
        const response = await api.get('/accountants');
        setAccountants(response);
      } catch (err) {
        setErrorAccountants('Failed to fetch accountants.');
        console.error('Error fetching accountants:', err);
      } finally {
        setLoadingAccountants(false);
      }
    };
    fetchAccountants();
  }, []);

  // Fetch services data
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const response = await api.get('/services');
        setServices(response);
      } catch (err) {
        setErrorServices('Failed to fetch services.');
        console.error('Error fetching services:', err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // Fetch team capacity data
  useEffect(() => {
    const fetchTeamCapacity = async () => {
      try {
        setLoadingTeamCapacity(true);
        const response = await api.get('/team-capacity');
        setTeamCapacity(response);
      } catch (err) {
        setErrorTeamCapacity('Failed to fetch team capacity.');
        console.error('Error fetching team capacity:', err);
      } finally {
        setLoadingTeamCapacity(false);
      }
    };
    fetchTeamCapacity();
  }, []);

  const handleCalculateCost = () => {
    // Simulate cost comparison - this logic might need adjustment based on actual API responses
    const aiCost = 0; // Assuming AI cost is handled by backend or fixed
    const humanCost = taskForm.estimatedHours * 75; // Assuming a default human cost
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
        accountant: 'Michael Roberts' // This should probably be dynamic based on selectedAccountant
      },
      savings: savings,
      savingsPercentage: savings > 0 ? ((savings / humanCost) * 100).toFixed(0) : 0,
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
            {loadingAccountants && <p className="text-white">Loading accountants...</p>}
            {errorAccountants && <p className="text-red-500">Error: {errorAccountants}</p>}
            {!loadingAccountants && !errorAccountants && accountants.length === 0 && <p className="text-gray-300">No accountants found.</p>}
            {!loadingAccountants && !errorAccountants && accountants.map(accountant => {
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

        {/* Accountant Detail Modal */}
        {selectedAccountant && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-800 to-gray-900 p-8 rounded-2xl shadow-xl max-w-2xl w-full relative border border-purple-500">
              <button
                onClick={() => setSelectedAccountant(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                {selectedAccountant.avatar} {selectedAccountant.name}
              </h2>
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium text-white ${getTypeBadge(selectedAccountant.type).color} mb-4`}>
                {getTypeBadge(selectedAccountant.type).label}
              </span>
              <div className="grid grid-cols-2 gap-4 text-gray-300 text-sm mb-6">
                <p><strong className="text-white">Specialties:</strong> {selectedAccountant.specialties.join(', ')}</p>
                <p><strong className="text-white">Availability:</strong> {selectedAccountant.availability}</p>
                <p><strong className="text-white">Accuracy:</strong> {selectedAccountant.accuracy}%</p>
                <p><strong className="text-white">Rating:</strong> ⭐ {selectedAccountant.rating}</p>
                <p><strong className="text-white">Tasks Completed:</strong> {selectedAccountant.tasksCompleted.toLocaleString()}</p>
                <p><strong className="text-white">Cost per Hour:</strong> {selectedAccountant.costPerHour === 0 ? 'Free' : `£${selectedAccountant.costPerHour}`}</p>
                {selectedAccountant.qualifications && <p className="col-span-2"><strong className="text-white">Qualifications:</strong> {selectedAccountant.qualifications.join(', ')}</p>}
                <p className="col-span-2"><strong className="text-white">Email:</strong> {selectedAccountant.email}</p>
                <p className="col-span-2"><strong className="text-white">Phone:</strong> {selectedAccountant.phone}</p>
              </div>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                Assign Task to {selectedAccountant.name}
              </button>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {selectedTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingServices && <p className="text-white">Loading services...</p>}
            {errorServices && <p className="text-red-500">Error: {errorServices}</p>}
            {!loadingServices && !errorServices && services.length === 0 && <p className="text-gray-300">No services found.</p>}
            {!loadingServices && !errorServices && services.map((service, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">{service.icon}</div>
                  <h3 className="text-xl font-bold text-white">{service.category}</h3>
                </div>
                <p className="text-gray-300 mb-4">Starting from <span className="font-bold text-purple-400">£{service.startingPrice}</span></p>
                <ul className="list-disc list-inside text-gray-300 mb-4">
                  {service.services.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                {service.aiSupported && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                    <Bot className="w-4 h-4" /> AI Supported
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Assign Task Tab */}
        {selectedTab === 'assign' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">Assign a New Task</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCalculateCost(); }} className="space-y-6">
              <div>
                <label htmlFor="taskCategory" className="block text-gray-300 text-sm font-medium mb-2">Category</label>
                <select
                  id="taskCategory"
                  name="category"
                  value={taskForm.category}
                  onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:ring-purple-500 focus:border-purple-500"
                >
                  {services.map(s => <option key={s.category} value={s.category.toLowerCase()}>{s.category}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="taskPriority" className="block text-gray-300 text-sm font-medium mb-2">Priority</label>
                <select
                  id="taskPriority"
                  name="priority"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="taskComplexity" className="block text-gray-300 text-sm font-medium mb-2">Complexity</label>
                <select
                  id="taskComplexity"
                  name="complexity"
                  value={taskForm.complexity}
                  onChange={(e) => setTaskForm({ ...taskForm, complexity: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="estimatedHours" className="block text-gray-300 text-sm font-medium mb-2">Estimated Hours</label>
                <input
                  type="number"
                  id="estimatedHours"
                  name="estimatedHours"
                  value={taskForm.estimatedHours}
                  onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: parseInt(e.target.value) })}
                  min="1"
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label htmlFor="taskDescription" className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                <textarea
                  id="taskDescription"
                  name="description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows="4"
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Briefly describe the task..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg"
              >
                Calculate Cost & Recommend
              </button>
            </form>

            {costComparison && (
              <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-4">Cost Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <p className="text-purple-400 font-semibold mb-2 flex items-center gap-2"><Bot className="w-5 h-5" /> AI Assistant</p>
                    <p className="text-white text-xl font-bold">£{costComparison.ai.cost}</p>
                    <p className="text-gray-400 text-sm">Time: {costComparison.ai.time}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <p className="text-blue-400 font-semibold mb-2 flex items-center gap-2"><User className="w-5 h-5" /> Human Accountant</p>
                    <p className="text-white text-xl font-bold">£{costComparison.human.cost}</p>
                    <p className="text-gray-400 text-sm">Time: {costComparison.human.time}</p>
                  </div>
                </div>
                <div className="text-center mb-6">
                  <p className="text-gray-300 text-lg">Potential Savings: <span className="text-green-400 font-bold">£{costComparison.savings} ({costComparison.savingsPercentage}%)</span></p>
                </div>
                <div className="text-center">
                  <p className="text-white text-lg font-semibold">Recommendation: 
                    <span className={`ml-2 px-3 py-1 rounded-full ${costComparison.recommendation === 'ai' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                      {costComparison.recommendation === 'ai' ? 'AI Assistant' : 'Human Accountant'}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Capacity Tab */}
        {selectedTab === 'capacity' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">Team Capacity Overview</h2>
            {loadingTeamCapacity && <p className="text-white">Loading team capacity...</p>}
            {errorTeamCapacity && <p className="text-red-500">Error: {errorTeamCapacity}</p>}
            {!loadingTeamCapacity && !errorTeamCapacity && teamCapacity && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
                  <p className="font-medium">Total Capacity (Hours)</p>
                  <p className="text-white text-xl font-bold">{teamCapacity.totalCapacity}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
                  <p className="font-medium">AI Capacity (Hours)</p>
                  <p className="text-white text-xl font-bold">{teamCapacity.aiCapacity}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
                  <p className="font-medium">Human Capacity (Hours)</p>
                  <p className="text-white text-xl font-bold">{teamCapacity.humanCapacity}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
                  <p className="font-medium">Current Tasks</p>
                  <p className="text-white text-xl font-bold">{teamCapacity.currentTasks}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
                  <p className="font-medium">Utilization</p>
                  <p className="text-white text-xl font-bold">{teamCapacity.utilization}%</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
                  <p className="font-medium">Available Slots</p>
                  <p className="text-white text-xl font-bold">{teamCapacity.availableSlots}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
                  <p className="font-medium">Team Size</p>
                  <p className="text-white text-xl font-bold">{teamCapacity.teamSize}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
                  <p className="font-medium">AI Accountants</p>
                  <p className="text-white text-xl font-bold">{teamCapacity.aiAccountants}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between">
                  <p className="font-medium">Human Accountants</p>
                  <p className="text-white text-xl font-bold">{teamCapacity.humanAccountants}</p>
                </div>
              </div>
            )}
            {!loadingTeamCapacity && !errorTeamCapacity && !teamCapacity && <p className="text-gray-300">Team capacity data not available.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountantTeamPage;
