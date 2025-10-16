import React, { useState } from 'react'
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { CreditCard, Download, Calendar, CheckCircle2, XCircle, AlertCircle, DollarSign, FileText, Clock } from 'lucide-react'

export default function BillingPage({ user }) {
  const [currentPlan, setCurrentPlan] = useState('Professional')
  const [billingCycle, setBillingCycle] = useState('monthly')
  
  const subscriptionData = {
    plan: 'Professional',
    status: 'Active',
    price: billingCycle === 'monthly' ? 99 : 990,
    nextBillingDate: '2024-11-16',
    paymentMethod: '**** **** **** 4242',
    companies: 25,
    users: 5,
    storage: '50GB'
  }
  
  const plans = [
    {
      name: 'Starter',
      price: { monthly: 29, annual: 290 },
      features: [
        '5 Companies',
        '2 Users',
        '10GB Storage',
        'Basic Compliance Tracking',
        'Email Support',
        'Monthly Reports'
      ],
      color: 'blue'
    },
    {
      name: 'Professional',
      price: { monthly: 99, annual: 990 },
      features: [
        '25 Companies',
        '5 Users',
        '50GB Storage',
        'Advanced Compliance Tracking',
        'AI-Powered Insights',
        'Priority Support',
        'Custom Reports',
        'API Access'
      ],
      color: 'purple',
      popular: true
    },
    {
      name: 'Enterprise',
      price: { monthly: 299, annual: 2990 },
      features: [
        'Unlimited Companies',
        'Unlimited Users',
        '500GB Storage',
        'Full Compliance Suite',
        'AI Automation',
        'Dedicated Support',
        'Custom Integration',
        'SLA Guarantee',
        'White Label Option'
      ],
      color: 'green'
    }
  ]
  
  const invoices = [
    {
      id: 'INV-2024-001',
      date: '2024-10-16',
      amount: 99,
      status: 'Paid',
      description: 'Professional Plan - October 2024'
    },
    {
      id: 'INV-2024-002',
      date: '2024-09-16',
      amount: 99,
      status: 'Paid',
      description: 'Professional Plan - September 2024'
    },
    {
      id: 'INV-2024-003',
      date: '2024-08-16',
      amount: 99,
      status: 'Paid',
      description: 'Professional Plan - August 2024'
    },
    {
      id: 'INV-2024-004',
      date: '2024-07-16',
      amount: 99,
      status: 'Paid',
      description: 'Professional Plan - July 2024'
    }
  ]
  
  const usageStats = [
    { label: 'Companies', current: 18, limit: 25, unit: '' },
    { label: 'Users', current: 3, limit: 5, unit: '' },
    { label: 'Storage', current: 32, limit: 50, unit: 'GB' },
    { label: 'API Calls', current: 8420, limit: 10000, unit: '' }
  ]
  
  const handleUpgrade = (planName) => {
    setCurrentPlan(planName)
    alert(`Upgrading to ${planName} plan...`)
  }
  
  const handleDownloadInvoice = (invoiceId) => {
    alert(`Downloading invoice ${invoiceId}...`)
  }
  
  const handleUpdatePayment = () => {
    alert('Opening payment method update form...')
  }
  
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
          </CardContent>
        </Card>
        
        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Available Plans</h2>
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
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => handleUpgrade(plan.name)}
                    className={`w-full ${
                      currentPlan === plan.name 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : plan.popular 
                          ? 'bg-purple-600 hover:bg-purple-700' 
                          : 'bg-white/10 hover:bg-white/20'
                    } text-white`}
                    disabled={currentPlan === plan.name}
                  >
                    {currentPlan === plan.name ? 'Current Plan' : 'Upgrade to ' + plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Invoice History */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Invoice History</CardTitle>
            <CardDescription className="text-gray-300">View and download past invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Invoice ID</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Description</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Amount</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-white font-mono">{invoice.id}</td>
                      <td className="py-3 px-4 text-gray-300">{invoice.date}</td>
                      <td className="py-3 px-4 text-gray-300">{invoice.description}</td>
                      <td className="py-3 px-4 text-right text-white font-semibold">£{invoice.amount}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          className="bg-white/10 hover:bg-white/20 text-white text-sm"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-1" />
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
      </div>
    </div>
  )
}

