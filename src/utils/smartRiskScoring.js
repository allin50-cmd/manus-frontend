/**
 * Smart Risk Scoring Algorithm
 * 
 * Uses machine learning-inspired weighted scoring to assess fine risk levels
 * Factors: Priority, Amount, Days Until Deadline, Authority Type, Company History
 */

// Risk weights for different factors
const RISK_WEIGHTS = {
  priority: 0.30,      // 30% - How critical is this fine?
  amount: 0.25,        // 25% - How expensive is the potential fine?
  urgency: 0.20,       // 20% - How soon is the deadline?
  authority: 0.15,     // 15% - How strict is the authority?
  history: 0.10        // 10% - Company's compliance history
}

// Priority scoring (0-100)
const PRIORITY_SCORES = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25
}

// Authority strictness scores (0-100)
const AUTHORITY_SCORES = {
  'HMRC': 95,                    // Very strict, high penalties
  'FCA': 90,                     // Financial regulator, serious
  'Companies House': 70,         // Moderate, but important
  'HSE': 85,                     // Health & Safety, very serious
  'Environment Agency': 80,      // Environmental fines can be large
  'Local Authority': 60,         // Variable, generally moderate
  'ICO': 85,                     // Data protection, serious
  'default': 70                  // Unknown authorities
}

/**
 * Calculate risk score for a single fine
 * @param {Object} fine - Fine object with properties
 * @returns {Object} - Risk score and breakdown
 */
export function calculateRiskScore(fine) {
  if (!fine) return { score: 0, level: 'low', breakdown: {} }

  // 1. Priority Score (0-100)
  const priorityScore = PRIORITY_SCORES[fine.priority?.toLowerCase()] || 50

  // 2. Amount Score (0-100)
  const amount = parseFloat(fine.potentialFine || fine.amount || 0)
  const amountScore = Math.min(100, (amount / 10000) * 100) // £10k = 100 points

  // 3. Urgency Score (0-100)
  const daysUntil = calculateDaysUntil(fine.deadline)
  let urgencyScore = 0
  if (daysUntil < 0) {
    urgencyScore = 100 // Overdue = maximum urgency
  } else if (daysUntil === 0) {
    urgencyScore = 95 // Due today
  } else if (daysUntil <= 3) {
    urgencyScore = 85 // Within 3 days
  } else if (daysUntil <= 7) {
    urgencyScore = 70 // Within a week
  } else if (daysUntil <= 14) {
    urgencyScore = 50 // Within 2 weeks
  } else if (daysUntil <= 30) {
    urgencyScore = 30 // Within a month
  } else {
    urgencyScore = Math.max(10, 100 - (daysUntil / 365 * 100)) // Decreases over time
  }

  // 4. Authority Score (0-100)
  const authorityScore = AUTHORITY_SCORES[fine.authority] || AUTHORITY_SCORES.default

  // 5. History Score (0-100)
  // In a real system, this would look at company's past compliance
  // For now, we'll use a simplified version based on status
  let historyScore = 50 // Default
  if (fine.status === 'overdue') {
    historyScore = 80 // Poor history indicator
  } else if (fine.status === 'completed') {
    historyScore = 20 // Good history
  }

  // Calculate weighted total score
  const totalScore = Math.round(
    (priorityScore * RISK_WEIGHTS.priority) +
    (amountScore * RISK_WEIGHTS.amount) +
    (urgencyScore * RISK_WEIGHTS.urgency) +
    (authorityScore * RISK_WEIGHTS.authority) +
    (historyScore * RISK_WEIGHTS.history)
  )

  // Determine risk level
  const riskLevel = getRiskLevel(totalScore)

  // Return detailed breakdown
  return {
    score: totalScore,
    level: riskLevel,
    breakdown: {
      priority: { score: priorityScore, weight: RISK_WEIGHTS.priority },
      amount: { score: amountScore, weight: RISK_WEIGHTS.amount },
      urgency: { score: urgencyScore, weight: RISK_WEIGHTS.urgency, daysUntil },
      authority: { score: authorityScore, weight: RISK_WEIGHTS.authority },
      history: { score: historyScore, weight: RISK_WEIGHTS.history }
    },
    recommendations: generateRecommendations(totalScore, {
      priorityScore,
      amountScore,
      urgencyScore,
      authorityScore,
      daysUntil
    })
  }
}

/**
 * Calculate days until deadline
 */
