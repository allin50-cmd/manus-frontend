import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'

const FinesTrendChart = ({ fines, timeRange = '6months' }) => {
  const [chartData, setChartData] = useState([])
  const [trend, setTrend] = useState({ direction: 'up', percentage: 0 })

  useEffect(() => {
    if (fines && fines.length > 0) {
      const data = generateTrendData(fines, timeRange)
      setChartData(data)
      calculateTrend(data)
    }
  }, [fines, timeRange])

  const generateTrendData = (finesData, range) => {
    const now = new Date()
    const months = range === '12months' ? 12 : 6
    const data = []

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      
      // Count fines due in this month
      const finesInMonth = finesData.filter(fine => {
        const fineDate = new Date(fine.dueDate)
        return fineDate.getMonth() === date.getMonth() && 
               fineDate.getFullYear() === date.getFullYear()
      })

      const totalAmount = finesInMonth.reduce((sum, fine) => sum + (fine.potentialFine || 0), 0)
      
      data.push({
        month: monthName,
        count: finesInMonth.length,
        amount: totalAmount,
        overdue: finesInMonth.filter(f => f.status === 'overdue').length,
        completed: finesInMonth.filter(f => f.status === 'completed').length
      })
    }

    return data
  }

  const calculateTrend = (data) => {
    if (data.length < 2) return

    const recent = data.slice(-3).reduce((sum, d) => sum + d.count, 0) / 3
    const previous = data.slice(-6, -3).reduce((sum, d) => sum + d.count, 0) / 3
    
    if (previous === 0) return

    const change = ((recent - previous) / previous) * 100
    setTrend({
      direction: change > 0 ? 'up' : 'down',
      percentage: Math.abs(change).toFixed(1)
    })
  }

  const maxCount = Math.max(...chartData.map(d => d.count), 1)
  const maxAmount = Math.max(...chartData.map(d => d.amount), 1)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Fines Trend Analysis</CardTitle>
          <div className="flex items-center gap-2">
            {trend.direction === 'up' ? (
              <TrendingUp className="w-5 h-5 text-red-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-green-600" />
            )}
            <span className={`text-sm font-medium ${trend.direction === 'up' ? 'text-red-600' : 'text-green-600'}`}>
              {trend.percentage}% {trend.direction === 'up' ? 'increase' : 'decrease'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Legend */}
        <div className="flex gap-6 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Total Fines</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-4">
          {chartData.map((data, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 w-16">{data.month}</span>
                <div className="flex-1 mx-4">
                  <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
                    {/* Total bar */}
                    <div
                      className="absolute h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${(data.count / maxCount) * 100}%` }}
                      title={`${data.count} fines`}
                    ></div>
                    {/* Overdue overlay */}
                    <div
                      className="absolute h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${(data.overdue / maxCount) * 100}%` }}
                      title={`${data.overdue} overdue`}
                    ></div>
                    {/* Completed overlay */}
                    <div
                      className="absolute h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${(data.completed / maxCount) * 100}%` }}
                      title={`${data.completed} completed`}
                    ></div>
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="w-12 text-right text-gray-600">{data.count} fines</span>
                  <span className="w-20 text-right font-medium text-gray-900">
                    £{data.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {chartData.reduce((sum, d) => sum + d.count, 0)}
            </p>
            <p className="text-xs text-gray-600">Total Fines</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {chartData.reduce((sum, d) => sum + d.overdue, 0)}
            </p>
            <p className="text-xs text-gray-600">Overdue</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {chartData.reduce((sum, d) => sum + d.completed, 0)}
            </p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default FinesTrendChart

