import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, PieChart } from 'lucide-react'

const CostAnalysisPieChart = ({ fines, groupBy = 'authority' }) => {
  const [chartData, setChartData] = useState([])
  const [total, setTotal] = useState(0)

  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ]

  useEffect(() => {
    if (fines && fines.length > 0) {
      const data = generatePieData(fines, groupBy)
      setChartData(data)
      const totalAmount = data.reduce((sum, d) => sum + d.value, 0)
      setTotal(totalAmount)
    }
  }, [fines, groupBy])

  const generatePieData = (finesData, group) => {
    const grouped = {}

    finesData.forEach(fine => {
      const key = fine[group] || 'Other'
      if (!grouped[key]) {
        grouped[key] = {
          label: key,
          value: 0,
          count: 0
        }
      }
      grouped[key].value += fine.potentialFine || 0
      grouped[key].count += 1
    })

    // Convert to array and sort by value
    const data = Object.values(grouped)
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        color: colors[index % colors.length],
        percentage: 0 // Will be calculated after we have total
      }))

    // Calculate percentages
    const totalValue = data.reduce((sum, d) => sum + d.value, 0)
    data.forEach(item => {
      item.percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0
    })

    return data
  }

  // Calculate pie chart segments
  let currentAngle = 0
  const segments = chartData.map(item => {
    const angle = (item.value / total) * 360
    const segment = {
      ...item,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      angle: angle
    }
    currentAngle += angle
    return segment
  })

  const createArcPath = (startAngle, endAngle, radius = 100) => {
    const start = polarToCartesian(120, 120, radius, endAngle)
    const end = polarToCartesian(120, 120, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    
    return [
      'M', 120, 120,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ')
  }

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Cost Analysis by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            <svg width="240" height="240" viewBox="0 0 240 240">
              {segments.map((segment, index) => (
                <g key={index}>
                  <path
                    d={createArcPath(segment.startAngle, segment.endAngle)}
                    fill={segment.color}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    title={`${segment.label}: £${segment.value.toLocaleString()} (${segment.percentage}%)`}
                  />
                </g>
              ))}
              {/* Center circle for donut effect */}
              <circle cx="120" cy="120" r="50" fill="white" />
              <text x="120" y="115" textAnchor="middle" className="text-sm font-semibold fill-gray-700">
                Total
              </text>
              <text x="120" y="135" textAnchor="middle" className="text-lg font-bold fill-gray-900">
                £{total.toLocaleString()}
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 mb-3">Breakdown</h4>
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">{item.count} fines</span>
                  <span className="font-semibold text-gray-900 w-24 text-right">
                    £{item.value.toLocaleString()}
                  </span>
                  <span className="text-gray-500 w-12 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 Summary */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-semibold text-gray-900 mb-3">Top 3 Contributors</h4>
          <div className="grid grid-cols-3 gap-4">
            {chartData.slice(0, 3).map((item, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <div
                  className="w-8 h-8 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: item.color }}
                ></div>
                <p className="text-xs text-gray-600 mb-1 truncate">{item.label}</p>
                <p className="text-lg font-bold text-gray-900">
                  £{item.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CostAnalysisPieChart