function calculateDaysUntil(deadline) {
  if (!deadline) return 999
  const deadlineDate = new Date(deadline)
  const today = new Date()
  const diffTime = deadlineDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Get risk level from score
 */
function getRiskLevel(score) {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

/**
 * Generate smart recommendations based on risk factors
 */
function generateRecommendations(totalScore, factors) {
  const recommendations = []

  // Urgency-based recommendations
  if (factors.daysUntil < 0) {
    recommendations.push({
      type: 'urgent',
      icon: '🚨',
      message: 'OVERDUE: Immediate action required to minimize penalties',
      action: 'Contact authority immediately'
    })
  } else if (factors.daysUntil <= 3) {
    recommendations.push({
      type: 'urgent',
      icon: '⚠️',
      message: 'Deadline approaching: Less than 3 days remaining',
      action: 'Prioritize this fine today'
    })
  } else if (factors.daysUntil <= 7) {
    recommendations.push({
      type: 'warning',
      icon: '⏰',
      message: 'Deadline within a week: Schedule time to address this',
      action: 'Add to this week\'s tasks'
    })
  }

  // Amount-based recommendations
  if (factors.amountScore >= 80) {
    recommendations.push({
      type: 'financial',
      icon: '💰',
      message: 'High-value fine: Consider legal or professional advice',
      action: 'Consult with specialist'
    })
  }

  // Priority-based recommendations
  if (factors.priorityScore >= 90) {
    recommendations.push({
      type: 'priority',
      icon: '🎯',
      message: 'Critical priority: This should be your top focus',
      action: 'Escalate to senior management'
    })
  }

  // Authority-based recommendations
  if (factors.authorityScore >= 85) {
    recommendations.push({
      type: 'authority',
      icon: '🏛️',
      message: 'Strict authority: Ensure full compliance and documentation',
      action: 'Prepare comprehensive evidence'
    })
  }

  // Overall risk recommendations
  if (totalScore >= 80) {
    recommendations.push({
      type: 'overall',
      icon: '🔴',
      message: 'CRITICAL RISK: This fine requires immediate attention',
      action: 'Create action plan now'
    })
  } else if (totalScore >= 60) {
    recommendations.push({
      type: 'overall',
      icon: '🟠',
      message: 'HIGH RISK: Address this fine within 48 hours',
      action: 'Schedule time tomorrow'
    })
  } else if (totalScore >= 40) {
    recommendations.push({
      type: 'overall',
      icon: '🟡',
      message: 'MEDIUM RISK: Monitor and plan to address soon',
      action: 'Add to next week\'s plan'
    })
  }

  return recommendations
}

/**
 * Calculate aggregate risk score for multiple fines
 */
export function calculateAggregateRisk(fines) {
  if (!fines || fines.length === 0) {
    return {
      overallScore: 0,
      level: 'low',
      totalFines: 0,
      byLevel: { critical: 0, high: 0, medium: 0, low: 0 },
      topRisks: []
    }
  }

  // Calculate individual scores
  const scoredFines = fines.map(fine => ({
    ...fine,
    riskAnalysis: calculateRiskScore(fine)
  }))

  // Count by level
  const byLevel = {
    critical: scoredFines.filter(f => f.riskAnalysis.level === 'critical').length,
    high: scoredFines.filter(f => f.riskAnalysis.level === 'high').length,
    medium: scoredFines.filter(f => f.riskAnalysis.level === 'medium').length,
    low: scoredFines.filter(f => f.riskAnalysis.level === 'low').length
  }

  // Calculate weighted overall score
  // Give more weight to higher risk items
  const totalWeight = scoredFines.reduce((sum, f) => {
    const weight = f.riskAnalysis.level === 'critical' ? 4 :
                   f.riskAnalysis.level === 'high' ? 3 :
                   f.riskAnalysis.level === 'medium' ? 2 : 1
    return sum + (f.riskAnalysis.score * weight)
  }, 0)

  const weightSum = scoredFines.reduce((sum, f) => {
    const weight = f.riskAnalysis.level === 'critical' ? 4 :
                   f.riskAnalysis.level === 'high' ? 3 :
                   f.riskAnalysis.level === 'medium' ? 2 : 1
    return sum + weight
  }, 0)

  const overallScore = weightSum > 0 ? Math.round(totalWeight / weightSum) : 0

  // Get top 5 highest risk fines
  const topRisks = scoredFines
    .sort((a, b) => b.riskAnalysis.score - a.riskAnalysis.score)
    .slice(0, 5)

  return {
    overallScore,
    level: getRiskLevel(overallScore),
    totalFines: fines.length,
    byLevel,
    topRisks,
    scoredFines
  }
}

/**
 * Get risk color for UI display
 */
export function getRiskColor(level) {
  const colors = {
    critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' }
  }
  return colors[level] || colors.low
}

/**
 * Get risk icon for UI display
 */
export function getRiskIcon(level) {
  const icons = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  }
  return icons[level] || icons.low
}

export default {
  calculateRiskScore,
  calculateAggregateRisk,
  getRiskColor,
  getRiskIcon,
  getRiskLevel
}

