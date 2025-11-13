import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Plus, Search, Filter, Calendar, AlertTriangle, CheckCircle2, Clock, Edit, Trash2, Eye, Bell, FileText, Download, Upload } from 'lucide-react'

const DeadlineTrackerPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [showAddModal, setShowAddModal] = useState(false)

  // Sample deadlines data
  const [deadlines, setDeadlines] = useState([
    {
      id: 1,
      title: 'VAT Return Q4 2024',
      description: 'Submit quarterly VAT return for October-December 2024',
      dueDate: '2024-11-15',
      type: 'tax',
      status: 'upcoming',
      priority: 'high',
      company: 'Tech Innovations Ltd',
      assignedTo: 'John Smith',
      reminderDays: 7,
      penalty: 100,
      documents: ['VAT_Q4_Draft.pdf'],
      notes: 'Ensure all invoices are included'
    },
    {
      id: 2,
      title: 'Annual Accounts Filing',
      description: 'File annual accounts with Companies House',
      dueDate: '2024-11-20',
      type: 'filing',
      status: 'upcoming',
      priority: 'critical',
      company: 'Global Solutions Ltd',
      assignedTo: 'Sarah Johnson',
      reminderDays: 14,
      penalty: 750,
      documents: ['Accounts_2024.pdf', 'Directors_Report.pdf'],
      notes: 'Requires board approval'
    },
    {
      id: 3,
      title: 'PAYE Payment November',
      description: 'Monthly PAYE payment to HMRC',
      dueDate: '2024-11-22',
      type: 'payment',
      status: 'upcoming',
      priority: 'high',
      company: 'Tech Innovations Ltd',
      assignedTo: 'John Smith',
      reminderDays: 3,
      penalty: 200,
      documents: [],
      notes: 'Payment reference: 123456789'
    },
    {
      id: 4,
      title: 'Corporation Tax Return',
      description: 'Submit corporation tax return for FY 2023/24',
      dueDate: '2024-11-25',
      type: 'tax',
      status: 'upcoming',
      priority: 'high',
      company: 'Startup Ventures Ltd',
      assignedTo: 'Mike Davis',
      reminderDays: 10,
      penalty: 500,
      documents: ['CT600_Draft.pdf'],
      notes: 'Include R&D tax relief claim'
    },
    {
      id: 5,
      title: 'Confirmation Statement',
      description: 'Annual confirmation statement',
      dueDate: '2024-11-10',
      type: 'filing',
      status: 'overdue',
      priority: 'critical',
      company: 'Tech Innovations Ltd',
      assignedTo: 'John Smith',
      reminderDays: 7,
      penalty: 150,
      documents: [],
      notes: 'URGENT - Already overdue'
    },
    {
      id: 6,
      title: 'P11D Submission',
      description: 'Submit P11D forms for benefits in kind',
      dueDate: '2024-10-30',
      type: 'filing',
      status: 'completed',
      priority: 'medium',
      company: 'Global Solutions Ltd',
      assignedTo: 'Sarah Johnson',
      reminderDays: 14,
      penalty: 0,
      documents: ['P11D_Forms.pdf'],
      notes: 'Completed on time',
      completedDate: '2024-10-28'
    },
  ])

  const getDaysUntilDue = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due - today
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return days
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-300'
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type) => {
    switch(type) {
      case 'tax': return '💷'
      case 'filing': return '📄'
      case 'payment': return '💳'
      case 'report': return '📊'
      case 'governance': return '⚖️'
      case 'compliance': return '✓'
      default: return '📋'
    }
  }

  const filteredDeadlines = deadlines
    .filter(d => {
      const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           d.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           d.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || d.type === filterType
      const matchesStatus = filterStatus === 'all' || d.status === filterStatus
      return matchesSearch && matchesType && matchesStatus
    })
    .sort((a, b) => {
      switch(sortBy) {
        case 'date':
          return new Date(a.dueDate) - new Date(b.dueDate)
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'company':
          return a.company.localeCompare(b.company)
        default:
          return 0
      }
    })

  const stats = {
    total: deadlines.length,
    overdue: deadlines.filter(d => d.status === 'overdue').length,
    upcoming: deadlines.filter(d => d.status === 'upcoming').length,
    completed: deadlines.filter(d => d.status === 'completed').length,
    totalPenaltyRisk: deadlines.filter(d => d.status === 'overdue').reduce((sum, d) => sum + d.penalty, 0)
  }

  const markComplete = (id) => {
    setDeadlines(deadlines.map(d => 
      d.id === id ? { ...d, status: 'completed', completedDate: new Date().toISOString().split('T')[0], penalty: 0 } : d
    ))
  }

  const deleteDeadline = (id) => {
    if (confirm('Are you sure you want to delete this deadline?')) {
      setDeadlines(deadlines.filter(d => d.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Deadline Tracker</h1>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Deadline
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage and track all compliance deadlines</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Penalty Risk</p>
                  <p className="text-2xl font-bold text-red-600">£{stats.totalPenaltyRisk}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search deadlines..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="tax">Tax</option>
                <option value="filing">Filing</option>
                <option value="payment">Payment</option>
                <option value="report">Report</option>
                <option value="governance">Governance</option>
                <option value="compliance">Compliance</option>
              </select>

              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="overdue">Overdue</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>

              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Sort by Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="company">Sort by Company</option>
              </select>

              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deadlines List */}
        <div className="space-y-4">
          {filteredDeadlines.map(deadline => {
            const daysUntil = getDaysUntilDue(deadline.dueDate)
            const isUrgent = daysUntil <= 7 && deadline.status === 'upcoming'

            return (
              <Card key={deadline.id} className={`hover:shadow-lg transition-shadow ${isUrgent ? 'border-orange-500 border-2' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(deadline.type)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{deadline.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{deadline.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">{new Date(deadline.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {deadline.status === 'upcoming' && (
                              <Badge variant="outline" className={daysUntil <= 7 ? 'bg-orange-100 text-orange-800' : ''}>
                                {daysUntil > 0 ? `${daysUntil} days` : 'Today'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Company</p>
                          <p className="text-sm font-medium">{deadline.company}</p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned To</p>
                          <p className="text-sm font-medium">{deadline.assignedTo}</p>
                        </div>
                      </div>

                      {deadline.notes && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">{deadline.notes}</p>
                        </div>
                      )}

                      {deadline.documents.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{deadline.documents.length} document(s)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3 ml-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(deadline.priority)}`}></div>
                        <Badge className={getStatusColor(deadline.status)}>
                          {deadline.status}
                        </Badge>
                      </div>

                      {deadline.penalty > 0 && deadline.status === 'overdue' && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Penalty</p>
                          <p className="text-lg font-bold text-red-600">£{deadline.penalty}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        {deadline.status === 'upcoming' && (
                          <Button size="sm" variant="outline" onClick={() => markComplete(deadline.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteDeadline(deadline.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredDeadlines.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No deadlines found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or add a new deadline</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default DeadlineTrackerPage

