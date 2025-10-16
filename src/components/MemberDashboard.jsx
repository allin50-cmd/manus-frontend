import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Crown, User, CreditCard, Settings, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

const MemberDashboard = ({ user, onLogout, onUpgrade }) => {
  const [subscriptionTiers, setSubscriptionTiers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubscriptionTiers = async () => {
      try {
        setLoading(true);
        const response = await api.request('/api/subscription-tiers', { method: 'GET' });
        setSubscriptionTiers(response.data);
      } catch (err) {
        setError('Failed to fetch subscription tiers.');
        console.error('Error fetching subscription tiers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionTiers();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading subscription details...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">{error}</div>;
  }

  const currentTier = subscriptionTiers[user.subscription || 'free'];

  if (!currentTier) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">Subscription tier data not available.</div>;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
              <p className="text-white/80">Manage your FineGuard subscription and settings</p>
            </div>
            <div className="text-6xl">{currentTier.icon}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Account Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Subscription Status */}
            <div className="border-2 border-cyan-400/30 rounded-2xl p-6 bg-background/50 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5 text-cyan-500" />
                Current Subscription
              </h2>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className={`text-2xl font-bold ${currentTier.color} mb-1`}>
                    {currentTier.name} Plan
                  </div>
                  {currentTier.price && (
                    <div className="text-muted-foreground">
                      {currentTier.price}/month
                    </div>
                  )}
                </div>
                {user.subscription === 'free' && (
                  <button
                    onClick={onUpgrade}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Upgrade Now
                  </button>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h3 className="font-semibold mb-2">Your Features:</h3>
                {user.subscription === 'free' ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Up to 1 company</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Basic compliance tracking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>AI features not included</span>
                    </div>
                  </>
                ) : user.subscription === 'starter' ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Up to 1 company</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Email alerts</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>AI compliance checklists</span>
                    </div>
                  </>
                ) : user.subscription === 'pro' ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Up to 5 companies</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>AI-powered insights</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Priority support</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Risk scoring</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Unlimited companies</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Dedicated account manager</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>White-label option</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>API access</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Account Details */}
            <div className="border-2 border-cyan-400/30 rounded-2xl p-6 bg-background/50 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-500" />
                Account Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Name</label>
                  <div className="font-medium">{user.name}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <div className="font-medium">{user.email}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Member Since</label>
                  <div className="font-medium">{new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="border-2 border-cyan-400/30 rounded-2xl p-6 bg-background/50 backdrop-blur">
              <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
              
              <div className="space-y-2">
                <button className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-cyan-500" />
                  <span>Billing & Payments</span>
                </button>
                <button className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors flex items-center gap-3">
                  <Settings className="h-5 w-5 text-cyan-500" />
                  <span>Account Settings</span>
                </button>
                {user.subscription !== 'ultimate' && (
                  <button
                    onClick={onUpgrade}
                    className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors flex items-center gap-3 border border-cyan-400/30"
                  >
                    <Crown className="h-5 w-5 text-amber-500" />
                    <span className="text-cyan-500 font-semibold">Upgrade Plan</span>
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="w-full p-3 text-left hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-3 text-red-500"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Support */}
            <div className="border-2 border-cyan-400/30 rounded-2xl p-6 bg-background/50 backdrop-blur">
              <h2 className="text-lg font-bold mb-4">Need Help?</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Our support team is here to help you with any questions.
              </p>
              <button className="w-full py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;