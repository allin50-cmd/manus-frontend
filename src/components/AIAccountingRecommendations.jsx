import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Brain, TrendingUp, AlertCircle, CheckCircle2, ArrowRight, Sparkles, Target, DollarSign, Calendar } from 'lucide-react'
import { accountingAI } from '../utils/accountingAI.js'

export default function AIAccountingRecommendations({ companyData, onBookConsultation }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedRecommendation, setSelectedRecommendation] = useState(null)

  useEffect(() => {
    if (companyData) {
      analyzeCompany()
    }
  }, [companyData])

  const analyzeCompany = () => {
    setLoading(true)
    
    // Simulate AI processing time
    setTimeout(() => {
      const result = accountingAI.analyzeCompany(companyData)
      setAnalysis(result)
      setLoading(false)
    }, 800)
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-lg border-purple-500/50">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Brain className="w-16 h-16 text-purple-400 animate-pulse" />
              <Sparkles className="w-8 h-8 text-blue-400 absolute -top-2 -right-2 animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">AI Analysis in Progress</h3>
              <p className="text-gray-300">Analyzing your company data to provide personalized recommendations...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis || analysis.recommendations.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">All Set!</h3>
          <p className="text-gray-300">Your company is in good shape. Browse our services to see how we can help you grow.</p>
        </CardContent>
      </Card>
    )
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/50'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />
      case 'medium': return <TrendingUp className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-lg border-purple-500/50">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                AI-Powered Recommendations
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </CardTitle>
              <CardDescription className="text-gray-300">
                Based on analysis of your company data
              </CardDescription>
            </div>
            <Badge className="bg-purple-500/30 text-purple-200 border-purple-500/50 text-lg px-4 py-2">
              {analysis.overallConfidence}% Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Recommended Package */}
          <div className="bg-white/10 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  Recommended Package: {analysis.suggestedPackage.package}
                </h3>
                <p className="text-gray-300 mb-3">{analysis.suggestedPackage.reason}</p>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-green-300">
                    £{analysis.suggestedPackage.price}
                    <span className="text-lg text-gray-400">/month</span>
                  </div>
                  {analysis.estimatedMonthlySavings > 0 && (
                    <div className="flex items-center gap-2 text-green-300">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-sm">
                        Est. savings: £{analysis.estimatedMonthlySavings.toLocaleString()}/month
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={onBookConsultation}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Now
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {analysis.recommendations.length}
              </div>
              <div className="text-sm text-gray-400">Services Recommended</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-300 mb-1">
                {analysis.recommendations.filter(r => r.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-400">High Priority</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-300 mb-1">
                {analysis.overallConfidence}%
              </div>
              <div className="text-sm text-gray-400">AI Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Personalized Service Recommendations</h3>
        
        {analysis.recommendations.map((rec, index) => (
          <Card 
            key={index}
            className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all cursor-pointer"
            onClick={() => setSelectedRecommendation(selectedRecommendation === index ? null : index)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-white">{rec.service}</h4>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {getPriorityIcon(rec.priority)}
                      <span className="ml-1 capitalize">{rec.priority} Priority</span>
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                      {rec.confidence}% Match
                    </Badge>
                  </div>
                  <p className="text-gray-300">{rec.reason}</p>
                </div>
                <ArrowRight className={`w-5 h-5 text-gray-400 transition-transform ${selectedRecommendation === index ? 'rotate-90' : ''}`} />
              </div>
            </CardHeader>
            
            {selectedRecommendation === index && (
              <CardContent className="pt-0">
                <div className="border-t border-white/10 pt-4 space-y-4">
                  {/* Suggested Actions */}
                  <div>
                    <h5 className="text-sm font-semibold text-white mb-2">Suggested Actions:</h5>
                    <ul className="space-y-2">
                      {rec.suggestedActions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Estimated Savings */}
                  {rec.estimatedSavings && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <h5 className="text-sm font-semibold text-white">Estimated Savings</h5>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                          <div className="text-2xl font-bold text-green-300">
                            £{rec.estimatedSavings.monthly.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">Per Month</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-300">
                            £{rec.estimatedSavings.annual.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">Per Year</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">{rec.estimatedSavings.description}</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      onBookConsultation()
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Book Consultation for {rec.service}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Next Steps */}
      {analysis.nextSteps && analysis.nextSteps.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Your Next Steps</CardTitle>
            <CardDescription className="text-gray-300">
              Follow these steps to get started with Devonshire Green
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${step.urgent ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'} font-bold`}>
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-white font-semibold mb-1 flex items-center gap-2">
                      {step.action}
                      {step.urgent && <Badge className="bg-red-500/20 text-red-300 text-xs">Urgent</Badge>}
                    </h5>
                    <p className="text-sm text-gray-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button
              onClick={onBookConsultation}
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Start with Free Consultation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

