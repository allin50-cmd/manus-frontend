import React from 'react';
import { ArrowLeft, User, Mail, Building, Shield, Calendar, LogOut } from 'lucide-react';
import { type UserProfile } from '../utils/api';

interface UserSettingsProps {
  user: UserProfile;
  onBack: () => void;
  onLogout: () => void;
}

export default function UserSettings({ user, onBack, onLogout }: UserSettingsProps) {
  const formatDate = (d?: string) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return 'N/A'; }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-blue-400 hover:text-white transition mb-8">
        <ArrowLeft size={20} /> Dashboard
      </button>

      <h1 className="text-3xl font-black text-white mb-8">Account Settings</h1>

      {/* Profile card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-6">
        <h2 className="text-lg font-bold text-white mb-6">Profile</h2>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Name</p>
              <p className="text-white font-semibold">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Mail size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Email</p>
              <p className="text-white font-semibold">{user.email}</p>
            </div>
          </div>
          {user.company && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Building size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Company</p>
                <p className="text-white font-semibold">{user.company}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Calendar size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Member since</p>
              <p className="text-white font-semibold">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-6">
        <h2 className="text-lg font-bold text-white mb-6">Subscription</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Shield size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold capitalize">{user.plan} Plan</p>
              <p className="text-slate-500 text-sm">
                {user.plan === 'free' ? 'Monitor up to 3 companies' :
                 user.plan === 'pro' ? 'Unlimited companies + priority alerts' :
                 'Full API access + dedicated support'}
              </p>
            </div>
          </div>
          {user.plan === 'free' && (
            <button className="bg-blue-500 text-navy px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
        <h2 className="text-lg font-bold text-red-400 mb-4">Session</h2>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition font-semibold"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}
