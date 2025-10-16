import React, { useState, useEffect } from 'react'
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { CreditCard, Download, Calendar, CheckCircle2, XCircle, AlertCircle, DollarSign, FileText, Clock, Loader2 } from 'lucide-react'

export default function BillingPage({ user }) {
  const [currentPlan, setCurrentPlan] = useState('Professional')
  const [billingCycle, setBillingCycle] = useState('monthly')

  const [subscriptionData, setSubscriptionData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [usageStats, setUsageStats] = useState([]);

  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingUsageStats, setLoadingUsageStats] = useState(true);

  const [errorSubscription, setErrorSubscription] = useState(null);
  const [errorPlans, setErrorPlans] = useState(null);
  const [errorInvoices, setErrorInvoices] = useState(null);
  const [errorUsageStats, setErrorUsageStats] = useState(null);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setLoadingSubscription(true);
        const response = await api.get('/api/subscription');
        setSubscriptionData(response);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        setErrorSubscription('Failed to load subscription data.');
      } finally {
        setLoadingSubscription(false);
      }
    };

    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const response = await api.get('/api/plans');
        setPlans(response);
      } catch (error) {
        console.error('Error fetching plans:', error);
        setErrorPlans('Failed to load plans.');
      } finally {
        setLoadingPlans(false);
      }
    };

    const fetchInvoices = async () => {
      try {
        setLoadingInvoices(true);
        const response = await api.get('/api/invoices');
        setInvoices(response);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setErrorInvoices('Failed to load invoices.');
      } finally {
        setLoadingInvoices(false);
      }
    };

    const fetchUsageStats = async () => {
      try {
        setLoadingUsageStats(true);
        const response = await api.get('/api/usage-stats');
        setUsageStats(response);
      } catch (error) {
        console.error('Error fetching usage stats:', error);
        setErrorUsageStats('Failed to load usage statistics.');
      } finally {
        setLoadingUsageStats(false);
      }
    };

    fetchSubscriptionData();
    fetchPlans();
    fetchInvoices();
    fetchUsageStats();
  }, []);

  const handleUpgrade = (planName) => {
    setCurrentPlan(planName)
    alert(`Upgrading to ${planName} plan...`)
  }
  
  const handleDownloadInvoice = (invoiceId) => {
    alert(`Downloading invoice ${invoiceId}...`)
  }
  
  const handleUpdatePayment = () => {
    alert('Opening payment method update form...')}
  
  const handleCancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your subscription?')) {
      alert('Subscription cancellation initiated...')
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-gray-300">Manage your subscription, invoices, and payment methods</p>
        </div>
        
        {/* Current Subscription */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSubscription && (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                  <span className="ml-2 text-purple-400">Loading subscription...</span>
                </div>
              )}
              {errorSubscription && <div className="text-red-400">{errorSubscription}</div>}
              {subscriptionData && (
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-white">{subscriptionData.plan}</div>
                    <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-500/50">
                      {subscriptionData.status}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-purple-300">
                    £{subscriptionData.price}
                    <span className="text-sm text-gray-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4" />
                      Next billing: {subscriptionData.nextBillingDate}
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {subscriptionData.paymentMethod}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Billing Cycle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setBillingCycle('monthly')}
                    className={`flex-1 ${billingCycle === 'monthly' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    Monthly
                  </Button>
                  <Button
                    onClick={() => setBillingCycle('annual')}
                    className={`flex-1 ${billingCycle === 'annual' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    Annual
                    <Badge className="ml-2 bg-green-500 text-white text-xs">Save 17%</Badge>
                  </Button>
                </div>
                <div className="text-sm text-gray-300">
                  {billingCycle === 'annual' && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 inline mr-2 text-green-400" />
                      Save £198 per year with annual billing
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={handleUpdatePayment}
                  className="w-full bg-white/10 hover:bg-white/20 text-white"
                >
                  Update Payment Method
                </Button>
                <Button 
                  onClick={() => handleDownloadInvoice('latest')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Latest Invoice
                </Button>
                <Button 
                  onClick={handleCancelSubscription}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50"
                >
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Usage Statistics */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Usage Statistics</CardTitle>
            <CardDescription className="text-gray-300">Current usage vs plan limits</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsageStats && (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <span className="ml-2 text-purple-400">Loading usage stats...</span>
              </div>
            )}
            {errorUsageStats && <div className="text-red-400">{errorUsageStats}</div>}
            {!loadingUsageStats && !errorUsageStats && usageStats.length === 0 && (
              <div className="text-gray-400">No usage statistics available.</div>
            )}
            {usageStats.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {usageStats.map((stat, index) => {
                  const percentage = (stat.current / stat.limit) * 100
                  const isNearLimit = percentage > 80
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">{stat.label}</span>
                        {isNearLimit && (
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <div className="text-2xl font-bold text-purple-300">
                        {stat.current.toLocaleString()}{stat.unit}
                        <span className="text-sm text-gray-400"> / {stat.limit.toLocaleString()}{stat.unit}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${isNearLimit ? 'bg-yellow-500' : 'bg-purple-500'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400">{percentage.toFixed(0)}% used</div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Available Plans</h2>
          {loadingPlans && (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              <span className="ml-2 text-purple-400">Loading plans...</span>
            </div>
          )}
          {errorPlans && <div className="text-red-400">{errorPlans}</div>}
          {!loadingPlans && !errorPlans && plans.length === 0 && (
            <div className="text-gray-400">No plans available.</div>
          )}
          {plans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`bg-white/10 backdrop-blur-lg border-white/20 ${plan.popular ? 'ring-2 ring-purple-500' : ''} relative`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-600 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-purple-300">
                      £{plan.price[billingCycle]}
                      <span className="text-sm text-gray-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                    <CardDescription className="text-gray-400">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6 text-gray-300">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => handleUpgrade(plan.name)}
                      className={`w-full ${currentPlan === plan.name ? 'bg-gray-700 text-gray-300' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                      disabled={currentPlan === plan.name}
                    >
                      {currentPlan === plan.name ? 'Current Plan' : 'Choose Plan'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Invoice History */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Invoice History</h2>
          {loadingInvoices && (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              <span className="ml-2 text-purple-400">Loading invoices...</span>
            </div>
          )}
          {errorInvoices && <div className="text-red-400">{errorInvoices}</div>}
          {!loadingInvoices && !errorInvoices && invoices.length === 0 && (
            <div className="text-gray-400">No invoices found.</div>
          )}
          {invoices.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-gray-300">
                    <thead className="text-xs uppercase bg-white/5">
                      <tr>
                        <th scope="col" className="px-6 py-3">Invoice ID</th>
                        <th scope="col" className="px-6 py-3">Date</th>
                        <th scope="col" className="px-6 py-3">Description</th>
                        <th scope="col" className="px-6 py-3">Amount</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-white/10 hover:bg-white/5">
                          <td className="px-6 py-4 font-medium text-white">{invoice.id}</td>
                          <td className="px-6 py-4">{invoice.date}</td>
                          <td className="px-6 py-4">{invoice.description}</td>
                          <td className="px-6 py-4">£{invoice.amount}</td>
                          <td className="px-6 py-4">
                            <Badge className={`${invoice.status === 'Paid' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'}`}>
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDownloadInvoice(invoice.id)}
                              className="text-purple-400 hover:text-purple-300"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
