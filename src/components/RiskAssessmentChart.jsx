import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Shield, TrendingUp } from 'lucide-react'

const RiskAssessmentChart = ({ fines }) => {
  const [riskData, setRiskData] = useState({
    critical: { count: 0, value: 0, items: [] },
    high: { count: 0, value: 0, items: [] },
    medium: { count: 0, value: 0, items: [] },
    low: { count: 0, value: 0, items: [] }
  })
  const [overallRisk, setOverallRisk] = useState(0)

  useEffect(() => {
    if (fines && fines.length > 0) {
      calculateRiskData(fines)
    }
  }, [fines])

  const calculateRiskData = (finesData) => {
    const data = {
      critical: { count: 0, value: 0, items: [] },
      high: { count: 0, value: 0, items: [] },
      medium: { count: 0, value: 0, items: [] },
      low: { count: 0, value: 0, items: [] }
    }

    finesData.forEach(fine => {
      const priority = fine.priority || 'low'
      if (data[priority]) {
        data[priority].count++
        data[priority].value += fine.potentialFine || 0
        data[priority].items.push(fine)
      }
    })

    setRiskData(data)

    // Calculate overall risk score (0-100)
    const totalFines = finesData.length
    if (totalFines === 0) {
      setOverallRisk(0)
      return
    }

    const criticalWeight = 4
    const highWeight = 3
    const mediumWeight = 2
    const lowWeight = 1

    const weightedScore = (
      (data.critical.count * criticalWeight) +
      (data.high.count * highWeight) +
      (data.medium.count * mediumWeight) +
      (data.low.count * lowWeight)
    )

    const maxPossibleScore = totalFines * criticalWeight
    const riskScore = (weightedScore / maxPossibleScore) * 100

    setOverallRisk(Math.round(riskScore))
  }

  const getRiskLevel = (score) => {
    if (score >= 75) return { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100' }
    if (score >= 50) return { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    if (score >= 25) return { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { label: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' }
  }

  const riskLevel = getRiskLevel(overallRisk)

  const priorityConfig = {
    critical: { color: '#ef4444', label: 'Critical', icon: AlertTriangle },
    high: { color: '#f97316', label: 'High', icon: TrendingUp },
    medium: { color: '#eab308', label: 'Medium', icon: Shield },
    low: { color: '#22c55e', label: 'Low', icon: Shield }
  }

  const maxCount = Math.max(
    riskData.critical.count,
    riskData.high.count,
    riskData.medium.count,
    riskData.low.count,
    1
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Risk Assessment</CardTitle>
          <div className={`px-4 py-2 rounded-lg ${riskLevel.bgColor}`}>
            <span className={`font-bold ${riskLevel.color}`}>
              {riskLevel.label} Risk
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Overall Risk Score */}
        <div className="mb-6 text-center">
          <div className="relative inline-block">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="20"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={
                  overallRisk >= 75 ? '#ef4444' :
                  overallRisk >= 50 ? '#f97316' :
                  overallRisk >= 25 ? '#eab308' :
                  '#22c55e'
                }
                strokeWidth="20"
                strokeDasharray={`${(overallRisk / 100) * 502} 502`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                className="transition-all duration-1000"
              />
              {/* Center text */}
              <text x="100" y="95" textAnchor="middle" className="text-4xl font-bold fill-gray-900">
                {overallRisk}
              </text>
              <text x="100" y="115" textAnchor="middle" className="text-sm fill-gray-600">
                Risk Score
              </text>
            </svg>
          </div>
        </div>

        {/* Risk Breakdown Bars */}
        <div className="space-y-4">
          {Object.entries(priorityConfig).map(([key, config]) => {
            const data = riskData[key]
            const Icon = config.icon
            const percentage = maxCount > 0 ? (data.count / maxCount) * 100 : 0

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                    <span className="font-medium text-gray-700">{config.label}</span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-gray-600">{data.count} fines</span>
                    <span className="font-medium text-gray-900 w-24 text-right">
                      £{data.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: config.color
                    }}
                  ></div>
                  {data.count > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                      {data.count} ({((data.count / (riskData.critical.count + riskData.high.count + riskData.medium.count + riskData.low.count)) * 100).toFixed(0)}%)
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Risk Summary */}
        <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">High Priority</p>
            <p className="text-2xl font-bold text-red-600">
              {riskData.critical.count + riskData.high.count}
            </p>
            <p className="text-xs text-gray-500">
              £{(riskData.critical.value + riskData.high.value).toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Low Priority</p>
            <p className="text-2xl font-bold text-green-600">
              {riskData.medium.count + riskData.low.count}
            </p>
            <p className="text-xs text-gray-500">
              £{(riskData.medium.value + riskData.low.value).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        {overallRisk >= 50 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 text-sm">Action Required</p>
                <p className="text-xs text-yellow-800 mt-1">
                  Your risk score is {overallRisk}/100. Focus on resolving {riskData.critical.count + riskData.high.count} high-priority fines to reduce risk.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RiskAssessmentChart

