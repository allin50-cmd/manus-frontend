import React, { useState } from 'react'
import BookingModal from './BookingModal.jsx'
import AIAccountingRecommendations from './AIAccountingRecommendations.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Calculator, TrendingUp, FileText, Users, Briefcase, HardHat, DollarSign, CheckCircle2, Phone, Mail, MapPin, Calendar, ArrowRight, Star } from 'lucide-react'

export default function AccountingServicesPage({ companyData }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [showAIRecommendations, setShowAIRecommendations] = useState(true)
  
  // Demo company data if not provided
  const demoCompanyData = companyData || {
    companyNumber: '12345678',
    name: 'Your Company',
    riskLevel: 'medium',
    complianceScore: 72,
    overdueCount: 2,
    obligationCount: 8,
    annualTurnover: 350000,
    employees: 12,
    industry: 'technology',
    age: 3,
    hasAccountant: false
  }
  
  const serviceCategories = [
    {
      id: 'taxation',
      name: 'Taxation Services',
      icon: Calculator,
      color: 'green',
      description: 'Comprehensive tax planning and compliance services',
      services: [
        'Tax Efficiency Planning',
        'Personal & Corporate Tax Returns',
        'Inheritance Tax Planning',
        'Tax Strategy & Optimization',
        'Entrepreneurs Relief',
        'SEIS & EIS Investment Schemes'
      ]
    },
    {
      id: 'financial',
      name: 'Financial Planning',
      icon: TrendingUp,
      color: 'blue',
      description: 'Strategic financial planning for your future',
      services: [
        'Investment Planning',
        'Retirement Planning',
        'Estate Protection',
        'Corporate Financial Services',
        'Banking & Mortgage Advice',
        'Wealth Management'
      ]
    },
    {
      id: 'company',
      name: 'Company Secretarial & Legal',
      icon: FileText,
      color: 'purple',
      description: 'Company formation and legal compliance',
      services: [
        'Company Formation',
        'File Maintenance',
        'Statutory Returns',
        'Legal Document Preparation',
        'Companies House Filings',
        'Corporate Governance'
      ]
    },
    {
      id: 'consulting',
      name: 'Business Consulting',
      icon: Users,
      color: 'orange',
      description: 'Expert business advisory and risk assessment',
      services: [
        'Business Strategy Consulting',
        'Acquisitions & Disposals',
        'Exit Strategy Planning',
        'Risk Assessment',
        'Business Valuation',
        'Growth Planning'
      ]
    },
    {
      id: 'contracting',
      name: 'Contracting Services',
      icon: Briefcase,
      color: 'indigo',
      description: 'Specialized services for contractors',
      services: [
        'Contractor Accounts',
        'IR35 Contract Reviews',
        'Professional Indemnity Insurance',
        'Contractor Tax Planning',
        'Limited Company Setup',
        'Umbrella Company Advice'
      ]
    },
    {
      id: 'cis',
      name: 'Construction Industry Scheme',
      icon: HardHat,
      color: 'yellow',
      description: 'CIS compliance and reporting',
      services: [
        'HMRC CIS Reporting',
        'CIS Registration',
        'Public Liability Insurance',
        'Indemnity Insurance',
        'CIS Tax Returns',
        'Subcontractor Verification'
      ]
    },
    {
      id: 'payroll',
      name: 'Payroll & Bookkeeping',
      icon: DollarSign,
      color: 'teal',
      description: 'Complete payroll and bookkeeping solutions',
      services: [
        'Payroll Cycle Submissions',
        'Full Bookkeeping Services',
        'PAYE & NI (RTI)',
        'Auto-Enrolment Pensions',
        'Management Accounts',
        'VAT Returns'
      ]
    }
  ]
  
  const packages = [
    {
      name: 'Starter',
      price: 99,
      period: 'month',
      description: 'Perfect for small businesses and startups',
      features: [
        'Basic bookkeeping (50 transactions/month)',
        'Quarterly tax returns',
        'Annual accounts preparation',
        'Email support',
        'Online portal access',
        'Quarterly business review'
      ],
      popular: false,
      color: 'blue'
    },
    {
      name: 'Professional',
      price: 299,
      period: 'month',
      description: 'Ideal for growing businesses',
      features: [
        'Full bookkeeping service',
        'Monthly management accounts',
        'Tax planning & optimization',
        'Payroll services (up to 10 employees)',
        'Quarterly business review',
        'Priority support',
        'Dedicated account manager',
        'VAT returns'
      ],
      popular: true,
      color: 'green'
    },
    {
      name: 'Enterprise',
      price: 799,
      period: 'month',
      description: 'Comprehensive solution for established businesses',
      features: [
        'Comprehensive accounting services',
        'CFO advisory services',
        'Advanced tax strategy & planning',
        'Unlimited payroll',
        'Company secretarial services',
        'Monthly business review',
        'Dedicated account manager',
        '24/7 priority support',
        'Business consulting included'
      ],
      popular: false,
      color: 'purple'
    }
  ]
  
  const addOnServices = [
    { name: 'Company Formation', price: 150, description: 'Complete company setup and registration' },
    { name: 'IR35 Contract Review', price: 250, description: 'Comprehensive IR35 status assessment' },
    { name: 'Business Valuation', price: 500, description: 'Professional business valuation report' },
    { name: 'Exit Strategy Consultation', price: 750, description: 'Strategic exit planning and advice' },
    { name: 'CIS Registration & Setup', price: 200, description: 'Complete CIS registration and setup' }
  ]
  
  const testimonials = [
    {
      name: 'Sarah Mitchell',
      company: 'Tech Innovations Ltd',
      text: 'Devonshire Green transformed our financial management. Their proactive approach saved us thousands in tax.',
      rating: 5
    },
    {
      name: 'James Thompson',
      company: 'Thompson Construction',
      text: 'Excellent CIS support and always available when we need them. Highly recommended!',
      rating: 5
    },
    {
      name: 'Emma Roberts',
      company: 'Roberts Consulting',
      text: 'Professional, knowledgeable, and always responsive. They handle everything so we can focus on our business.',
      rating: 5
    }
  ]
  
  const getIconColor = (color) => {
    const colors = {
      green: 'text-green-400',
      blue: 'text-blue-400',
      purple: 'text-purple-400',
      orange: 'text-orange-400',
      indigo: 'text-indigo-400',
      yellow: 'text-yellow-400',
      teal: 'text-teal-400'
    }
    return colors[color] || 'text-gray-400'
  }
  
  const filteredCategories = selectedCategory === 'all' 
    ? serviceCategories 
    : serviceCategories.filter(cat => cat.id === selectedCategory)
  
  const handleBookConsultation = () => {
    setIsBookingModalOpen(true)
  }
  
  const handleSelectPackage = (packageName) => {
    setSelectedPackage(packageName)
    alert(`Selected ${packageName} package. Proceeding to checkout...`)
  }
  
  return (
    <>
      <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* AI Recommendations Section */}
        {showAIRecommendations && demoCompanyData && (
          <div className="mb-12">
            <AIAccountingRecommendations 
              companyData={demoCompanyData}
              onBookConsultation={handleBookConsultation}
            />
          </div>
        )}
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-500/20 text-green-300 border-green-500/50 text-lg px-4 py-2">
            Professional Accounting Services
          </Badge>
          <h1 className="text-5xl font-bold text-white mb-4">
            Devonshire Green Accountants
          </h1>
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
            Over 90 years of combined professional experience serving businesses across Kent and beyond. 
            Expert accounting, taxation, and financial planning services tailored to your needs.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleBookConsultation}
              className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book Free Consultation
            </Button>
            <Button
              className="bg-white/10 hover:bg-white/20 text-white text-lg px-8 py-6"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call 01959 565 772
            </Button>
          </div>
        </div>
        
        {/* Contact Info Bar */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-12">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex items-center justify-center gap-3">
                <MapPin className="w-6 h-6 text-green-400" />
                <div className="text-left">
                  <div className="text-sm text-gray-400">Location</div>
                  <div className="text-white font-medium">Westerham, Kent TN16 1TW</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Phone className="w-6 h-6 text-green-400" />
                <div className="text-left">
                  <div className="text-sm text-gray-400">Phone</div>
                  <div className="text-white font-medium">01959 565 772</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Mail className="w-6 h-6 text-green-400" />
                <div className="text-left">
                  <div className="text-sm text-gray-400">Email</div>
                  <div className="text-white font-medium">admin@devonshiregreen.uk</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Service Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Services</h2>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Button
              onClick={() => setSelectedCategory('all')}
              className={`${selectedCategory === 'all' ? 'bg-green-600' : 'bg-white/10'} hover:bg-green-700 text-white`}
            >
              All Services
            </Button>
            {serviceCategories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`${selectedCategory === category.id ? 'bg-green-600' : 'bg-white/10'} hover:bg-green-700 text-white`}
              >
                {category.name}
              </Button>
            ))}
          </div>
          
          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => {
              const Icon = category.icon
              return (
                <Card key={category.id} className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-green-500/20 rounded-lg">
                        <Icon className={`w-8 h-8 ${getIconColor(category.color)}`} />
                      </div>
                      <CardTitle className="text-white text-xl">{category.name}</CardTitle>
                    </div>
                    <CardDescription className="text-gray-300">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.services.map((service, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-300">
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={handleBookConsultation}
                      className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        
        {/* Pricing Packages */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">Service Packages</h2>
          <p className="text-gray-300 text-center mb-8">Choose the package that fits your business needs</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, index) => (
              <Card 
                key={index} 
                className={`bg-white/10 backdrop-blur-lg border-white/20 ${pkg.popular ? 'ring-2 ring-green-500' : ''} relative`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-white text-2xl">{pkg.name}</CardTitle>
                  <CardDescription className="text-gray-300">{pkg.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-green-300">£{pkg.price}</span>
                    <span className="text-gray-400">/{pkg.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSelectPackage(pkg.name)}
                    className={`w-full ${pkg.popular ? 'bg-green-600 hover:bg-green-700' : 'bg-white/10 hover:bg-white/20'} text-white`}
                  >
                    Select {pkg.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Add-On Services */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-12">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Add-On Services</CardTitle>
            <CardDescription className="text-gray-300">
              Pay-as-you-go services to complement your package
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addOnServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{service.name}</h3>
                    <p className="text-sm text-gray-400">{service.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-green-300">£{service.price}</div>
                    <Button className="mt-2 bg-green-600 hover:bg-green-700 text-white text-sm" size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Testimonials */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-green-600/20 to-green-800/20 backdrop-blur-lg border-green-500/50">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Business Finances?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Book a complimentary consultation with our expert team. No obligation, just expert advice tailored to your business.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleBookConsultation}
                className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Free Consultation
              </Button>
              <Button
                className="bg-white/10 hover:bg-white/20 text-white text-lg px-8 py-6"
              >
                <Mail className="w-5 h-5 mr-2" />
                Email Us
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}

