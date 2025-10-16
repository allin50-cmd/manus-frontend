import React, { useState, useEffect } from 'react'
import api from '../utils/api';
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
  
  const [serviceCategories, setServiceCategories] = useState([])
  const [loadingServiceCategories, setLoadingServiceCategories] = useState(true)
  const [errorServiceCategories, setErrorServiceCategories] = useState(null)

  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        setLoadingServiceCategories(true)
        const response = await api.request('get', '/api/accounting/service-categories')
        setServiceCategories(response)
      } catch (error) {
        console.error('Error fetching service categories:', error)
        setErrorServiceCategories('Failed to load service categories.')
      } finally {
        setLoadingServiceCategories(false)
      }
    }
    fetchServiceCategories()
  }, [])

  const [packages, setPackages] = useState([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [errorPackages, setErrorPackages] = useState(null)

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoadingPackages(true)
        const response = await api.request('get', '/api/accounting/packages')
        setPackages(response)
      } catch (error) {
        console.error('Error fetching packages:', error)
        setErrorPackages('Failed to load packages.')
      } finally {
        setLoadingPackages(false)
      }
    }
    fetchPackages()
  }, [])

  const [addOnServices, setAddOnServices] = useState([])
  const [loadingAddOnServices, setLoadingAddOnServices] = useState(true)
  const [errorAddOnServices, setErrorAddOnServices] = useState(null)

  useEffect(() => {
    const fetchAddOnServices = async () => {
      try {
        setLoadingAddOnServices(true)
        const response = await api.request('get', '/api/accounting/add-on-services')
        setAddOnServices(response)
      } catch (error) {
        console.error('Error fetching add-on services:', error)
        setErrorAddOnServices('Failed to load add-on services.')
      } finally {
        setLoadingAddOnServices(false)
      }
    }
    fetchAddOnServices()
  }, [])

  const [testimonials, setTestimonials] = useState([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  const [errorTestimonials, setErrorTestimonials] = useState(null)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoadingTestimonials(true)
        const response = await api.request('get', '/api/accounting/testimonials')
        setTestimonials(response)
      } catch (error) {
        console.error('Error fetching testimonials:', error)
        setErrorTestimonials('Failed to load testimonials.')
      } finally {
        setLoadingTestimonials(false)
      }
    }
    fetchTestimonials()
  }, [])

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

  if (loadingServiceCategories || loadingPackages || loadingAddOnServices || loadingTestimonials) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-8 text-white flex items-center justify-center text-xl">Loading accounting services...</div>
  }

  if (errorServiceCategories || errorPackages || errorAddOnServices || errorTestimonials) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-8 text-red-400 flex items-center justify-center text-xl">Error: {errorServiceCategories || errorPackages || errorAddOnServices || errorTestimonials}</div>
  }
  
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
            {!loading && !error && <div className="text-center py-4 text-muted-foreground">No data available.</div>}
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
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Packages Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Packages</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packages.map((pkg) => (
              <Card key={pkg.name} className={`bg-white/10 backdrop-blur-lg border-white/20 flex flex-col ${pkg.popular ? 'border-green-400' : ''}`}>
                <CardHeader className="text-center">
                  {pkg.popular && <Badge className="absolute top-0 -translate-y-1/2 bg-green-500 text-white">Most Popular</Badge>}
                  <CardTitle className="text-2xl text-white">{pkg.name}</CardTitle>
                  <p className="text-4xl font-bold text-white">£{pkg.price}<span className="text-lg font-normal text-gray-300">/{pkg.period}</span></p>
                  <CardDescription className="text-gray-300">{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6">
                  <Button 
                    onClick={() => handleSelectPackage(pkg.name)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6">
                    Select Package
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Add-on Services */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Optional Add-ons</h2>
          <div className="max-w-3xl mx-auto">
            {addOnServices.map((service, idx) => (
              <Card key={idx} className="bg-white/10 backdrop-blur-lg border-white/20 mb-4">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{service.name}</p>
                    <p className="text-gray-400 text-sm">{service.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">£{service.price}</p>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white mt-1">Add</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4">"{testimonial.text}"</p>
                  <p className="text-white font-bold">{testimonial.name}</p>
                  <p className="text-gray-400">{testimonial.company}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Simplify Your Finances?</h2>
          <p className="text-xl text-gray-300 mb-6">Let our experts handle your accounting needs so you can focus on what you do best.</p>
          <Button
            onClick={handleBookConsultation}
            className="bg-green-600 hover:bg-green-700 text-white text-xl px-10 py-7"
          >
            <Calendar className="w-6 h-6 mr-3" />
            Book Your Free Consultation Today
            <ArrowRight className="w-6 h-6 ml-3" />
          </Button>
        </div>

      </div>
      </div>
    </>
  )
}
