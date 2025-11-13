import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Search, Filter, Download, Calendar, User, Activity, FileText, Edit, Trash2, Plus, CheckCircle2, AlertTriangle, Eye, Lock, Unlock, Upload, Settings } from 'lucide-react'

const AuditTrailPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [filterUser, setFilterUser] = useState('all')
  const [dateRange, setDateRange] = useState('7days')

  // Sample audit log entries
  const auditLogs = [
    {
      id: 1,
      timestamp: '2024-11-13 14:32:15',
      user: 'John Smith',
      action: 'document_upload',
      actionLabel: 'Document Uploaded',
      resource: 'VAT_Return_Q4_2024.pdf',
      resourceType: 'document',
      details: 'Uploaded VAT return document for Q4 2024',
      ipAddress: '192.168.1.100',
      status: 'success',
      severity: 'info'
    },
    {
      id: 2,
      timestamp: '2024-11-13 14:15:42',
      user: 'Sarah Johnson',
      action: 'deadline_completed',
      actionLabel: 'Deadline Completed',
      resource: 'Annual Accounts Filing',
      resourceType: 'deadline',
      details: 'Marked annual accounts filing as completed',
      ipAddress: '192.168.1.101',
      status: 'success',
      severity: 'info'
    },
    {
      id: 3,
      timestamp: '2024-11-13 13:45:20',
      user: 'Mike Davis',
      action: 'user_login',
      actionLabel: 'User Login',
      resource: 'System',
      resourceType: 'system',
      details: 'User logged in successfully',
      ipAddress: '192.168.1.102',
      status: 'success',
      severity: 'info'
    },
    {
      id: 4,
      timestamp: '2024-11-13 12:30:55',
      user: 'John Smith',
      action: 'document_deleted',
      actionLabel: 'Document Deleted',
      resource: 'Old_Contract_2023.pdf',
      resourceType: 'document',
      details: 'Permanently deleted expired contract document',
      ipAddress: '192.168.1.100',
      status: 'success',
      severity: 'warning'
    },
    {
      id: 5,
      timestamp: '2024-11-13 11:20:33',
      user: 'Sarah Johnson',
      action: 'settings_changed',
      actionLabel: 'Settings Changed',
      resource: 'Notification Settings',
      resourceType: 'settings',
      details: 'Updated email notification preferences',
      ipAddress: '192.168.1.101',
      status: 'success',
      severity: 'info'
    },
    {
      id: 6,
      timestamp: '2024-11-13 10:15:18',
      user: 'System',
      action: 'reminder_sent',
      actionLabel: 'Reminder Sent',
      resource: 'VAT Return Q4',
      resourceType: 'notification',
      details: 'Automated reminder sent for upcoming VAT deadline',
      ipAddress: 'System',
      status: 'success',
      severity: 'info'
    },
    {
      id: 7,
      timestamp: '2024-11-13 09:45:22',
      user: 'Mike Davis',
      action: 'login_failed',
      actionLabel: 'Login Failed',
      resource: 'System',
      resourceType: 'system',
      details: 'Failed login attempt - incorrect password',
      ipAddress: '192.168.1.102',
      status: 'failed',
      severity: 'warning'
    },
    {
      id: 8,
      timestamp: '2024-11-13 09:30:10',
      user: 'John Smith',
      action: 'document_shared',
      actionLabel: 'Document Shared',
      resource: 'Annual_Report_2024.pdf',
      resourceType: 'document',
      details: 'Shared document with external auditor',
      ipAddress: '192.168.1.100',
      status: 'success',
      severity: 'info'
    },
    {
      id: 9,
      timestamp: '2024-11-13 08:15:45',
      user: 'Sarah Johnson',
      action: 'deadline_created',
      actionLabel: 'Deadline Created',
      resource: 'Corporation Tax Return',
      resourceType: 'deadline',
      details: 'Created new deadline for corporation tax return',
      ipAddress: '192.168.1.101',
      status: 'success',
      severity: 'info'
    },
    {
      id: 10,
      timestamp: '2024-11-12 16:45:30',
      user: 'Admin',
      action: 'user_created',
      actionLabel: 'User Created',
      resource: 'Emma Wilson',
      resourceType: 'user',
      details: 'New user account created with standard permissions',
      ipAddress: '192.168.1.1',
      status: 'success',
      severity: 'info'
    },
    {
      id: 11,
      timestamp: '2024-11-12 15:20:15',
      user: 'System',
      action: 'backup_completed',
      actionLabel: 'Backup Completed',
      resource: 'Database',
      resourceType: 'system',
      details: 'Automated daily backup completed successfully',
      ipAddress: 'System',
      status: 'success',
      severity: 'info'
    },
    {
      id: 12,
      timestamp: '2024-11-12 14:10:05',
      user: 'Mike Davis',
      action: 'document_locked',
      actionLabel: 'Document Locked',
      resource: 'Financial_Statements_2024.xlsx',
      resourceType: 'document',
      details: 'Locked document to prevent unauthorized changes',
      ipAddress: '192.168.1.102',
      status: 'success',
      severity: 'warning'
    },
  ]

  const getActionIcon = (action) => {
    switch(action) {
      case 'document_upload': return <Upload className="w-4 h-4" />
      case 'document_deleted': return <Trash2 className="w-4 h-4" />
      case 'document_shared': return <FileText className="w-4 h-4" />
      case 'document_locked': return <Lock className="w-4 h-4" />
      case 'deadline_completed': return <CheckCircle2 className="w-4 h-4" />
      case 'deadline_created': return <Plus className="w-4 h-4" />
      case 'user_login': return <User className="w-4 h-4" />
      case 'login_failed': return <AlertTriangle className="w-4 h-4" />
      case 'settings_changed': return <Settings className="w-4 h-4" />
      case 'user_created': return <User className="w-4 h-4" />
      case 'reminder_sent': return <Calendar className="w-4 h-4" />
      case 'backup_completed': return <Activity className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'success': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'success': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'pending': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = filterAction === 'all' || log.action === filterAction
    const matchesUser = filterUser === 'all' || log.user === filterUser
    return matchesSearch && matchesAction && matchesUser
  })

  const uniqueUsers = [...new Set(auditLogs.map(log => log.user))]
  const uniqueActions = [...new Set(auditLogs.map(log => log.action))]

  const stats = {
    total: auditLogs.length,
    today: auditLogs.filter(log => {
      const logDate = new Date(log.timestamp).toDateString()
      const today = new Date().toDateString()
      return logDate === today
    }).length,
    failed: auditLogs.filter(log => log.status === 'failed').length,
    critical: auditLogs.filter(log => log.severity === 'critical' || log.severity === 'warning').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Trail</h1>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Complete activity log of all system actions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Failed Actions</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.critical}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search audit logs..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                ))}
              </select>

              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              >
                <option value="all">All Users</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>

              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>Showing {filteredLogs.length} events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLogs.map((log, index) => (
                <div key={log.id} className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(log.severity)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    {index < filteredLogs.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2"></div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 pb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{log.actionLabel}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{log.details}</p>
                        </div>
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">User</p>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="font-medium">{log.user}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Resource</p>
                          <span className="font-medium">{log.resource}</span>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timestamp</p>
                          <span className="font-medium">{log.timestamp}</span>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                          <span className={`font-medium ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>IP: {log.ipAddress}</span>
                        <span>Type: {log.resourceType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No events found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AuditTrailPage

