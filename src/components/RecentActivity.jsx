import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, FileText, CheckCircle, AlertCircle, Bell, User } from 'lucide-react'

const RecentActivity = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'create':
        return FileText
      case 'update':
        return CheckCircle
      case 'notification':
        return Bell
      case 'alert':
        return AlertCircle
      default:
        return User
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'create':
        return 'bg-green-100 text-green-600'
      case 'update':
        return 'bg-blue-100 text-blue-600'
      case 'notification':
        return 'bg-purple-100 text-purple-600'
      case 'alert':
        return 'bg-red-100 text-red-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Default activities if none provided
  const defaultActivities = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      user: 'Sarah Johnson',
      action: 'Updated fine',
      details: 'Marked "Annual Confirmation Statement" as in progress',
      type: 'update'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: 'Michael Chen',
      action: 'Added document',
      details: 'Uploaded VAT Return Q3 2024.pdf',
      type: 'create'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      user: 'System',
      action: 'Sent notification',
      details: 'Email reminder sent for PAYE/NIC Payment deadline',
      type: 'notification'
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 21600000).toISOString(),
      user: 'Emma Williams',
      action: 'Created fine',
      details: 'Added new fine: Corporation Tax Payment',
      type: 'create'
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 28800000).toISOString(),
      user: 'System',
      action: 'Alert',
      details: 'Fine deadline approaching: Building Control Inspection',
      type: 'alert'
    }
  ]

  const displayActivities = activities || defaultActivities

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Recent Activity</CardTitle>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.slice(0, 5).map((activity) => {
            const Icon = getActivityIcon(activity.type)
            const colorClass = getActivityColor(activity.type)
            
            return (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className={`${colorClass} p-2 rounded-lg flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.details}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {activity.user}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {displayActivities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivity

