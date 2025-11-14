/**
 * Smart Recommendations System
 * 
 * Generates intelligent, context-aware recommendations for fine management
 * Based on risk analysis, deadlines, patterns, and best practices
 */

import { calculateRiskScore, calculateAggregateRisk } from './smartRiskScoring'
import { categorizeFine } from './autoCategorization'

/**
 * Generate smart recommendations for a single fine
 * @param {Object} fine - Fine object
 * @param {Array} allFines - All fines for context
 * @returns {Array} - Array of recommendation objects
 */
export function generateFineRecommendations(fine, allFines = []) {
  if (!fine) return []

  const recommendations = []
  const riskAnalysis = calculateRiskScore(fine)
  const category = categorizeFine(fine)

  // Add risk-based recommendations
  if (riskAnalysis.recommendations) {
    recommendations.push(...riskAnalysis.recommendations)
  }

  // Add deadline-based recommendations
  const deadlineRecs = getDeadlineRecommendations(fine)
  recommendations.push(...deadlineRecs)

  // Add category-specific recommendations
  const categoryRecs = getCategoryRecommendations(fine, category.category)
  recommendations.push(...categoryRecs)

  // Add pattern-based recommendations
  if (allFines.length > 0) {
    const patternRecs = getPatternRecommendations(fine, allFines)
    recommendations.push(...patternRecs)
  }

  // Add document recommendations
  const docRecs = getDocumentRecommendations(fine)
  recommendations.push(...docRecs)

  // Deduplicate and prioritize
  return prioritizeRecommendations(recommendations)
}

/**
 * Generate dashboard-level recommendations
 * @param {Array} fines - All fines
 * @returns {Array} - High-level strategic recommendations
 */
export function generateDashboardRecommendations(fines) {
  if (!fines || fines.length === 0) {
    return [{
      type: 'info',
      icon: '📝',
      title: 'Get Started',
      message: 'Add your first fine to start tracking deadlines',
      action: 'Add Fine',
      priority: 1
    }]
  }

  const recommendations = []
  const aggregateRisk = calculateAggregateRisk(fines)

  // Overall risk recommendations
  if (aggregateRisk.overallScore >= 70) {
    recommendations.push({
      type: 'critical',
      icon: '🚨',
      title: 'High Risk Portfolio',
      message: `Your overall risk score is ${aggregateRisk.overallScore}/100. Immediate action needed on ${aggregateRisk.byLevel.critical + aggregateRisk.byLevel.high} fines.`,
      action: 'View High Risk Fines',
      priority: 10
    })
  }

  // Overdue fines
  const overdueFines = fines.filter(f => f.status === 'overdue')
  if (overdueFines.length > 0) {
    recommendations.push({
      type: 'urgent',
      icon: '⏰',
      title: 'Overdue Fines',
      message: `You have ${overdueFines.length} overdue fine${overdueFines.length > 1 ? 's' : ''}. Address these immediately to minimize penalties.`,
      action: 'View Overdue',
      priority: 9
    })
  }

  // Upcoming deadlines
  const upcomingFines = fines.filter(f => {
    const days = calculateDaysUntil(f.deadline)
    return days >= 0 && days <= 7 && f.status !== 'completed'
  })
  if (upcomingFines.length > 0) {
    recommendations.push({
      type: 'warning',
      icon: '📅',
      title: 'Upcoming Deadlines',
      message: `${upcomingFines.length} fine${upcomingFines.length > 1 ? 's' : ''} due within 7 days. Plan your week accordingly.`,
      action: 'View Calendar',
      priority: 8
    })
  }

  // Cost analysis
  const totalPotentialFines = fines.reduce((sum, f) => sum + (parseFloat(f.potentialFine || 0)), 0)
  if (totalPotentialFines > 10000) {
    recommendations.push({
      type: 'financial',
      icon: '💰',
      title: 'High Financial Exposure',
      message: `Total potential fines: £${totalPotentialFines.toLocaleString()}. Consider professional advice for high-value items.`,
      action: 'View Cost Analysis',
      priority: 7
    })
  }

  // Pattern detection
  const patternRecs = detectPortfolioPatterns(fines)
  recommendations.push(...patternRecs)

  // Best practices
  const practiceRecs = getBestPracticeRecommendations(fines)
  recommendations.push(...practiceRecs)

  return prioritizeRecommendations(recommendations).slice(0, 5) // Top 5
}

/**
 * Get deadline-specific recommendations
 */
function getDeadlineRecommendations(fine) {
  const recommendations = []
  const daysUntil = calculateDaysUntil(fine.deadline)

  if (daysUntil < 0) {
    recommendations.push({
      type: 'urgent',
      icon: '🚨',
      title: 'Overdue',
      message: `This fine is ${Math.abs(daysUntil)} days overdue`,
      action: 'Contact authority immediately',
      priority: 10
    })
  } else if (daysUntil === 0) {
    recommendations.push({
      type: 'urgent',
      icon: '⏰',
      title: 'Due Today',
      message: 'This fine is due today',
      action: 'Complete now',
      priority: 9
    })
  } else if (daysUntil <= 3) {
    recommendations.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Urgent',
      message: `Only ${daysUntil} days remaining`,
      action: 'Prioritize this fine',
      priority: 8
    })
  } else if (daysUntil <= 7) {
    recommendations.push({
      type: 'info',
      icon: '📅',
      title: 'This Week',
      message: `${daysUntil} days until deadline`,
      action: 'Add to this week\'s tasks',
      priority: 6
    })
  }

  return recommendations
}

/**
 * Get category-specific recommendations
 */
