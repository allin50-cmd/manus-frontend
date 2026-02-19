import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../utils/api';
import { toast } from 'sonner';
import {
  User, Mail, Building2, Calendar, Shield, CreditCard,
  Key, Bell, LogOut, ChevronRight, ArrowLeft, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clsx } from 'clsx';

export default function Profile() {
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'notifications' | 'billing'>('profile');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileCompany, setProfileCompany] = useState(user?.company || '');
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated || !user) {
    setLocation('/login');
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  const menuItems = [
    { id: 'profile' as const, label: 'Personal Info', icon: User },
    { id: 'security' as const, label: 'Security', icon: Key },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  ];

  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'N/A';

  return (
    <div className="min-h-screen">
      <section className="py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center gap-6 mb-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5A4BFF] to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-[#5A4BFF]/25">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{user.name}</h1>
              <p className="text-slate-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs bg-[#5A4BFF]/20 text-[#5A4BFF] px-2 py-0.5 rounded-full font-bold">{user.plan || 'Starter'}</span>
                <span className="text-xs text-slate-500">Member since {memberSince}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Menu */}
            <div className="lg:col-span-1">
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left',
                      activeSection === item.id
                        ? 'bg-[#5A4BFF]/10 text-[#5A4BFF] border border-[#5A4BFF]/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                ))}
                <div className="border-t border-white/10 my-3" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {activeSection === 'profile' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <Label className="text-slate-300 mb-1.5 block">Full Name</Label>
                        <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                      </div>
                      <div>
                        <Label className="text-slate-300 mb-1.5 block">Email</Label>
                        <Input defaultValue={user.email} type="email" disabled className="bg-white/5 border-white/10 text-slate-500" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-300 mb-1.5 block">Company</Label>
                      <Input value={profileCompany} onChange={(e) => setProfileCompany(e.target.value)} placeholder="Your company name" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <Label className="text-slate-300 mb-1.5 block">Role</Label>
                        <Input defaultValue={user.role || 'User'} disabled className="bg-white/5 border-white/10 text-slate-500" />
                      </div>
                      <div>
                        <Label className="text-slate-300 mb-1.5 block">Plan</Label>
                        <Input defaultValue={user.plan || 'Starter'} disabled className="bg-white/5 border-white/10 text-slate-500" />
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button
                        disabled={saving}
                        onClick={async () => {
                          setSaving(true);
                          try {
                            await updateProfile({ name: profileName, company: profileCompany });
                            await refreshUser();
                            toast.success('Profile updated!');
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Failed to update profile');
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-6 rounded-full font-bold"
                      >
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-white mb-6">Change Password</h2>
                    <div className="space-y-5 max-w-md">
                      <div>
                        <Label className="text-slate-300 mb-1.5 block">Current Password</Label>
                        <Input type="password" placeholder="Enter current password" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                      </div>
                      <div>
                        <Label className="text-slate-300 mb-1.5 block">New Password</Label>
                        <Input type="password" placeholder="Enter new password" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                      </div>
                      <div>
                        <Label className="text-slate-300 mb-1.5 block">Confirm New Password</Label>
                        <Input type="password" placeholder="Confirm new password" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                      </div>
                      <Button onClick={() => toast.success('Password updated!')} className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-6 rounded-full font-bold">
                        Update Password
                      </Button>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-white mb-2">Two-Factor Authentication</h2>
                    <p className="text-sm text-slate-400 mb-4">Add an extra layer of security to your account.</p>
                    <Button className="bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-full font-bold">
                      <Shield className="w-4 h-4 mr-2" /> Enable 2FA
                    </Button>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Filing deadline alerts', desc: 'Get notified when filing deadlines are approaching', default: true },
                      { label: 'Overdue filing warnings', desc: 'Immediate alert when a filing becomes overdue', default: true },
                      { label: 'Director/PSC changes', desc: 'Notifications when director or PSC changes are detected', default: true },
                      { label: 'Weekly compliance digest', desc: 'Summary email of your portfolio compliance status', default: false },
                      { label: 'Product updates', desc: 'New features and platform announcements', default: false },
                    ].map((pref) => (
                      <div key={pref.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-white">{pref.label}</p>
                          <p className="text-xs text-slate-400">{pref.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked={pref.default} className="sr-only peer" />
                          <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:bg-[#5A4BFF] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'billing' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-[#5A4BFF]/10 to-indigo-600/10 border border-[#5A4BFF]/20 rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-white">Current Plan</h2>
                      <span className="text-sm bg-[#5A4BFF]/20 text-[#5A4BFF] px-3 py-1 rounded-full font-bold">{user.plan || 'Starter'}</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-6">
                      {user.plan === 'professional' ? 'Monitor up to 100 companies with advanced features.'
                        : user.plan === 'enterprise' ? 'Unlimited monitoring with dedicated support.'
                        : 'Free plan with up to 3 monitored companies.'}
                    </p>
                    <a href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5A4BFF] text-white rounded-full font-bold text-sm hover:bg-[#6B5BFF] transition-colors">
                      Upgrade Plan <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-white mb-4">Payment Method</h2>
                    <p className="text-sm text-slate-400 mb-4">No payment method on file.</p>
                    <Button className="bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-full font-bold">
                      <CreditCard className="w-4 h-4 mr-2" /> Add Payment Method
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
