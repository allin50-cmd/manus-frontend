import React, { useState } from 'react'
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Bell, Mail, MessageSquare, AlertTriangle, CheckCircle2, Info, Settings, Filter, Search, Trash2, Archive, Eye } from 'lucide-react'

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const notifications = [
    {
      id: 1,
      type: 'alert',
      title: 'Compliance Deadline Approaching',
      message: 'Annual Accounts Filing for Tech Innovations Ltd is due in 3 days',
      timestamp: '2024-10-16T10:30:00',
      read: false,
      priority: 'high',
      category: 'compliance'
    },
    {
      id: 2,
      type: 'success',
      title: 'Payment Received',
      message: 'Subscription payment of £99 processed successfully',
      timestamp: '2024-10-16T09:15:00',
      read: false,
      priority: 'normal',
      category: 'billing'
    },
    {
      id: 3,
      type: 'info',
      title: 'New Company Added',
      message: 'Enterprise Corp has been added to your portfolio',
      timestamp: '2024-10-16T08:45:00',
      read: true,
      priority: 'normal',
      category: 'system'
    },
    {
      id: 4,
      type: 'alert',
      title: 'High Churn Risk Detected',
      message: 'AI Agent detected high churn risk for Startup Ventures Ltd',
      timestamp: '2024-10-15T16:20:00',
      read: true,
      priority: 'high',
      category: 'ai'
    },
    {
      id: 5,
      type: 'success',
      title: 'Obligation Completed',
      message: 'VAT Return for Global Solutions Ltd has been filed',
      timestamp: '2024-10-15T14:10:00',
      read: true,
      priority: 'normal',
      category: 'compliance'
    },
    {
      id: 6,
      type: 'info',
      title: 'Data Enrichment Complete',
      message: 'Companies House data updated for 5 companies',
      timestamp: '2024-10-15T12:00:00',
      read: true,
      priority: 'low',
      category: 'data'
    },
    {
      id: 7,
      type: 'alert',
      title: 'Storage Limit Warning',
      message: 'You have used 80% of your storage allocation (40GB / 50GB)',
      timestamp: '2024-10-15T10:30:00',
      read: true,
      priority: 'medium',
      category: 'system'
    },
    {
      id: 8,
      type: 'success',
      title: 'Email Campaign Sent',
      message: 'Monthly newsletter sent to 150 contacts with 42% open rate',
      timestamp: '2024-10-15T09:00:00',
      read: true,
      priority: 'normal',
      category: 'marketing'
    }
  ]
  
  const [notificationList, setNotificationList] = useState(notifications)
  
  const notificationSettings = {
    email: {
      compliance_alerts: true,
      payment_updates: true,
      system_updates: false,
      marketing: true,
      ai_insights: true
    },
    push: {
      compliance_alerts: true,
      payment_updates: true,
      system_updates: true,
      marketing: false,
      ai_insights: true
    },
    sms: {
      compliance_alerts: true,
      payment_updates: false,
      system_updates: false,
      marketing: false,
      ai_insights: false
    }
  }
  
  const getIcon = (type) => {
    switch(type) {
      case 'alert': return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'info': return <Info className="w-5 h-5 text-blue-400" />
      default: return <Bell className="w-5 h-5 text-gray-400" />
    }
  }
  
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/50'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    }
  }
  
  const handleMarkAsRead = (id) => {
    setNotificationList(notificationList.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }
  
  const handleMarkAllAsRead = () => {
    setNotificationList(notificationList.map(n => ({ ...n, read: true })))
  }
  
  const handleDelete = (id) => {
    setNotificationList(notificationList.filter(n => n.id !== id))
  }
  
  const handleArchive = (id) => {
    alert(`Archiving notification ${id}...`)
  }
  
  const filteredNotifications = notificationList.filter(n => {
    if (filter === 'unread' && n.read) return false
    if (filter === 'read' && !n.read) return false
    if (searchTerm && !n.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !n.message.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })
  
  const unreadCount = notificationList.filter(n => !n.read).length
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Bell className="w-10 h-10" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">{unreadCount} New</Badge>
              )}
            </h1>
            <p className="text-gray-300">Stay updated with important alerts and updates</p>
          </div>
          <Button
            onClick={handleMarkAllAsRead}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        </div>
        
        {/* Filters and Search */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilter('all')}
                  className={`${filter === 'all' ? 'bg-purple-600' : 'bg-white/10'} hover:bg-purple-700 text-white`}
                >
                  All
                </Button>
                <Button
                  onClick={() => setFilter('unread')}
                  className={`${filter === 'unread' ? 'bg-purple-600' : 'bg-white/10'} hover:bg-purple-700 text-white`}
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  onClick={() => setFilter('read')}
                  className={`${filter === 'read' ? 'bg-purple-600' : 'bg-white/10'} hover:bg-purple-700 text-white`}
                >
                  Read
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Notifications List */}
        <div className="space-y-4 mb-8">
          {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`bg-white/10 backdrop-blur-lg border-white/20 ${!notification.read ? 'ring-2 ring-purple-500/50' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {notification.title}
                          {!notification.read && (
                            <Badge className="ml-2 bg-purple-500 text-white text-xs">New</Badge>
                          )}
                        </h3>
                        <p className="text-gray-300">{notification.message}</p>
                      </div>
                      <Badge className={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{formatTimestamp(notification.timestamp)}</span>
                        <Badge className="bg-white/10 text-gray-300 border-white/20">
                          {notification.category}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {!notification.read && (
                          <Button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="bg-white/10 hover:bg-white/20 text-white text-sm"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        <Button
                          onClick={() => handleArchive(notification.id)}
                          className="bg-white/10 hover:bg-white/20 text-white text-sm"
                          size="sm"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(notification.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredNotifications.length === 0 && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-12 text-center">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No notifications found</h3>
                <p className="text-gray-300">You're all caught up!</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Notification Settings */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription className="text-gray-300">
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Category</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">
                      <Mail className="w-5 h-5 inline mr-1" />
                      Email
                    </th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">
                      <Bell className="w-5 h-5 inline mr-1" />
                      Push
                    </th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">
                      <MessageSquare className="w-5 h-5 inline mr-1" />
                      SMS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(notificationSettings.email).map((category) => (
                    <tr key={category} className="border-b border-white/5">
                      <td className="py-3 px-4 text-white capitalize">
                        {category.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={notificationSettings.email[category]}
                          className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                          readOnly
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={notificationSettings.push[category]}
                          className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                          readOnly
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={notificationSettings.sms[category]}
                          className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                          readOnly
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-end">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