function getCategoryRecommendations(fine, category) {
  const recommendations = []

  const categoryAdvice = {
    'Tax': {
      icon: '💰',
      title: 'Tax Compliance',
      message: 'Ensure all calculations are accurate. Consider consulting an accountant for complex tax matters.',
      action: 'Review tax calculations'
    },
    'Corporate': {
      icon: '🏢',
      title: 'Corporate Filing',
      message: 'Companies House filings must be accurate and complete. Late filings incur automatic penalties.',
      action: 'Verify all company details'
    },
    'Health & Safety': {
      icon: '🛡️',
      title: 'H&S Compliance',
      message: 'Health & Safety violations can lead to serious penalties. Document all corrective actions taken.',
      action: 'Prepare evidence of compliance'
    },
    'Environmental': {
      icon: '🌱',
      title: 'Environmental Compliance',
      message: 'Environmental fines can escalate quickly. Ensure proper permits and documentation.',
      action: 'Check permit status'
    },
    'Financial Regulation': {
      icon: '📊',
      title: 'FCA Compliance',
      message: 'Financial regulation is strict. Consider specialist compliance advice for FCA matters.',
      action: 'Consult FCA specialist'
    }
  }

  if (categoryAdvice[category]) {
    recommendations.push({
      type: 'category',
      ...categoryAdvice[category],
      priority: 5
    })
  }

  return recommendations
}

/**
 * Get pattern-based recommendations
 */
function getPatternRecommendations(fine, allFines) {
  const recommendations = []

  // Check for recurring issues with same authority
  const sameAuthority = allFines.filter(f => 
    f.authority === fine.authority && f.id !== fine.id
  )

  if (sameAuthority.length >= 3) {
    recommendations.push({
      type: 'pattern',
      icon: '🔄',
      title: 'Recurring Authority',
      message: `You have ${sameAuthority.length} fines from ${fine.authority}. Consider reviewing your processes.`,
      action: 'Review compliance procedures',
      priority: 6
    })
  }

  // Check for similar deadlines (clustering)
  const similarDeadlines = allFines.filter(f => {
    const daysDiff = Math.abs(calculateDaysUntil(f.deadline) - calculateDaysUntil(fine.deadline))
    return daysDiff <= 7 && f.id !== fine.id && f.status !== 'completed'
  })

  if (similarDeadlines.length >= 2) {
    recommendations.push({
      type: 'planning',
      icon: '📊',
      title: 'Clustered Deadlines',
      message: `${similarDeadlines.length + 1} fines due around the same time. Plan your workload.`,
      action: 'Create action plan',
      priority: 5
    })
  }

  return recommendations
}

/**
 * Get document recommendations
 */
function getDocumentRecommendations(fine) {
  const recommendations = []

  // Check if documents are attached
  if (!fine.documents || fine.documents.length === 0) {
    recommendations.push({
      type: 'documentation',
      icon: '📄',
      title: 'Missing Documents',
      message: 'No documents attached. Upload supporting evidence for this fine.',
      action: 'Upload documents',
      priority: 4
    })
  }

  return recommendations
}

/**
 * Detect portfolio-wide patterns
 */
function detectPortfolioPatterns(fines) {
  const recommendations = []

  // Check completion rate
  const completedCount = fines.filter(f => f.status === 'completed').length
  const completionRate = (completedCount / fines.length) * 100

  if (completionRate < 50) {
    recommendations.push({
      type: 'performance',
      icon: '📈',
      title: 'Low Completion Rate',
      message: `Only ${Math.round(completionRate)}% of fines completed. Focus on clearing backlog.`,
      action: 'Review pending fines',
      priority: 6
    })
  }

  // Check for cost trends
  const recentFines = fines.filter(f => {
    const created = new Date(f.createdAt || Date.now())
    const monthsAgo = (Date.now() - created) / (1000 * 60 * 60 * 24 * 30)
    return monthsAgo <= 3
  })

  const totalRecent = recentFines.reduce((sum, f) => sum + parseFloat(f.potentialFine || 0), 0)
  if (totalRecent > 5000 && recentFines.length >= 3) {
    recommendations.push({
      type: 'trend',
      icon: '📊',
      title: 'Increasing Fine Costs',
      message: `£${totalRecent.toLocaleString()} in potential fines in last 3 months. Review compliance processes.`,
      action: 'Analyze trends',
      priority: 7
    })
  }

  return recommendations
}

/**
 * Get best practice recommendations
 */
function getBestPracticeRecommendations(fines) {
  const recommendations = []

  // Suggest regular reviews
  recommendations.push({
    type: 'best-practice',
    icon: '✅',
    title: 'Weekly Review',
    message: 'Schedule a weekly review of all pending fines to stay on top of deadlines.',
    action: 'Set calendar reminder',
    priority: 3
  })

  // Suggest automation
  if (fines.length > 10) {
    recommendations.push({
      type: 'best-practice',
      icon: '🤖',
      title: 'Enable Notifications',
      message: 'With multiple fines, enable SMS/email notifications to never miss a deadline.',
      action: 'Configure notifications',
      priority: 4
    })
  }

  return recommendations
}

/**
 * Prioritize and deduplicate recommendations
 */
function prioritizeRecommendations(recommendations) {
  // Remove duplicates based on title
  const unique = recommendations.filter((rec, index, self) =>
    index === self.findIndex(r => r.title === rec.title)
  )

  // Sort by priority (higher first)
  return unique.sort((a, b) => (b.priority || 0) - (a.priority || 0))
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
 * Get recommendation color for UI
 */
export function getRecommendationColor(type) {
  const colors = {
    critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' },
    urgent: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800' },
    info: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' },
    financial: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' },
    pattern: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800' },
    'best-practice': { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-800' }
  }
  return colors[type] || colors.info
}

export default {
  generateFineRecommendations,
  generateDashboardRecommendations,
  getRecommendationColor
}

