import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { FileText, Download, Calendar, TrendingUp, BarChart3, PieChart, Activity, CheckCircle2, AlertTriangle, Clock, Filter, Eye, Share2, Plus } from 'lucide-react'

const ReportsDashboardPage = () => {
  const [selectedReport, setSelectedReport] = useState(null)
  const [dateRange, setDateRange] = useState('30days')

  // Sample reports
  const reports = [
    {
      id: 1,
      name: 'FineGuard Overview Report',
      description: 'Comprehensive overview of all fineguard activities',
      type: 'overview',
      frequency: 'monthly',
      lastGenerated: '2024-11-01',
      size: '2.4 MB',
      format: 'PDF',
      status: 'ready',
      icon: <FileText className="w-6 h-6 text-blue-500" />
    },
    {
      id: 2,
      name: 'Deadline Status Report',
      description: 'Status of all upcoming and overdue deadlines',
      type: 'deadlines',
      frequency: 'weekly',
      lastGenerated: '2024-11-10',
      size: '856 KB',
      format: 'PDF',
      status: 'ready',
      icon: <Calendar className="w-6 h-6 text-green-500" />
    },
    {
      id: 3,
      name: 'Risk Assessment Report',
      description: 'Analysis of fineguard risks and mitigation strategies',
      type: 'risk',
      frequency: 'quarterly',
      lastGenerated: '2024-10-01',
      size: '3.2 MB',
      format: 'PDF',
      status: 'ready',
      icon: <AlertTriangle className="w-6 h-6 text-orange-500" />
    },
    {
      id: 4,
      name: 'Performance Metrics Report',
      description: 'Key performance indicators and trends',
      type: 'metrics',
      frequency: 'monthly',
      lastGenerated: '2024-11-01',
      size: '1.5 MB',
      format: 'Excel',
      status: 'ready',
      icon: <TrendingUp className="w-6 h-6 text-purple-500" />
    },
    {
      id: 5,
      name: 'Audit Trail Report',
      description: 'Complete audit log of all system activities',
      type: 'audit',
      frequency: 'monthly',
      lastGenerated: '2024-11-01',
      size: '4.1 MB',
      format: 'PDF',
      status: 'ready',
      icon: <Activity className="w-6 h-6 text-indigo-500" />
    },
    {
      id: 6,
      name: 'Document Management Report',
      description: 'Summary of document uploads, downloads, and changes',
      type: 'documents',
      frequency: 'monthly',
      lastGenerated: '2024-11-01',
      size: '1.8 MB',
      format: 'PDF',
      status: 'ready',
      icon: <FileText className="w-6 h-6 text-teal-500" />
    },
  ]

  // Sample metrics data
  const metrics = {
    totalReports: 24,
    generatedThisMonth: 6,
    scheduledReports: 12,
    customReports: 8
  }

  // Sample chart data
  const fineguardData = {
    completed: 75,
    overdue: 10,
    upcoming: 15
  }

  const monthlyTrends = [
    { month: 'Jul', completed: 18, overdue: 3 },
    { month: 'Aug', completed: 22, overdue: 2 },
    { month: 'Sep', completed: 20, overdue: 4 },
    { month: 'Oct', completed: 25, overdue: 1 },
    { month: 'Nov', completed: 28, overdue: 2 },
  ]

  const generateReport = (reportId) => {
    alert(`Generating report ${reportId}...`)
  }

  const downloadReport = (reportId) => {
    alert(`Downloading report ${reportId}...`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports Dashboard</h1>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Report
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Generate and download fineguard reports</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalReports}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.generatedThisMonth}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.scheduledReports}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Custom</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.customReports}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* FineGuard Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">FineGuard Status</CardTitle>
              <CardDescription>Current period breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                    <span className="text-sm font-semibold text-green-600">{fineguardData.completed}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: `${fineguardData.completed}%`}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Upcoming</span>
                    <span className="text-sm font-semibold text-blue-600">{fineguardData.upcoming}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: `${fineguardData.upcoming}%`}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
                    <span className="text-sm font-semibold text-red-600">{fineguardData.overdue}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{width: `${fineguardData.overdue}%`}}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Trends</CardTitle>
              <CardDescription>Completed vs Overdue deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-between gap-2">
                {monthlyTrends.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col gap-1">
                      <div 
                        className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                        style={{height: `${(data.completed / 30) * 160}px`}}
                        title={`Completed: ${data.completed}`}
                      ></div>
                      <div 
                        className="w-full bg-red-500 rounded-b transition-all hover:bg-red-600"
                        style={{height: `${(data.overdue / 30) * 160}px`}}
                        title={`Overdue: ${data.overdue}`}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{data.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Overdue</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Available Reports</CardTitle>
                <CardDescription>Pre-configured fineguard reports</CardDescription>
              </div>
              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map(report => (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {report.icon}
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {report.status}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{report.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {report.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Format:</span>
                        <span className="font-medium">{report.format}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Size:</span>
                        <span className="font-medium">{report.size}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Frequency:</span>
                        <Badge variant="outline" className="text-xs">{report.frequency}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Last Generated:</span>
                        <span className="font-medium">{new Date(report.lastGenerated).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" className="flex-1" onClick={() => generateReport(report.id)}>
                        <Activity className="w-4 h-4 mr-1" />
                        Generate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadReport(report.id)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Last 5 generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.slice(0, 5).map(report => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-gray-900 rounded">
                      {report.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{report.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Generated on {new Date(report.lastGenerated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{report.format}</Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{report.size}</span>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ReportsDashboardPage

