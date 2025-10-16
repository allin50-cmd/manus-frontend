import React, { useState } from 'react'
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Users, UserPlus, Mail, Shield, Edit, Trash2, CheckCircle2, XCircle, Clock, MessageSquare, FileText, Calendar } from 'lucide-react'

export default function TeamPage() {
  const [selectedMember, setSelectedMember] = useState(null)
  
  const teamMembers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@fineguard.com',
      role: 'Admin',
      department: 'Compliance',
      status: 'active',
      avatar: 'SJ',
      joinedDate: '2024-01-15',
      lastActive: '2024-10-16T11:45:00',
      permissions: ['read', 'write', 'delete', 'admin'],
      companiesAssigned: 15,
      tasksCompleted: 234
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael.chen@fineguard.com',
      role: 'Manager',
      department: 'Operations',
      status: 'active',
      avatar: 'MC',
      joinedDate: '2024-02-20',
      lastActive: '2024-10-16T10:30:00',
      permissions: ['read', 'write', 'delete'],
      companiesAssigned: 12,
      tasksCompleted: 189
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@fineguard.com',
      role: 'Analyst',
      department: 'Compliance',
      status: 'active',
      avatar: 'ER',
      joinedDate: '2024-03-10',
      lastActive: '2024-10-16T09:15:00',
      permissions: ['read', 'write'],
      companiesAssigned: 8,
      tasksCompleted: 156
    },
    {
      id: 4,
      name: 'David Thompson',
      email: 'david.thompson@fineguard.com',
      role: 'Analyst',
      department: 'Risk Management',
      status: 'active',
      avatar: 'DT',
      joinedDate: '2024-04-05',
      lastActive: '2024-10-15T16:20:00',
      permissions: ['read', 'write'],
      companiesAssigned: 10,
      tasksCompleted: 142
    },
    {
      id: 5,
      name: 'Lisa Anderson',
      email: 'lisa.anderson@fineguard.com',
      role: 'Viewer',
      department: 'Finance',
      status: 'active',
      avatar: 'LA',
      joinedDate: '2024-05-15',
      lastActive: '2024-10-16T08:45:00',
      permissions: ['read'],
      companiesAssigned: 0,
      tasksCompleted: 45
    },
    {
      id: 6,
      name: 'James Wilson',
      email: 'james.wilson@fineguard.com',
      role: 'Manager',
      department: 'Compliance',
      status: 'inactive',
      avatar: 'JW',
      joinedDate: '2024-01-20',
      lastActive: '2024-09-30T14:30:00',
      permissions: ['read', 'write'],
      companiesAssigned: 5,
      tasksCompleted: 98
    }
  ]
  
  const roles = [
    {
      name: 'Admin',
      description: 'Full access to all features and settings',
      permissions: ['read', 'write', 'delete', 'admin', 'billing'],
      color: 'red',
      count: 1
    },
    {
      name: 'Manager',
      description: 'Manage companies, users, and workflows',
      permissions: ['read', 'write', 'delete', 'manage_users'],
      color: 'purple',
      count: 2
    },
    {
      name: 'Analyst',
      description: 'View and edit company data',
      permissions: ['read', 'write'],
      color: 'blue',
      count: 2
    },
    {
      name: 'Viewer',
      description: 'Read-only access to data',
      permissions: ['read'],
      color: 'green',
      count: 1
    }
  ]
  
  const activities = [
    {
      id: 1,
      user: 'Sarah Johnson',
      action: 'Updated compliance data',
      target: 'Tech Innovations Ltd',
      timestamp: '2024-10-16T11:45:00',
      type: 'update'
    },
    {
      id: 2,
      user: 'Michael Chen',
      action: 'Added new company',
      target: 'Enterprise Corp',
      timestamp: '2024-10-16T10:30:00',
      type: 'create'
    },
    {
      id: 3,
      user: 'Emily Rodriguez',
      action: 'Completed obligation',
      target: 'VAT Return - Global Solutions Ltd',
      timestamp: '2024-10-16T09:15:00',
      type: 'complete'
    },
    {
      id: 4,
      user: 'David Thompson',
      action: 'Generated risk report',
      target: 'Q3 2024 Risk Assessment',
      timestamp: '2024-10-15T16:20:00',
      type: 'report'
    },
    {
      id: 5,
      user: 'Sarah Johnson',
      action: 'Invited new user',
      target: 'john.doe@fineguard.com',
      timestamp: '2024-10-15T14:10:00',
      type: 'invite'
    }
  ]
  
  const getRoleColor = (role) => {
    switch(role) {
      case 'Admin': return 'bg-red-500/20 text-red-300 border-red-500/50'
      case 'Manager': return 'bg-purple-500/20 text-purple-300 border-purple-500/50'
      case 'Analyst': return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      case 'Viewer': return 'bg-green-500/20 text-green-300 border-green-500/50'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    }
  }
  
  const getActivityIcon = (type) => {
    switch(type) {
      case 'create': return <UserPlus className="w-4 h-4 text-green-400" />
      case 'update': return <Edit className="w-4 h-4 text-blue-400" />
      case 'complete': return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case 'report': return <FileText className="w-4 h-4 text-purple-400" />
      case 'invite': return <Mail className="w-4 h-4 text-blue-400" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }
  
  const formatLastActive = (timestamp) => {
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
  
  const handleInviteUser = () => {
    alert('Opening user invitation form...')
  }
  
  const handleEditUser = (id) => {
    setSelectedMember(teamMembers.find(m => m.id === id))
    alert(`Editing user ${id}...`)
  }
  
  const handleDeleteUser = (id) => {
    if (confirm('Are you sure you want to remove this user?')) {
      alert(`Removing user ${id}...`)
    }
  }
  
  const handleResendInvite = (email) => {
    alert(`Resending invitation to ${email}...`)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="w-10 h-10" />
              Team & Collaboration
            </h1>
            <p className="text-gray-300">Manage team members, roles, and permissions</p>
          </div>
          <Button
            onClick={handleInviteUser}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
        
        {/* Team Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {teamMembers.length}
              </div>
              <div className="text-sm text-gray-300">Team Members</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {teamMembers.filter(m => m.status === 'active').length}
              </div>
              <div className="text-sm text-gray-300">Active Users</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {roles.length}
              </div>
              <div className="text-sm text-gray-300">Roles Defined</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {teamMembers.reduce((sum, m) => sum + m.tasksCompleted, 0)}
              </div>
              <div className="text-sm text-gray-300">Tasks Completed</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Team Members */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Team Members</CardTitle>
            <CardDescription className="text-gray-300">
              Manage your team members and their access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">User</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Role</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Department</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">Status</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Companies</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Tasks</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Last Active</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                            {member.avatar}
                          </div>
                          <div>
                            <div className="text-white font-medium">{member.name}</div>
                            <div className="text-sm text-gray-400">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getRoleColor(member.role)}>
                          {member.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{member.department}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={member.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-gray-500/20 text-gray-300 border-gray-500/50'}>
                          {member.status === 'active' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {member.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-white">{member.companiesAssigned}</td>
                      <td className="py-3 px-4 text-right text-white">{member.tasksCompleted}</td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {formatLastActive(member.lastActive)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={() => handleEditUser(member.id)}
                            className="bg-white/10 hover:bg-white/20 text-white"
                            size="sm"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteUser(member.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-300"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roles & Permissions */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Roles & Permissions</CardTitle>
              <CardDescription className="text-gray-300">
                Defined roles and their access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                            {role.count} {role.count === 1 ? 'user' : 'users'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-300 mb-3">{role.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((perm, idx) => (
                        <Badge key={idx} className="bg-blue-500/20 text-blue-300 border-blue-500/50 text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-gray-300">
                Latest team member actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium mb-1">
                        {activity.user}
                      </div>
                      <div className="text-sm text-gray-300 mb-1">
                        {activity.action}: <span className="text-purple-300">{activity.target}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatLastActive(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

