import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Bell, Mail, Phone, MessageSquare, Calendar, AlertTriangle, CheckCircle2, Clock, Settings, Save, TestTube, Volume2, VolumeX } from 'lucide-react'

const NotificationsSettingsPage = () => {
  const [settings, setSettings] = useState({
    email: {
      enabled: true,
      deadlineReminders: true,
      overdueAlerts: true,
      completionNotifications: true,
      weeklyDigest: true,
      monthlyReports: true,
      systemUpdates: false,
      advanceDays: 7
    },
    sms: {
      enabled: true,
      deadlineReminders: true,
      overdueAlerts: true,
      completionNotifications: false,
      criticalOnly: true,
      advanceDays: 3
    },
    phone: {
      enabled: false,
      criticalAlertsOnly: true,
      overdueAlerts: true,
      advanceDays: 1
    },
    push: {
      enabled: true,
      deadlineReminders: true,
      overdueAlerts: true,
      completionNotifications: true,
      systemUpdates: true
    },
    preferences: {
      quietHours: true,
      quietStart: '22:00',
      quietEnd: '08:00',
      timezone: 'Europe/London',
      language: 'en-GB'
    }
  })

  const [testNotification, setTestNotification] = useState(null)

  const toggleSetting = (category, setting) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }))
  }

  const updateSetting = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }))
  }

  const saveSettings = () => {
    alert('Settings saved successfully!')
  }

  const sendTestNotification = (type) => {
    setTestNotification(type)
    setTimeout(() => setTestNotification(null), 3000)
  }

  const notificationStats = {
    sentToday: 12,
    sentThisWeek: 48,
    sentThisMonth: 156,
    deliveryRate: 98.5
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notification Settings</h1>
            <Button onClick={saveSettings}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Configure how you receive compliance alerts and reminders</p>
        </div>

        {/* Test Notification Alert */}
        {testNotification && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Test {testNotification} notification sent successfully!</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{notificationStats.sentToday}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                  <p className="text-2xl font-bold text-blue-600">{notificationStats.sentThisWeek}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-purple-600">{notificationStats.sentThisMonth}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Rate</p>
                  <p className="text-2xl font-bold text-green-600">{notificationStats.deliveryRate}%</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-blue-500" />
                <div>
                  <CardTitle>Email Notifications</CardTitle>
                  <CardDescription>Receive updates via email</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.enabled}
                    onChange={() => toggleSetting('email', 'enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <Button size="sm" variant="outline" onClick={() => sendTestNotification('email')}>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Deadline Reminders</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get notified before deadlines</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email.deadlineReminders}
                  onChange={() => toggleSetting('email', 'deadlineReminders')}
                  disabled={!settings.email.enabled}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Overdue Alerts</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Immediate alerts for overdue items</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email.overdueAlerts}
                  onChange={() => toggleSetting('email', 'overdueAlerts')}
                  disabled={!settings.email.enabled}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Completion Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Confirmation when tasks are completed</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email.completionNotifications}
                  onChange={() => toggleSetting('email', 'completionNotifications')}
                  disabled={!settings.email.enabled}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Weekly Digest</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Summary of the week's activities</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email.weeklyDigest}
                  onChange={() => toggleSetting('email', 'weeklyDigest')}
                  disabled={!settings.email.enabled}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Advance Notice</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Days before deadline to send reminder</p>
                </div>
                <select
                  value={settings.email.advanceDays}
                  onChange={(e) => updateSetting('email', 'advanceDays', parseInt(e.target.value))}
                  disabled={!settings.email.enabled}
                  className="px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-green-500" />
                <div>
                  <CardTitle>SMS Notifications (£1/month plan)</CardTitle>
                  <CardDescription>Receive text message alerts</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-100 text-green-800">Premium</Badge>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sms.enabled}
                    onChange={() => toggleSetting('sms', 'enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <Button size="sm" variant="outline" onClick={() => sendTestNotification('SMS')}>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Deadline Reminders</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">SMS alerts before deadlines</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sms.deadlineReminders}
                  onChange={() => toggleSetting('sms', 'deadlineReminders')}
                  disabled={!settings.sms.enabled}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Overdue Alerts</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Immediate SMS for overdue items</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sms.overdueAlerts}
                  onChange={() => toggleSetting('sms', 'overdueAlerts')}
                  disabled={!settings.sms.enabled}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Critical Only</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Only send SMS for critical deadlines</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sms.criticalOnly}
                  onChange={() => toggleSetting('sms', 'criticalOnly')}
                  disabled={!settings.sms.enabled}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Advance Notice</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Days before deadline</p>
                </div>
                <select
                  value={settings.sms.advanceDays}
                  onChange={(e) => updateSetting('sms', 'advanceDays', parseInt(e.target.value))}
                  disabled={!settings.sms.enabled}
                  className="px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phone Call Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-orange-500" />
                <div>
                  <CardTitle>Phone Call Alerts (£1/month plan)</CardTitle>
                  <CardDescription>Receive voice call alerts for critical items</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-100 text-orange-800">Premium</Badge>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.phone.enabled}
                    onChange={() => toggleSetting('phone', 'enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <Button size="sm" variant="outline" onClick={() => sendTestNotification('phone call')}>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Critical Alerts Only</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Only call for critical priority items</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.phone.criticalAlertsOnly}
                  onChange={() => toggleSetting('phone', 'criticalAlertsOnly')}
                  disabled={!settings.phone.enabled}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Overdue Alerts</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Call when items become overdue</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.phone.overdueAlerts}
                  onChange={() => toggleSetting('phone', 'overdueAlerts')}
                  disabled={!settings.phone.enabled}
                  className="w-4 h-4"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-purple-500" />
              <div>
                <CardTitle>General Preferences</CardTitle>
                <CardDescription>Configure notification behavior</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Quiet Hours</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pause non-critical notifications during specified hours</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.preferences.quietHours}
                  onChange={() => toggleSetting('preferences', 'quietHours')}
                  className="w-4 h-4"
                />
              </div>

              {settings.preferences.quietHours && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={settings.preferences.quietStart}
                      onChange={(e) => updateSetting('preferences', 'quietStart', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                    <input
                      type="time"
                      value={settings.preferences.quietEnd}
                      onChange={(e) => updateSetting('preferences', 'quietEnd', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Timezone</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your local timezone for notifications</p>
                </div>
                <select
                  value={settings.preferences.timezone}
                  onChange={(e) => updateSetting('preferences', 'timezone', e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="America/New_York">New York (EST)</option>
                  <option value="America/Los_Angeles">Los Angeles (PST)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <Button size="lg" onClick={saveSettings}>
            <Save className="w-5 h-5 mr-2" />
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotificationsSettingsPage

