import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Clock, TrendingUp, DollarSign, Calendar } from 'lucide-react'

const QuickStatsCards = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Active Fines',
      value: stats?.activeFines || 0,
      icon: AlertCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+2 this week',
      changeType: 'neutral'
    },
    {
      title: 'Overdue Fines',
      value: stats?.overdueFines || 0,
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: stats?.overdueFines > 0 ? 'Requires attention' : 'All up to date',
      changeType: stats?.overdueFines > 0 ? 'negative' : 'positive'
    },
    {
      title: 'Total Fine Value',
      value: `£${(stats?.totalFineValue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: 'Potential penalties',
      changeType: 'neutral'
    },
    {
      title: 'Fine Risk Score',
      value: stats?.avgFineRiskScore || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: stats?.avgFineRiskScore >= 80 ? 'Good standing' : 'Needs improvement',
      changeType: stats?.avgFineRiskScore >= 80 ? 'positive' : 'negative',
      suffix: '/100'
    },
    {
      title: 'Upcoming Deadlines',
      value: stats?.upcomingDeadlines || 0,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: 'Next 30 days',
      changeType: 'neutral'
    },
    {
      title: 'Completed This Month',
      value: stats?.completedFines || 0,
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      change: '+5 from last month',
      changeType: 'positive'
    }
  ]

  const getChangeColor = (type) => {
    switch (type) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </h3>
                    {stat.suffix && (
                      <span className="text-lg text-gray-500">{stat.suffix}</span>
                    )}
                  </div>
                  <p className={`text-xs mt-2 ${getChangeColor(stat.changeType)}`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default QuickStatsCards

