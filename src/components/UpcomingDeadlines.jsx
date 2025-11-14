import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, AlertTriangle, Clock, Building2, DollarSign } from 'lucide-react'

const UpcomingDeadlines = ({ deadlines }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getDaysUntil = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatDaysUntil = (days) => {
    if (days < 0) return `${Math.abs(days)} days overdue`
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    if (days <= 7) return `${days} days left`
    if (days <= 30) return `${Math.ceil(days / 7)} weeks left`
    return `${Math.ceil(days / 30)} months left`
  }

  const getUrgencyIcon = (days) => {
    if (days < 0) return <AlertTriangle className="w-4 h-4 text-red-600" />
    if (days <= 7) return <Clock className="w-4 h-4 text-orange-600" />
    return <Calendar className="w-4 h-4 text-blue-600" />
  }

  // Default deadlines if none provided
  const defaultDeadlines = [
    {
      id: 1,
      title: 'Corporation Tax Payment',
      companyName: 'Manchester Retail Group PLC',
      dueDate: '2024-11-30',
      potentialFine: 2000,
      priority: 'critical',
      authority: 'HMRC'
    },
    {
      id: 2,
      title: 'PAYE/NIC Payment',
      companyName: 'Manchester Retail Group PLC',
      dueDate: '2024-11-22',
      potentialFine: 500,
      priority: 'critical',
      authority: 'HMRC'
    },
    {
      id: 3,
      title: 'Building Control Inspection',
      companyName: 'Cardiff Property Developments',
      dueDate: '2024-11-20',
      potentialFine: 1200,
      priority: 'high',
      authority: 'Local Authority'
    },
    {
      id: 4,
      title: 'Health & Safety Report',
      companyName: 'Birmingham Manufacturing Co',
      dueDate: '2024-12-15',
      potentialFine: 1500,
      priority: 'high',
      authority: 'HSE'
    },
    {
      id: 5,
      title: 'Environmental Permit Renewal',
      companyName: 'Birmingham Manufacturing Co',
      dueDate: '2024-12-20',
      potentialFine: 800,
      priority: 'medium',
      authority: 'Environment Agency'
    },
    {
      id: 6,
      title: 'Annual Confirmation Statement',
      companyName: 'Thames Digital Solutions Ltd',
      dueDate: '2024-12-31',
      potentialFine: 750,
      priority: 'medium',
      authority: 'Companies House'
    }
  ]

  const displayDeadlines = (deadlines || defaultDeadlines)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Upcoming Deadlines</CardTitle>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayDeadlines.map((deadline) => {
            const daysUntil = getDaysUntil(deadline.dueDate)
            const isOverdue = daysUntil < 0
            const isUrgent = daysUntil >= 0 && daysUntil <= 7
            
            return (
              <div
                key={deadline.id}
                className={`p-4 rounded-lg border-2 ${
                  isOverdue ? 'bg-red-50 border-red-200' :
                  isUrgent ? 'bg-orange-50 border-orange-200' :
                  'bg-white border-gray-200'
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(deadline.priority)}`}>
                        {deadline.priority.toUpperCase()}
                      </span>
                      {getUrgencyIcon(daysUntil)}
                      <span className={`text-xs font-medium ${
                        isOverdue ? 'text-red-700' :
                        isUrgent ? 'text-orange-700' :
                        'text-gray-600'
                      }`}>
                        {formatDaysUntil(daysUntil)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {deadline.title}
                    </h4>
                    <div className="flex flex-col gap-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate">{deadline.companyName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(deadline.dueDate).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-medium">£{deadline.potentialFine.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {deadline.authority}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {displayDeadlines.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No upcoming deadlines</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default UpcomingDeadlines

