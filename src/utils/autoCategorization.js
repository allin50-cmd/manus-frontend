/**
 * Auto-Categorization Engine
 * 
 * Uses NLP-inspired pattern matching and keyword analysis to automatically
 * categorize fines based on title, description, and authority
 */

// Category definitions with keywords and patterns
const CATEGORY_PATTERNS = {
  Tax: {
    keywords: ['tax', 'vat', 'paye', 'corporation tax', 'income tax', 'national insurance', 'ni', 'hmrc', 'self assessment', 'tax return', 'cis'],
    authorities: ['HMRC'],
    weight: 1.0
  },
  Corporate: {
    keywords: ['companies house', 'annual return', 'confirmation statement', 'accounts', 'filing', 'register', 'director', 'shareholder', 'company'],
    authorities: ['Companies House'],
    weight: 1.0
  },
  Payroll: {
    keywords: ['payroll', 'salary', 'wages', 'p45', 'p60', 'p11d', 'employee', 'staff', 'pension', 'auto enrolment'],
    authorities: ['HMRC'],
    weight: 0.9
  },
  'Health & Safety': {
    keywords: ['health', 'safety', 'hse', 'accident', 'injury', 'risk assessment', 'fire', 'hazard', 'ppe', 'workplace'],
    authorities: ['HSE', 'Local Authority'],
    weight: 1.0
  },
  Environmental: {
    keywords: ['environment', 'pollution', 'waste', 'emissions', 'recycling', 'disposal', 'contamination', 'permit'],
    authorities: ['Environment Agency', 'Local Authority'],
    weight: 1.0
  },
  'Financial Regulation': {
    keywords: ['fca', 'financial', 'conduct', 'regulation', 'compliance', 'aml', 'money laundering', 'kyc', 'banking'],
    authorities: ['FCA'],
    weight: 1.0
  },
  'Data Protection': {
    keywords: ['gdpr', 'data protection', 'privacy', 'personal data', 'ico', 'data breach', 'consent', 'dpo'],
    authorities: ['ICO'],
    weight: 1.0
  },
  Planning: {
    keywords: ['planning', 'building', 'construction', 'permit', 'permission', 'development', 'zoning'],
    authorities: ['Local Authority'],
    weight: 0.9
  },
  Licensing: {
    keywords: ['license', 'licence', 'permit', 'alcohol', 'gambling', 'entertainment', 'trading'],
    authorities: ['Local Authority'],
    weight: 0.8
  },
  Employment: {
    keywords: ['employment', 'tribunal', 'discrimination', 'unfair dismissal', 'redundancy', 'contract', 'minimum wage'],
    authorities: ['Employment Tribunal'],
    weight: 0.9
  }
}

/**
 * Automatically categorize a fine based on its properties
 * @param {Object} fine - Fine object with title, description, authority
 * @returns {Object} - Category prediction with confidence score
 */
export function categorizeFine(fine) {
  if (!fine) return { category: 'Uncategorized', confidence: 0, matches: [] }

  // Extract text to analyze
  const textToAnalyze = [
    fine.title || '',
    fine.description || '',
    fine.authority || '',
    fine.type || ''
  ].join(' ').toLowerCase()

  // Score each category
  const categoryScores = {}
  const matchDetails = {}

  for (const [category, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    let score = 0
    const matches = []

    // Check keywords
    for (const keyword of pattern.keywords) {
      if (textToAnalyze.includes(keyword.toLowerCase())) {
        score += pattern.weight
        matches.push({ type: 'keyword', value: keyword })
      }
    }

    // Check authority match (higher weight)
    if (fine.authority && pattern.authorities.includes(fine.authority)) {
      score += pattern.weight * 2 // Authority match is worth 2x
      matches.push({ type: 'authority', value: fine.authority })
    }

    if (score > 0) {
      categoryScores[category] = score
      matchDetails[category] = matches
    }
  }

  // Find best match
  if (Object.keys(categoryScores).length === 0) {
    return {
      category: 'Uncategorized',
      confidence: 0,
      matches: [],
      alternativeCategories: []
    }
  }

  // Sort categories by score
  const sortedCategories = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)

  const [bestCategory, bestScore] = sortedCategories[0]
  
  // Calculate confidence (0-100)
  const maxPossibleScore = 5 // Reasonable max for a good match
  const confidence = Math.min(100, Math.round((bestScore / maxPossibleScore) * 100))

  // Get alternative categories
  const alternativeCategories = sortedCategories
    .slice(1, 4)
    .map(([cat, score]) => ({
      category: cat,
      score,
      confidence: Math.min(100, Math.round((score / maxPossibleScore) * 100))
    }))

  return {
    category: bestCategory,
    confidence,
    matches: matchDetails[bestCategory] || [],
    alternativeCategories
  }
}

/**
 * Batch categorize multiple fines
 * @param {Array} fines - Array of fine objects
 * @returns {Array} - Fines with category predictions
 */
export function batchCategorizeFines(fines) {
  if (!fines || fines.length === 0) return []

  return fines.map(fine => ({
    ...fine,
    autoCategorization: categorizeFine(fine)
  }))
}

/**
 * Get category statistics from a list of fines
 * @param {Array} fines - Array of fine objects
 * @returns {Object} - Category distribution statistics
 */
export function getCategoryStatistics(fines) {
  if (!fines || fines.length === 0) {
    return {
      total: 0,
      byCategory: {},
      uncategorized: 0,
      averageConfidence: 0
    }
  }

  const categorized = batchCategorizeFines(fines)
  const byCategory = {}
  let totalConfidence = 0
  let uncategorized = 0

  categorized.forEach(fine => {
    const cat = fine.autoCategorization.category
    if (cat === 'Uncategorized') {
      uncategorized++
    } else {
      byCategory[cat] = (byCategory[cat] || 0) + 1
      totalConfidence += fine.autoCategorization.confidence
    }
  })

  const averageConfidence = categorized.length > 0
    ? Math.round(totalConfidence / categorized.length)
    : 0

  return {
    total: fines.length,
    byCategory,
    uncategorized,
    averageConfidence,
    categorizedCount: fines.length - uncategorized
  }
}

/**
 * Suggest category improvements based on user corrections
 * This would be used in a real ML system to improve accuracy
 * @param {Object} fine - Fine object
 * @param {string} userCategory - Category chosen by user
 * @param {string} predictedCategory - Category predicted by system
 * @returns {Object} - Learning feedback
 */
export function learnFromCorrection(fine, userCategory, predictedCategory) {
  // In a real system, this would update the model
  // For now, we return feedback for logging
  return {
    fine: fine.id,
    predicted: predictedCategory,
    actual: userCategory,
    wasCorrect: predictedCategory === userCategory,
    timestamp: new Date().toISOString(),
    // Extract new keywords that might be useful
    potentialKeywords: extractKeywords(fine.title + ' ' + fine.description)
  }
}

/**
 * Extract potential keywords from text
 */
function extractKeywords(text) {
  if (!text) return []
  
  // Simple keyword extraction (in a real system, use NLP)
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3) // Only words longer than 3 chars
  
  // Count frequency
  const frequency = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })
  
  // Return top keywords
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
}

/**
 * Get category color for UI display
 */
export function getCategoryColor(category) {
  const colors = {
    'Tax': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    'Corporate': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    'Payroll': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
    'Health & Safety': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    'Environmental': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    'Financial Regulation': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    'Data Protection': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
    'Planning': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    'Licensing': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
    'Employment': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
    'Uncategorized': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
  }
  return colors[category] || colors['Uncategorized']
}

/**
 * Get category icon for UI display
 */
export function getCategoryIcon(category) {
  const icons = {
    'Tax': '💰',
    'Corporate': '🏢',
    'Payroll': '💵',
    'Health & Safety': '🛡️',
    'Environmental': '🌱',
    'Financial Regulation': '📊',
    'Data Protection': '🔒',
    'Planning': '🏗️',
    'Licensing': '📜',
    'Employment': '👥',
    'Uncategorized': '❓'
  }
  return icons[category] || icons['Uncategorized']
}

/**
 * Get all available categories
 */
export function getAllCategories() {
  return Object.keys(CATEGORY_PATTERNS)
}

export default {
  categorizeFine,
  batchCategorizeFines,
  getCategoryStatistics,
  learnFromCorrection,
  getCategoryColor,
  getCategoryIcon,
  getAllCategories
}

