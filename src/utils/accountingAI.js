/**
 * AI-Powered Accounting Services Recommendation Engine
 * Analyzes company data and provides intelligent service recommendations
 */

export class AccountingAI {
  constructor() {
    this.recommendations = []
    this.confidence = 0
  }

  /**
   * Analyze company data and recommend accounting services
   */
  analyzeCompany(companyData) {
    const recommendations = []
    let totalScore = 0

    // Extract company metrics
    const {
      companyNumber,
      riskLevel,
      fineguardScore,
      overdueCount,
      obligationCount,
      annualTurnover,
      employees,
      industry,
      age,
      hasAccountant
    } = companyData

    // 1. Tax Planning Recommendation
    const taxScore = this.analyzeTaxNeeds(companyData)
    if (taxScore > 0.6) {
      recommendations.push({
        service: 'Taxation Services',
        priority: taxScore > 0.8 ? 'high' : 'medium',
        confidence: Math.round(taxScore * 100),
        reason: this.getTaxReason(companyData),
        suggestedActions: this.getTaxActions(companyData),
        estimatedSavings: this.estimateTaxSavings(companyData)
      })
      totalScore += taxScore
    }

    // 2. FineGuard & Company Secretarial
    const fineguardNeedScore = this.analyzeFineGuardNeeds(companyData)
    if (fineguardNeedScore > 0.5) {
      recommendations.push({
        service: 'Company Secretarial & Legal',
        priority: fineguardNeedScore > 0.7 ? 'high' : 'medium',
        confidence: Math.round(fineguardNeedScore * 100),
        reason: this.getFineGuardReason(companyData),
        suggestedActions: this.getFineGuardActions(companyData),
        estimatedSavings: null
      })
      totalScore += fineguardNeedScore
    }

    // 3. Payroll & Bookkeeping
    const payrollScore = this.analyzePayrollNeeds(companyData)
    if (payrollScore > 0.5) {
      recommendations.push({
        service: 'Payroll & Bookkeeping',
        priority: payrollScore > 0.7 ? 'high' : 'medium',
        confidence: Math.round(payrollScore * 100),
        reason: this.getPayrollReason(companyData),
        suggestedActions: this.getPayrollActions(companyData),
        estimatedSavings: this.estimatePayrollSavings(companyData)
      })
      totalScore += payrollScore
    }

    // 4. Business Consulting
    const consultingScore = this.analyzeConsultingNeeds(companyData)
    if (consultingScore > 0.6) {
      recommendations.push({
        service: 'Business Consulting',
        priority: consultingScore > 0.8 ? 'high' : 'medium',
        confidence: Math.round(consultingScore * 100),
        reason: this.getConsultingReason(companyData),
        suggestedActions: this.getConsultingActions(companyData),
        estimatedSavings: null
      })
      totalScore += consultingScore
    }

    // 5. Financial Planning
    const financialScore = this.analyzeFinancialPlanningNeeds(companyData)
    if (financialScore > 0.5) {
      recommendations.push({
        service: 'Financial Planning',
        priority: financialScore > 0.7 ? 'high' : 'medium',
        confidence: Math.round(financialScore * 100),
        reason: this.getFinancialReason(companyData),
        suggestedActions: this.getFinancialActions(companyData),
        estimatedSavings: this.estimateFinancialSavings(companyData)
      })
      totalScore += financialScore
    }

    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1
      if (a.priority !== 'high' && b.priority === 'high') return 1
      return b.confidence - a.confidence
    })

    this.recommendations = recommendations
    this.confidence = recommendations.length > 0 ? totalScore / recommendations.length : 0

    return {
      recommendations,
      overallConfidence: Math.round(this.confidence * 100),
      suggestedPackage: this.recommendPackage(companyData),
      estimatedMonthlySavings: this.calculateTotalSavings(recommendations),
      nextSteps: this.generateNextSteps(recommendations)
    }
  }

  /**
   * Analyze tax planning needs
   */
  analyzeTaxNeeds(company) {
    let score = 0

    // High turnover = more tax planning opportunities
    if (company.annualTurnover > 500000) score += 0.4
    else if (company.annualTurnover > 250000) score += 0.3
    else if (company.annualTurnover > 100000) score += 0.2

    // Multiple employees = payroll tax complexity
    if (company.employees > 25) score += 0.2
    else if (company.employees > 10) score += 0.15
    else if (company.employees > 5) score += 0.1

    // Poor fineguard = tax risk
    if (company.fineguardScore < 70) score += 0.2
    if (company.overdueCount > 2) score += 0.15

    // No current accountant = likely missing tax opportunities
    if (!company.hasAccountant) score += 0.25

    return Math.min(score, 1.0)
  }

  /**
   * Analyze fineguard needs
   */
  analyzeFineGuardNeeds(company) {
    let score = 0

    // Overdue obligations = immediate need
    if (company.overdueCount > 3) score += 0.4
    else if (company.overdueCount > 1) score += 0.3
    else if (company.overdueCount > 0) score += 0.2

    // Low fine risk score
    if (company.fineguardScore < 60) score += 0.3
    else if (company.fineguardScore < 75) score += 0.2

    // High risk level
    if (company.riskLevel === 'high') score += 0.3
    else if (company.riskLevel === 'medium') score += 0.15

    // Many obligations to manage
    if (company.obligationCount > 10) score += 0.15

    return Math.min(score, 1.0)
  }

  /**
   * Analyze payroll needs
   */
  analyzePayrollNeeds(company) {
    let score = 0

    // Employee count drives payroll needs
    if (company.employees > 50) score += 0.5
    else if (company.employees > 25) score += 0.4
    else if (company.employees > 10) score += 0.3
    else if (company.employees > 5) score += 0.2
    else if (company.employees > 0) score += 0.1

    // Growing companies need better payroll
    if (company.age < 3 && company.employees > 5) score += 0.2

    // No accountant = likely manual payroll
    if (!company.hasAccountant && company.employees > 0) score += 0.3

    return Math.min(score, 1.0)
  }

  /**
   * Analyze consulting needs
   */
  analyzeConsultingNeeds(company) {
    let score = 0

    // High risk = need strategic guidance
    if (company.riskLevel === 'high') score += 0.4

    // Poor fineguard = operational issues
    if (company.fineguardScore < 65) score += 0.3

    // High turnover = growth opportunities
    if (company.annualTurnover > 1000000) score += 0.3

    // Young company = need guidance
    if (company.age < 2) score += 0.2

    return Math.min(score, 1.0)
  }

  /**
   * Analyze financial planning needs
   */
  analyzeFinancialPlanningNeeds(company) {
    let score = 0

    // High turnover = investment opportunities
    if (company.annualTurnover > 500000) score += 0.3

    // Established company = succession planning
    if (company.age > 10) score += 0.2

    // Large employee base = pension planning
    if (company.employees > 25) score += 0.2

    // Good fineguard = ready for growth
    if (company.fineguardScore > 80) score += 0.2

    return Math.min(score, 1.0)
  }

  /**
   * Recommend appropriate package
   */
  recommendPackage(company) {
    let score = 0

    // Calculate complexity score
    if (company.annualTurnover > 1000000) score += 3
    else if (company.annualTurnover > 500000) score += 2
    else if (company.annualTurnover > 100000) score += 1

    if (company.employees > 50) score += 3
    else if (company.employees > 25) score += 2
    else if (company.employees > 10) score += 1

    if (company.riskLevel === 'high') score += 2
    if (company.fineguardScore < 70) score += 1
    if (company.obligationCount > 15) score += 1

    // Recommend package based on score
    if (score >= 7) {
      return {
        package: 'Enterprise',
        price: 799,
        reason: 'Your business complexity and size require comprehensive CFO-level support',
        confidence: 95
      }
    } else if (score >= 4) {
      return {
        package: 'Professional',
        price: 299,
        reason: 'Your growing business needs dedicated support and tax optimization',
        confidence: 90
      }
    } else {
      return {
        package: 'Starter',
        price: 99,
        reason: 'Perfect starting point for your business accounting needs',
        confidence: 85
      }
    }
  }

  /**
   * Generate specific reasons for recommendations
   */
  getTaxReason(company) {
    if (company.annualTurnover > 500000) {
      return `With annual turnover of £${(company.annualTurnover / 1000).toFixed(0)}k, strategic tax planning could save significant amounts`
    }
    if (!company.hasAccountant) {
      return 'Without professional tax advice, you may be missing valuable tax relief opportunities'
    }
    if (company.fineguardScore < 70) {
      return 'Low fine risk score indicates potential tax filing issues that need attention'
    }
    return 'Proactive tax planning can optimize your tax position and ensure fineguard'
  }

  getFineGuardReason(company) {
    if (company.overdueCount > 2) {
      return `You have ${company.overdueCount} overdue obligations requiring immediate attention`
    }
    if (company.fineguardScore < 65) {
      return `FineGuard score of ${company.fineguardScore}% indicates significant risk exposure`
    }
    return 'Professional company secretarial services ensure you never miss a filing deadline'
  }

  getPayrollReason(company) {
    if (company.employees > 25) {
      return `Managing payroll for ${company.employees} employees requires professional automation`
    }
    if (!company.hasAccountant) {
      return 'Professional payroll services save time and ensure HMRC fineguard'
    }
    return 'Outsourced payroll reduces errors and frees up your time for core business'
  }

  getConsultingReason(company) {
    if (company.riskLevel === 'high') {
      return 'High risk level suggests strategic business consulting could improve operations'
    }
    if (company.annualTurnover > 1000000) {
      return 'Your business size justifies strategic advisory to maximize growth'
    }
    return 'Expert business consulting can identify growth opportunities and efficiency gains'
  }

  getFinancialReason(company) {
    if (company.age > 10) {
      return 'Established businesses benefit from succession and exit planning'
    }
    if (company.annualTurnover > 500000) {
      return 'Your turnover level creates opportunities for investment and wealth planning'
    }
    return 'Financial planning ensures long-term security and tax-efficient growth'
  }

  /**
   * Generate suggested actions
   */
  getTaxActions(company) {
    return [
      'Book tax planning consultation',
      'Review current tax position',
      'Identify available tax reliefs',
      'Optimize salary/dividend mix',
      'Plan for upcoming tax deadlines'
    ]
  }

  getFineGuardActions(company) {
    return [
      'Clear overdue obligations',
      'Set up filing calendar',
      'Review statutory requirements',
      'Implement fineguard system',
      'Schedule regular reviews'
    ]
  }

  getPayrollActions(company) {
    return [
      'Audit current payroll process',
      'Implement automated system',
      'Ensure RTI fineguard',
      'Set up pension auto-enrolment',
      'Review payroll tax efficiency'
    ]
  }

  getConsultingActions(company) {
    return [
      'Business health assessment',
      'Strategic planning session',
      'Operational efficiency review',
      'Growth opportunity analysis',
      'Risk mitigation planning'
    ]
  }

  getFinancialActions(company) {
    return [
      'Financial health check',
      'Investment strategy review',
      'Retirement planning',
      'Estate protection planning',
      'Tax-efficient wealth building'
    ]
  }

  /**
   * Estimate potential savings
   */
  estimateTaxSavings(company) {
    const turnover = company.annualTurnover || 0
    const savingsRate = company.hasAccountant ? 0.02 : 0.05
    const annualSavings = turnover * savingsRate
    return {
      annual: Math.round(annualSavings),
      monthly: Math.round(annualSavings / 12),
      description: `Estimated ${(savingsRate * 100).toFixed(0)}% of turnover through tax optimization`
    }
  }

  estimatePayrollSavings(company) {
    const employees = company.employees || 0
    const monthlySavings = employees * 25 // £25 per employee per month in time savings
    return {
      annual: monthlySavings * 12,
      monthly: monthlySavings,
      description: `Time savings from automated payroll for ${employees} employees`
    }
  }

  estimateFinancialSavings(company) {
    const turnover = company.annualTurnover || 0
    const annualSavings = turnover * 0.03
    return {
      annual: Math.round(annualSavings),
      monthly: Math.round(annualSavings / 12),
      description: 'Investment returns and tax-efficient wealth planning'
    }
  }

  calculateTotalSavings(recommendations) {
    return recommendations.reduce((total, rec) => {
      if (rec.estimatedSavings) {
        return total + rec.estimatedSavings.monthly
      }
      return total
    }, 0)
  }

  /**
   * Generate next steps
   */
  generateNextSteps(recommendations) {
    const steps = []
    
    if (recommendations.length > 0) {
      steps.push({
        step: 1,
        action: 'Book Free Consultation',
        description: 'Schedule a complimentary consultation to discuss your needs',
        urgent: recommendations.some(r => r.priority === 'high')
      })
      
      steps.push({
        step: 2,
        action: 'Service Assessment',
        description: 'Devonshire Green will assess your specific requirements',
        urgent: false
      })
      
      steps.push({
        step: 3,
        action: 'Tailored Proposal',
        description: 'Receive a customized service proposal and pricing',
        urgent: false
      })
      
      steps.push({
        step: 4,
        action: 'Onboarding',
        description: 'Begin working with your dedicated account manager',
        urgent: false
      })
    }
    
    return steps
  }

  /**
   * Smart booking time recommendation
   */
  recommendBookingTime(userPreference = null) {
    const now = new Date()
    const recommendations = []

    // Recommend next available slots
    for (let i = 1; i <= 5; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + i)
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue

      // Recommend morning slots (10 AM, 11 AM)
      recommendations.push({
        date: date.toISOString().split('T')[0],
        time: '10:00 AM',
        score: 0.9,
        reason: 'Popular time, high availability'
      })

      recommendations.push({
        date: date.toISOString().split('T')[0],
        time: '02:00 PM',
        score: 0.85,
        reason: 'Afternoon slot, good availability'
      })

      if (recommendations.length >= 6) break
    }

    return recommendations.slice(0, 6)
  }

  /**
   * Analyze booking patterns and suggest optimal time
   */
  optimizeBookingTime(companyData, userHistory = []) {
    // AI would analyze historical booking patterns
    // For now, return smart defaults
    
    const dayPreference = companyData.industry === 'construction' ? 'early' : 'mid'
    const timeSlots = {
      early: ['09:00 AM', '10:00 AM'],
      mid: ['11:00 AM', '02:00 PM'],
      late: ['03:00 PM', '04:00 PM']
    }

    return {
      recommendedSlots: timeSlots[dayPreference],
      reason: `Based on ${companyData.industry} industry patterns`,
      confidence: 75
    }
  }
}

// Export singleton instance
export const accountingAI = new AccountingAI()

