import { useState } from 'react';
import { Phone, Mic, MicOff, Phone as PhoneEnd, Clock, AlertCircle, CheckCircle, MessageCircle, TrendingUp } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

interface CallIntake {
  id: string;
  timestamp: string;
  callerName: string;
  callerNumber: string;
  companyName: string;
  intent: 'support' | 'sales' | 'compliance' | 'billing' | 'general';
  duration: number;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  notes: string;
  priority: 'high' | 'normal' | 'low';
}

const MOCK_INTAKES: CallIntake[] = [
  {
    id: 'CALL-001',
    timestamp: '2025-06-19 14:32',
    callerName: 'John Smith',
    callerNumber: '020 7946 0958',
    companyName: 'Acme Corporation Ltd',
    intent: 'compliance',
    duration: 342,
    status: 'new',
    notes: 'Asking about director change filing deadlines',
    priority: 'high'
  },
  {
    id: 'CALL-002',
    timestamp: '2025-06-19 13:15',
    callerName: 'Sarah Johnson',
    callerNumber: '020 7946 0959',
    companyName: 'TechStart Holdings',
    intent: 'support',
    duration: 248,
    status: 'contacted',
    notes: 'Dashboard access issue resolved',
    priority: 'normal'
  },
  {
    id: 'CALL-003',
    timestamp: '2025-06-19 11:47',
    callerName: 'Mike Chen',
    callerNumber: '020 7946 0960',
    companyName: 'Global Industries plc',
    intent: 'sales',
    duration: 567,
    status: 'qualified',
    notes: 'Enterprise plan inquiry - 500+ company portfolio',
    priority: 'high'
  }
];

export default function UltAi() {
  const [activeTab, setActiveTab] = useState<'live-call' | 'intake-history' | 'analytics'>('live-call');
  const [isRecording, setIsRecording] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [intakes, setIntakes] = useState<CallIntake[]>(MOCK_INTAKES);
  const [selectedIntake, setSelectedIntake] = useState<CallIntake | null>(null);

  const handleEndCall = () => {
    setCallActive(false);
    setIsRecording(false);
  };

  const getIntentColor = (intent: CallIntake['intent']) => {
    const colors: Record<CallIntake['intent'], string> = {
      support: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      sales: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      compliance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      billing: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
      general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    };
    return colors[intent];
  };

  const getStatusIcon = (status: CallIntake['status']) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'contacted':
        return <Phone className="w-4 h-4 text-blue-600" />;
      case 'qualified':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'closed':
        return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-cosmic-bg">
      <PageHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">UltAi Call Intake</h1>
          <p className="text-gray-600 dark:text-gray-400">AI-powered voice reception and intake management</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Today\'s Calls', value: '24', icon: '📞' },
            { label: 'Avg Duration', value: '5:42', icon: '⏱️' },
            { label: 'Qualified Leads', value: '8', icon: '⭐' },
            { label: 'Resolution Rate', value: '92%', icon: '✓' }
          ].map((stat, idx) => (
            <div key={idx} className="card-elevated p-4 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700">
          {['live-call', 'intake-history', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'live-call' && '📞 Live Call'}
              {tab === 'intake-history' && '📋 History'}
              {tab === 'analytics' && '📊 Analytics'}
            </button>
          ))}
        </div>

        {/* Live Call Panel */}
        {activeTab === 'live-call' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Call Control */}
            <div className="lg:col-span-2">
              <div className="card-elevated p-8 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {callActive ? 'Active Call' : 'Ready to Receive'}
                  </h2>
                  {callActive && (
                    <p className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400">00:45</p>
                  )}
                </div>

                {callActive ? (
                  <div className="space-y-6 mb-8">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <span className="font-semibold">Caller:</span> John Smith
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Company:</span> Acme Corporation Ltd
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Live Transcription</p>
                      <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 min-h-24 max-h-32 overflow-y-auto">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          "We're wondering about the timeline for filing our director changes at Companies House. We had two resignations last month..."
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detected Intent</p>
                      <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-sm font-medium">
                        Compliance Question
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50 dark:bg-slate-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-700 text-center">
                    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">System is ready to accept incoming calls</p>
                  </div>
                )}

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setCallActive(!callActive)}
                    className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                      callActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <PhoneEnd className="w-5 h-5" />
                    {callActive ? 'End Call' : 'Start Call'}
                  </button>
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    disabled={!callActive}
                    className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                      isRecording
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-2 border-red-300 dark:border-red-700'
                        : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300 disabled:opacity-50'
                    }`}
                  >
                    {isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    {isRecording ? 'Recording' : 'Paused'}
                  </button>
                </div>
              </div>
            </div>

            {/* Call Details */}
            <div className="card-elevated p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Notes</h3>
              <textarea
                placeholder="Add notes during or after the call..."
                className="w-full h-32 p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-600"
              />
              <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                Save Intake
              </button>
            </div>
          </div>
        )}

        {/* Intake History */}
        {activeTab === 'intake-history' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card-elevated rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Time</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Caller</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Intent</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Duration</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {intakes.map((intake) => (
                        <tr
                          key={intake.id}
                          onClick={() => setSelectedIntake(intake)}
                          className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
                        >
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-200">{intake.timestamp}</td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{intake.callerName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{intake.companyName}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getIntentColor(intake.intent)}`}>
                              {intake.intent}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{formatDuration(intake.duration)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(intake.status)}
                              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{intake.status}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Intake Detail */}
            {selectedIntake && (
              <div className="card-elevated p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Intake Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">ID</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedIntake.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Caller</p>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedIntake.callerName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedIntake.callerNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Notes</p>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedIntake.notes}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase mb-2">Priority</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      selectedIntake.priority === 'high'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : selectedIntake.priority === 'normal'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {selectedIntake.priority}
                    </span>
                  </div>
                  <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                    Follow Up
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Call Volume Trend', metric: '↑ 23%', period: 'vs last week' },
              { title: 'Lead Conversion Rate', metric: '67%', period: 'qualified intakes' },
              { title: 'Customer Satisfaction', metric: '4.8/5', period: 'average rating' },
              { title: 'Avg Response Time', metric: '2.3s', period: 'to first response' }
            ].map((item, idx) => (
              <div key={idx} className="card-elevated p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{item.metric}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.period}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
