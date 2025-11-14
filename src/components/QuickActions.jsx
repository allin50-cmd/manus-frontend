import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, FileText, Bell, Download, Search } from 'lucide-react'

const QuickActions = ({ onAction }) => {
  const actions = [
    {
      id: 'add-fine',
      label: 'Add New Fine',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Record a new fine or deadline'
    },
    {
      id: 'view-calendar',
      label: 'View Calendar',
      icon: Calendar,
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'See all deadlines at a glance'
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: FileText,
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Create fine summary report'
    },
    {
      id: 'manage-notifications',
      label: 'Notifications',
      icon: Bell,
      color: 'bg-orange-600 hover:bg-orange-700',
      description: 'Configure alert settings'
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: Download,
      color: 'bg-teal-600 hover:bg-teal-700',
      description: 'Download fines to CSV/PDF'
    },
    {
      id: 'search-fines',
      label: 'Search Fines',
      icon: Search,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      description: 'Find specific fines quickly'
    }
  ]

  const handleAction = (actionId) => {
    if (onAction) {
      onAction(actionId)
    } else {
      console.log(`Action triggered: ${actionId}`)
      // Default behavior - could navigate to specific pages
      switch (actionId) {
        case 'view-calendar':
          window.location.hash = '#compliance-calendar'
          break
        case 'generate-report':
          window.location.hash = '#reports-dashboard'
          break
        case 'manage-notifications':
          window.location.hash = '#notifications-settings'
          break
        default:
          alert(`${actionId} feature coming soon!`)
      }
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group"
                title={action.description}
              >
                <div className={`${action.color} p-3 rounded-lg mb-2 transition-transform group-hover:scale-110`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">
                  {action.label}
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickActions

