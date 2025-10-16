import React, { useState, useEffect } from 'react'
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Bell, Mail, MessageSquare, AlertTriangle, CheckCircle2, Info, Settings, Filter, Search, Trash2, Archive, Eye } from 'lucide-react'

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [notificationList, setNotificationList] = useState([])
  const [notificationSettings, setNotificationSettings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data } = await api.request('get', '/api/notifications');
        setNotificationList(data);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchNotificationSettings = async () => {
      try {
        const { data } = await api.request('get', '/api/notification-settings');
        setNotificationSettings(data);
      } catch (error) {
        console.error("Failed to fetch notification settings", error);
      }
    };

    fetchNotifications();
    fetchNotificationSettings();
  }, []);

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

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex justify-center items-center"><h2 className="text-white text-2xl">Loading notifications...</h2></div>
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
                          className="bg-red-500/20 hover:bg-red-500/40 text-red-300 text-sm"
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
        </div>

        {/* Notification Settings */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-3
            "><Settings className="w-6 h-6" /> Notification Settings</CardTitle>
            <CardDescription className="text-gray-300">Manage how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
              {Object.keys(notificationSettings).map(method => (
                <div key={method}>
                  <h3 className="text-lg font-semibold capitalize flex items-center gap-2 mb-3">
                    {method === 'email' && <Mail className="w-5 h-5" />}
                    {method === 'push' && <Bell className="w-5 h-5" />}
                    {method === 'sms' && <MessageSquare className="w-5 h-5" />}
                    {method}
                  </h3>
                  <div className="space-y-2">
                    {Object.keys(notificationSettings[method]).map(type => (
                      <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <span className="text-gray-300 capitalize">{type.replace(/_/g, ' ')}</span>
                        <label className="switch">
                          <input type="checkbox" defaultChecked={notificationSettings[method][type]} />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
