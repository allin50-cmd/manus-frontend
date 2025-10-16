import React, { useState, useEffect } from 'react'
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Users, UserPlus, Mail, Shield, Edit, Trash2, CheckCircle2, XCircle, Clock, MessageSquare, FileText, Calendar } from 'lucide-react'

export default function TeamPage() {
  const [selectedMember, setSelectedMember] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [roles, setRoles] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [membersRes, rolesRes, activitiesRes] = await Promise.all([
          api.request('/api/team/members'),
          api.request('/api/team/roles'),
          api.request('/api/team/activities')
        ]);
        setTeamMembers(membersRes.data);
        setRoles(rolesRes.data);
        setActivities(activitiesRes.data);
      } catch (error) {
        console.error("Failed to fetch team data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
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
  
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex justify-center items-center"><div className="text-white text-2xl">Loading team data...</div></div>;
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
              {!loading && !error && <div className="text-center py-4 text-muted-foreground">No data available.</div>}
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
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Last Active</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center font-bold text-purple-200">
                            {member.avatar}
                          </div>
                          <div>
                            <div className="font-medium text-white">{member.name}</div>
                            <div className="text-sm text-gray-400">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getRoleColor(member.role)}>{member.role}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{member.department}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={member.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}>
                          {member.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{formatLastActive(member.lastActive)}</td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleEditUser(member.id)} className="text-gray-400 hover:text-white">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(member.id)} className="text-gray-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Roles & Permissions */}
          <Card className="lg:col-span-2 bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Roles & Permissions</CardTitle>
              <CardDescription className="text-gray-300">Define roles for your team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map(role => (
                  <div key={role.name} className="p-4 rounded-lg bg-black/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-bold text-lg ${getRoleColor(role.name).split(' ').slice(1).join(' ')}`}>{role.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{role.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {role.permissions.map(p => <Badge key={p} variant="outline" className="text-gray-300 border-gray-500">{p}</Badge>)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{role.count}</div>
                        <div className="text-sm text-gray-400">users</div>
                      </div>
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
              <CardDescription className="text-gray-300">Track recent team activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {activities.map(activity => (
                  <li key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-black/20 flex items-center justify-center mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="text-sm text-white">
                        <span className="font-bold">{activity.user}</span> {activity.action} <span className="font-bold text-purple-300">{activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-400">{formatLastActive(activity.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}