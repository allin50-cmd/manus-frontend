import React from 'react'
import { Activity, TrendingUp, Users, FileText } from 'lucide-react'

const ActivityDashboardPage = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Activity Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Activities', value: '1,234', icon: Activity, color: 'blue' },
          { label: 'Active Users', value: '45', icon: Users, color: 'green' },
          { label: 'Documents', value: '567', icon: FileText, color: 'purple' },
          { label: 'Trends', value: '+12%', icon: TrendingUp, color: 'orange' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ActivityDashboardPage
