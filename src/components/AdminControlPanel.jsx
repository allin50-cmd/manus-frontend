import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Settings, Database, Activity, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const AdminControlPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // State for Overview stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCompanies: 0,
    systemHealth: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // State for Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);

  // State for System Logs
  const [systemLogs, setSystemLogs] = useState([]);
  const [systemLogsLoading, setSystemLogsLoading] = useState(true);
  const [systemLogsError, setSystemLogsError] = useState(null);

  // Fetch Overview Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const response = await api.request({
          url: '/admin/stats',
          method: 'GET',
        });
        setStats(response);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStatsError('Failed to load stats.');
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const response = await api.request({
          url: '/admin/users',
          method: 'GET',
        });
        setUsers(response);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsersError('Failed to load users.');
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch System Logs
  useEffect(() => {
    const fetchSystemLogs = async () => {
      try {
        setSystemLogsLoading(true);
        const response = await api.request({
          url: '/admin/logs',
          method: 'GET',
        });
        setSystemLogs(response);
      } catch (error) {
        console.error('Error fetching system logs:', error);
        setSystemLogsError('Failed to load system logs.');
      } finally {
        setSystemLogsLoading(false);
      }
    };
    fetchSystemLogs();
  }, []);

  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        if (statsLoading) return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Loading stats...</p></div>;
        if (statsError) return <div className="text-red-500 text-center py-4">Error: {statsError}</div>;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-3xl font-bold">{stats.activeUsers}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Companies</p>
                    <p className="text-3xl font-bold">{stats.totalCompanies}</p>
                  </div>
                  <Database className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">System Health</p>
                    <p className="text-3xl font-bold">{stats.systemHealth}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'users':
        if (usersLoading) return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Loading users...</p></div>;
        if (usersError) return <div className="text-red-500 text-center py-4">Error: {usersError}</div>;
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">User Management</h3>
              <Button>Add User</Button>
            </div>
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground">No users found.</p>
            ) : (
              users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.status}
                    </span>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Site Name</label>
                <input type="text" defaultValue="FineGuard" className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Admin Email</label>
                <input type="email" defaultValue="admin@fineguard.com" className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Upload Size (MB)</label>
                <input type="number" defaultValue="50" className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                <input type="number" defaultValue="30" className="w-full p-3 border rounded-lg" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Temporarily disable site access</p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">Debug Mode</p>
                  <p className="text-sm text-muted-foreground">Show detailed error messages</p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
            </div>
            <Button>Save Settings</Button>
          </div>
        );

      case 'logs':
        if (systemLogsLoading) return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Loading logs...</p></div>;
        if (systemLogsError) return <div className="text-red-500 text-center py-4">Error: {systemLogsError}</div>;
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">System Logs</h3>
              <Button size="sm">Clear Logs</Button>
            </div>
            {systemLogs.length === 0 ? (
              <p className="text-center text-muted-foreground">No system logs found.</p>
            ) : (
              systemLogs.map(log => (
                <div key={log.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {log.type === 'info' && <CheckCircle className="h-5 w-5 text-blue-500" />}
                  {log.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                  {log.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                  <div className="flex-1">
                    <p className="font-semibold">{log.message}</p>
                    <p className="text-sm text-muted-foreground">{log.timestamp}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    log.type === 'info' ? 'bg-blue-100 text-blue-700' :
                    log.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {log.type}
                  </span>
                </div>
              ))
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin Control Panel</h1>
          <p className="text-muted-foreground">Manage system settings and users</p>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium ${activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium ${activeTab === 'logs' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Logs
        </button>
      </div>

      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminControlPanel;
