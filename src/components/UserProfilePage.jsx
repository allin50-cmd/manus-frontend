import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Calendar, Activity, Settings, Bell, Lock, CreditCard } from 'lucide-react';

const UserProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const user = {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+44 20 1234 5678',
    location: 'London, UK',
    joinDate: '2024-01-15',
    role: 'Business Owner',
    company: 'ABC Ltd'
  };

  const activities = [
    { id: 1, action: 'Logged in', timestamp: '2024-10-16 09:30', ip: '192.168.1.1' },
    { id: 2, action: 'Updated profile', timestamp: '2024-10-15 14:20', ip: '192.168.1.1' },
    { id: 3, action: 'Generated report', timestamp: '2024-10-15 11:45', ip: '192.168.1.1' }
  ];

  const renderTabContent = () => {
    switch(activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input type="text" defaultValue={user.name} className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" defaultValue={user.email} className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input type="tel" defaultValue={user.phone} className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input type="text" defaultValue={user.location} className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <input type="text" defaultValue={user.role} className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <input type="text" defaultValue={user.company} className="w-full p-3 border rounded-lg" />
              </div>
            </div>
            <Button>Save Changes</Button>
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{activity.ip}</span>
              </div>
            ))}
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email updates</p>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive push notifications</p>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Extra security for your account</p>
                </div>
              </div>
              <Button size="sm">Enable</Button>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">Professional</p>
                    <p className="text-muted-foreground">£299/month</p>
                  </div>
                  <Button>Upgrade</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/25</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {user.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 font-medium ${activeTab === 'activity' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 font-medium ${activeTab === 'preferences' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Preferences
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 font-medium ${activeTab === 'billing' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Billing
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          {renderTabContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;

