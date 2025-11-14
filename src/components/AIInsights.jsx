import React from 'react'
import { Brain, TrendingUp, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import { generateDashboardRecommendations, getRecommendationColor } from '../utils/smartRecommendations'
import { calculateAggregateRisk, getRiskColor } from '../utils/smartRiskScoring'

const AIInsights = ({ fines = [] }) => {
  const recommendations = generateDashboardRecommendations(fines)
  const aggregateRisk = calculateAggregateRisk(fines)

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Insights</h2>
          <p className="text-sm text-gray-600">Smart recommendations powered by AI</p>
        </div>
      </div>

      {/* Overall Risk Score */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Portfolio Risk Score</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900">{aggregateRisk.overallScore}</span>
              <span className="text-lg text-gray-500">/100</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(aggregateRisk.level).bg} ${getRiskColor(aggregateRisk.level).text}`}>
                {aggregateRisk.level.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Risk Distribution</p>
            <div className="flex gap-2">
              {aggregateRisk.byLevel.critical > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                  {aggregateRisk.byLevel.critical} Critical
                </span>
              )}
              {aggregateRisk.byLevel.high > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                  {aggregateRisk.byLevel.high} High
                </span>
              )}
              {aggregateRisk.byLevel.medium > 0 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                  {aggregateRisk.byLevel.medium} Med
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Recommendations</h3>
        {recommendations.slice(0, 4).map((rec, index) => {
          const colors = getRecommendationColor(rec.type)
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${colors.bg} ${colors.border} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{rec.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-semibold ${colors.text}`}>{rec.title}</h4>
                    {rec.type === 'critical' && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded animate-pulse">
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{rec.message}</p>
                  {rec.action && (
                    <button className={`text-sm font-medium ${colors.text} hover:underline flex items-center gap-1`}>
                      {rec.action}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* View All Link */}
      {recommendations.length > 4 && (
        <button className="mt-4 w-full text-center text-sm text-purple-600 hover:text-purple-800 font-medium">
          View all {recommendations.length} recommendations →
        </button>
      )}

      {/* AI Badge */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Brain className="w-4 h-4" />
          <span>Powered by FineGuard AI Engine</span>
        </div>
      </div>
    </div>
  )
}

export default AIInsights

