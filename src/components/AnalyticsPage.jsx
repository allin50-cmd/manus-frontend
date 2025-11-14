import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { BarChart3, PieChart, TrendingUp, Calendar, Download } from 'lucide-react'
import FinesTrendChart from './FinesTrendChart.jsx'
import CostAnalysisPieChart from './CostAnalysisPieChart.jsx'
import RiskAssessmentChart from './RiskAssessmentChart.jsx'
import { exportSummaryReport } from '../utils/exportData.js'

// Import demo data
import { demoFines, demoStats } from '../data/demoData.js'

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('6months')
  const [groupBy, setGroupBy] = useState('authority')

  const handleExportReport = () => {
    exportSummaryReport(demoStats, demoFines)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Advanced Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive insights and data visualization for fine management
              </p>
            </div>
            <Button onClick={handleExportReport} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Time Range:</span>
                <div className="flex gap-2">
                  <Button
                    variant={timeRange === '6months' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('6months')}
                  >
                    6 Months
                  </Button>
                  <Button
                    variant={timeRange === '12months' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('12months')}
                  >
                    12 Months
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <PieChart className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Group By:</span>
                <div className="flex gap-2">
                  <Button
                    variant={groupBy === 'authority' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupBy('authority')}
                  >
                    Authority
                  </Button>
                  <Button
                    variant={groupBy === 'category' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupBy('category')}
                  >
                    Category
                  </Button>
                  <Button
                    variant={groupBy === 'companyName' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupBy('companyName')}
                  >
                    Company
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Fines</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {demoStats.activeFines}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    £{demoStats.totalFineValue.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Fine</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    £{Math.round(demoStats.totalFineValue / demoStats.activeFines).toLocaleString()}
                  </p>
                </div>
                <PieChart className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Risk Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {demoStats.avgFineRiskScore}/100
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  demoStats.avgFineRiskScore >= 75 ? 'bg-red-100' :
                  demoStats.avgFineRiskScore >= 50 ? 'bg-orange-100' :
                  'bg-green-100'
                }`}>
                  <span className={`text-sm font-bold ${
                    demoStats.avgFineRiskScore >= 75 ? 'text-red-600' :
                    demoStats.avgFineRiskScore >= 50 ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                    {demoStats.avgFineRiskScore}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Trend Chart */}
          <FinesTrendChart fines={demoFines} timeRange={timeRange} />

          {/* Risk Assessment */}
          <RiskAssessmentChart fines={demoFines} />
        </div>

        {/* Cost Analysis - Full Width */}
        <div className="mb-6">
          <CostAnalysisPieChart fines={demoFines} groupBy={groupBy} />
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Authority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600 mb-2">HMRC</p>
                <p className="text-sm text-gray-600">
                  {demoFines.filter(f => f.authority === 'HMRC').length} fines
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  £{demoFines.filter(f => f.authority === 'HMRC')
                    .reduce((sum, f) => sum + f.potentialFine, 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Most Common Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600 mb-2">Tax</p>
                <p className="text-sm text-gray-600">
                  {demoFines.filter(f => f.category === 'Tax').length} fines
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  £{demoFines.filter(f => f.category === 'Tax')
                    .reduce((sum, f) => sum + f.potentialFine, 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {Math.round((demoStats.completedFines / demoStats.activeFines) * 100)}%
                </p>
                <p className="text-sm text-gray-600">
                  {demoStats.completedFines} of {demoStats.activeFines} completed
                </p>
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(demoStats.completedFines / demoStats.activeFines) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage

