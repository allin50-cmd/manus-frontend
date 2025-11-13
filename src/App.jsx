import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Moon, Sun, Shield, Building2, AlertTriangle, TrendingUp, Brain, CheckCircle2, Calendar, Bell, Home, Info, Cog, Star, DollarSign, MessageSquare, Phone, Menu, X, User, Users, CreditCard, Code, Workflow, HelpCircle, Calculator, BarChart3, FileText, FolderOpen, CheckSquare, Briefcase, Plug, BookOpen, GraduationCap, Megaphone, Bot, Mail, Zap, Download, Database, Webhook, Layout, Palette, Map } from 'lucide-react'
import './App.css'

// Import images
import heroImage from './assets/IMG_3575(1).jpeg'
import aboutImage from './assets/IMG_3557(1).jpeg'
import howItWorksImage from './assets/IMG_3554(1).jpeg'
import featuresImage from './assets/IMG_3556(1).jpeg'
import pricingImage from './assets/IMG_3561(1).jpeg'
import testimonialsImage from './assets/IMG_3564(1).jpeg'
import contactImage from './assets/IMG_3551(1).jpeg'
import dashboardBg from './assets/IMG_3555(1).jpeg'
import ultraGuardian from './assets/IMG_3577(1).jpeg'
import workshopImage from './assets/IMG_3576(1).jpeg'
import engineRoom from './assets/IMG_3574(1).jpeg'
import navbarDesign from './assets/IMG_3575(2).jpeg'
import footerDesign from './assets/IMG_3577(2).jpeg'
import AdminPage from './components/AdminPage.jsx'
import LiveDataPage from './components/LiveDataPage.jsx'
import AuthModal from './components/AuthModal.jsx'
import MemberDashboard from './components/MemberDashboard.jsx'
import AdvancedCRM from './components/AdvancedCRM.jsx'
import VaultPage from './components/VaultPage.jsx'
import ContactForm from './components/ContactForm.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import AnalyticsPage from './components/AnalyticsPage.jsx'
import BillingPage from './components/BillingPage.jsx'
import NotificationsPage from './components/NotificationsPage.jsx'
import APIManagerPage from './components/APIManagerPage.jsx'
import WorkflowPage from './components/WorkflowPage.jsx'
import TeamPage from './components/TeamPage.jsx'
import HelpPage from './components/HelpPage.jsx'
import AccountingServicesPage from './components/AccountingServicesPage.jsx'
import CRMDashboardPage from './components/CRMDashboardPage.jsx'
import EnhancedAnalyticsPage from './components/EnhancedAnalyticsPage.jsx'
import AccountantTeamPage from './components/AccountantTeamPage.jsx'
import ReportsPage from './components/ReportsPage.jsx'
import DocumentsPage from './components/DocumentsPage.jsx'
import CalendarPage from './components/CalendarPage.jsx'
import TasksPage from './components/TasksPage.jsx'
import InvoicesPage from './components/InvoicesPage.jsx'
import ClientsPage from './components/ClientsPage.jsx'
import ProjectsPage from './components/ProjectsPage.jsx'
import IntegrationsPage from './components/IntegrationsPage.jsx'
import AuditLogPage from './components/AuditLogPage.jsx'
import SupportPage from './components/SupportPage.jsx'
import KnowledgeBasePage from './components/KnowledgeBasePage.jsx'
import TrainingPage from './components/TrainingPage.jsx'
import ComplianceDashboardPage from './components/ComplianceDashboardPage.jsx'
import TaxPlanningPage from './components/TaxPlanningPage.jsx'
import PayrollPage from './components/PayrollPage.jsx'
import MarketingPage from './components/MarketingPage.jsx'
import SalesPage from './components/SalesPage.jsx'
import UserProfilePage from './components/UserProfilePage.jsx'
import AdminControlPanel from './components/AdminControlPanel.jsx'
import AIAgentManagementPage from './components/AIAgentManagementPage.jsx'
import SiteMapPage from './components/SiteMapPage.jsx'
import EmailTemplatesPage from './components/EmailTemplatesPage.jsx'
import AutomationRulesPage from './components/AutomationRulesPage.jsx'
import DataImportExportPage from './components/DataImportExportPage.jsx'
import BackupRestorePage from './components/BackupRestorePage.jsx'
import APIDocumentationPage from './components/APIDocumentationPage.jsx'
import WebhooksManagerPage from './components/WebhooksManagerPage.jsx'
import CustomFieldsPage from './components/CustomFieldsPage.jsx'
import ReportsBuilderPage from './components/ReportsBuilderPage.jsx'
import DashboardBuilderPage from './components/DashboardBuilderPage.jsx'
import WhiteLabelPage from './components/WhiteLabelPage.jsx'

import DatabaseDashboard from './components/DatabaseDashboard.jsx'
import ComplianceCalendarPage from './components/ComplianceCalendarPage.jsx'
import DeadlineTrackerPage from './components/DeadlineTrackerPage.jsx'
import EnhancedDocumentVault from './components/EnhancedDocumentVault.jsx'
import AuditTrailPage from './components/AuditTrailPage.jsx'
import ReportsDashboardPage from './components/ReportsDashboardPage.jsx'
import NotificationsSettingsPage from './components/NotificationsSettingsPage.jsx'
// Demo data
const initialData = {
  companies: [
    {
      id: 1,
      name: "Tech Innovations Ltd",
      companyNumber: "12345678",
      address: "123 Business Park, London, SW1A 1AA",
      riskLevel: "high",
      complianceScore: 65,
      overdueCount: 2,
      obligationCount: 8
    },
    {
      id: 2,
      name: "Global Solutions Ltd",
      companyNumber: "87654321",
      address: "456 Enterprise Road, Manchester, M1 1AB",
      riskLevel: "medium",
      complianceScore: 78,
      overdueCount: 0,
      obligationCount: 6
    },
    {
      id: 3,
      name: "Startup Ventures Ltd",
      companyNumber: "11223344",
      address: "789 Innovation Street, Bristol, BS1 1CD",
      riskLevel: "critical",
      complianceScore: 45,
      overdueCount: 3,
      obligationCount: 5
    }
  ],
  obligations: [
    {
      id: 1,
      companyId: 1,
      companyName: "Tech Innovations Ltd",
      title: "Annual Accounts Filing",
      description: "Submit annual financial statements to Companies House",
      dueDate: "2024-03-15",
      status: "overdue",
      penalty: 1500,
      daysOverdue: 45,
      phoneNumber: "+447912345678"
    },
    {
      id: 2,
      companyId: 1,
      companyName: "Tech Innovations Ltd",
      title: "Confirmation Statement",
      description: "Annual confirmation of company details",
      dueDate: "2024-04-20",
      status: "pending",
      penalty: 0,
      daysOverdue: 0,
      phoneNumber: "+447912345678"
    },
    {
      id: 3,
      companyId: 2,
      companyName: "Global Solutions Ltd",
      title: "VAT Return",
      description: "Quarterly VAT submission to HMRC",
      dueDate: "2024-05-10",
      status: "pending",
      penalty: 0,
      daysOverdue: 0,
      phoneNumber: "+447987654321"
    },
    {
      id: 4,
      companyId: 3,
      companyName: "Startup Ventures Ltd",
      title: "Corporation Tax",
      description: "Corporation tax payment and filing",
      dueDate: "2024-02-28",
      status: "overdue",
      penalty: 2500,
      daysOverdue: 62,
      phoneNumber: "+447445566778"
    },
    {
      id: 5,
      companyId: 3,
      companyName: "Startup Ventures Ltd",
      title: "Annual Accounts Filing",
      description: "Submit annual financial statements",
      dueDate: "2024-01-31",
      status: "overdue",
      penalty: 1800,
      daysOverdue: 90,
      phoneNumber: "+447445566778"
    }
  ]
}

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [currentPage, setCurrentPage] = useState('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [data, setData] = useState(initialData)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [selectedObligation, setSelectedObligation] = useState(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiContent, setAiContent] = useState({ title: '', content: '', loading: false })
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [user, setUser] = useState(null)

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('fineguard_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  // Sync URL hash with currentPage state
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) // Remove the #
      if (hash) {
        setCurrentPage(hash)
      }
    }
    
    // Set initial page from hash
    handleHashChange()
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Update hash when currentPage changes
  useEffect(() => {
    if (currentPage && currentPage !== 'home') {
      window.location.hash = currentPage
    } else {
      window.location.hash = ''
    }
  }, [currentPage])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' }
    return new Date(dateString).toLocaleDateString('en-GB', options)
  }

  const getDaysUntilDue = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due - today
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'low': return 'bg-green-500'
      case 'medium': return 'bg-blue-500'
      case 'high': return 'bg-orange-500'
      case 'critical': return 'bg-red-600'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500'
      case 'overdue': return 'bg-red-600'
      case 'pending': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const stats = {
    overdueCount: data.obligations.filter(o => o.status === 'overdue').length,
    totalCompanies: data.companies.length,
    avgScore: (data.companies.reduce((sum, c) => sum + c.complianceScore, 0) / data.companies.length).toFixed(1),
    penaltyRisk: data.obligations.filter(o => o.status === 'overdue').reduce((sum, o) => sum + o.penalty, 0)
  }

  const markComplete = (obligationId) => {
    setData(prev => ({
      ...prev,
      obligations: prev.obligations.map(o => 
        o.id === obligationId ? { ...o, status: 'completed', penalty: 0 } : o
      ),
      companies: prev.companies.map(c => {
        const obligation = prev.obligations.find(o => o.id === obligationId)
        if (c.id === obligation?.companyId) {
          return { ...c, complianceScore: Math.min(100, c.complianceScore + 5) }
        }
        return c
      })
    }))
    setSelectedObligation(null)
  }

  const getAIMitigationPlan = (company) => {
    setAiModalOpen(true)
    setAiContent({
      title: `AI Mitigation Plan for ${company.name}`,
      content: '',
      loading: true
    })

    setTimeout(() => {
      setAiContent({
        title: `AI Mitigation Plan for ${company.name}`,
        loading: false,
        content: `
**Current Risk Level:** ${company.riskLevel.toUpperCase()}
**Generated:** ${new Date().toLocaleDateString()}

### Immediate Actions Required:
1. **Review Overdue Filings** - Address all overdue obligations within 7 days
2. **Engage Compliance Officer** - Assign dedicated resource for monitoring
3. **Implement Early Warning System** - Set up 30-day advance reminders

### Strategic Recommendations:
- Conduct comprehensive compliance audit
- Implement automated tracking system
- Schedule quarterly compliance reviews
- Establish escalation procedures for high-risk items

### Priority Timeline:
- **Week 1:** Clear all critical overdue items
- **Month 1:** Implement monitoring system
- **Quarter 1:** Achieve 85%+ compliance score
        `
      })
    }, 2000)
  }

  const getAIComplianceChecklist = (obligation) => {
    setAiModalOpen(true)
    setAiContent({
      title: `AI Compliance Checklist: ${obligation.title}`,
      content: '',
      loading: true
    })

    setTimeout(() => {
      setAiContent({
        title: `AI Compliance Checklist: ${obligation.title}`,
        loading: false,
        content: `
### Pre-Submission Requirements:
- Verify company details are up to date
- Gather all required financial documents
- Review previous year's filing for consistency
- Confirm director approvals obtained

### Submission Steps:
1. **Document Preparation** - Ensure all statements are signed
2. **Online Portal Login** - Use Companies House WebFiling service
3. **Data Entry** - Input financial figures accurately
4. **Document Upload** - Attach signed PDF copies
5. **Final Review** - Verify all information before submission
6. **Confirmation** - Save submission reference number

### Post-Submission Actions:
- File confirmation email in company records
- Update internal compliance tracking system
- Schedule reminder for next filing period
- Notify relevant stakeholders of completion
        `
      })
    }, 1500)
  }

  const sortedObligations = [...data.obligations].sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1
    if (b.status === 'overdue' && a.status !== 'overdue') return 1
    return new Date(a.dueDate) - new Date(b.dueDate)
  })

  // Public navigation (marketing pages)
  const publicNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'features', label: 'Features', icon: Star },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'about', label: 'About', icon: Info },
    { id: 'contact', label: 'Contact', icon: MessageSquare }
  ]

  // App navigation (dashboard/tools)
  const appNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'crm', label: 'CRM', icon: Users },
    { id: 'admin', label: 'Admin', icon: Cog },
    { id: 'live-data', label: 'Live Data', icon: Database },
    { id: 'vault', label: 'Vault', icon: Shield },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'clients', label: 'Clients', icon: Users }
  ]

  // Determine which nav to show based on current page
  const isPublicPage = ['home', 'about', 'how-it-works', 'features', 'pricing', 'testimonials', 'contact'].includes(currentPage)
  const navItems = isPublicPage ? publicNavItems : appNavItems

  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <HomePage />
      case 'about':
        return <AboutPage />
      case 'how-it-works':
        return <HowItWorksPage />
      case 'features':
        return <FeaturesPage />
      case 'pricing':
        return <PricingPage />
      case 'testimonials':
        return <TestimonialsPage />
      case 'contact':
        return <ContactPage />
      case 'dashboard':
        return <DashboardPage />
      case 'admin':
        return <AdminPage />
      case 'database':
        return <DatabaseDashboard />
      case 'live-data':
        return <LiveDataPage />
      case 'crm':
        return <AdvancedCRM />
      case 'vault':
        return <VaultPage />
      case 'settings':
        return <SettingsPage user={user} onUpdate={(updatedUser) => setUser(updatedUser)} />
      case 'analytics':
        return <AnalyticsPage />
      case 'billing':
        return <BillingPage user={user} />
      case 'notifications':
        return <NotificationsPage />
      case 'api-manager':
        return <APIManagerPage />
      case 'workflows':
        return <WorkflowPage />
      case 'team':
        return <TeamPage />
      case 'help':
        return <HelpPage />
      case 'accounting-services':
        return <AccountingServicesPage />
      case 'crm-dashboard':
        return <CRMDashboardPage />
      case 'enhanced-analytics':
        return <EnhancedAnalyticsPage />
      case 'accountant-team':
        return <AccountantTeamPage />
      case 'reports':
        return <ReportsPage />
      case 'documents':
        return <DocumentsPage />
      case 'calendar':
        return <CalendarPage />
      case 'tasks':
        return <TasksPage />
      case 'invoices':
        return <InvoicesPage />
      case 'clients':
        return <ClientsPage />
      case 'projects':
        return <ProjectsPage />
      case 'integrations':
        return <IntegrationsPage />
      case 'audit-log':
        return <AuditLogPage />
      case 'support':
        return <SupportPage />
      case 'knowledge-base':
        return <KnowledgeBasePage />
      case 'training':
        return <TrainingPage />
      case 'compliance-dashboard':
        return <ComplianceDashboardPage />
      case 'tax-planning':
        return <TaxPlanningPage />
      case 'payroll':
        return <PayrollPage />
      case 'marketing':
        return <MarketingPage />
      case 'sales':
        return <SalesPage />
      case 'user-profile':
        return <UserProfilePage />
      case 'admin-control':
        return <AdminControlPanel />
      case 'ai-agents':
        return <AIAgentManagementPage />
      case 'site-map':
        return <SiteMapPage />
      case 'email-templates':
        return <EmailTemplatesPage />
      case 'automation-rules':
        return <AutomationRulesPage />
      case 'data-import-export':
        return <DataImportExportPage />
      case 'backup-restore':
        return <BackupRestorePage />
      case 'api-docs':
        return <APIDocumentationPage />
      case 'webhooks':
        return <WebhooksManagerPage />
      case 'custom-fields':
        return <CustomFieldsPage />
      case 'reports-builder':
        return <ReportsBuilderPage />
      case 'dashboard-builder':
        return <DashboardBuilderPage />
      case 'white-label':
        return <WhiteLabelPage />
      case 'compliance-calendar':
        return <ComplianceCalendarPage />
      case 'deadline-tracker':
        return <DeadlineTrackerPage />
      case 'document-vault':
        return <EnhancedDocumentVault />
      case 'audit-trail':
        return <AuditTrailPage />
      case 'reports-dashboard':
        return <ReportsDashboardPage />
      case 'notifications-settings':
        return <NotificationsSettingsPage />
      case 'member':
        return user ? (
          <MemberDashboard 
            user={user} 
            onLogout={() => {
              localStorage.removeItem('fineguard_user')
              setUser(null)
              setCurrentPage('home')
            }}
            onUpgrade={() => setCurrentPage('pricing')}
          />
        ) : (
          <HomePage />
        )
      default:
        return <HomePage />
    }
  }

  // Page Components
  const HomePage = () => (
    <div className="space-y-16">
      {/* Hero Section - Mobile Optimized */}
      <section className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden rounded-xl md:rounded-2xl">
        <img src={heroImage} alt="FineGuard Workshop" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-900/70 to-blue-900/80"></div>
        <div className="relative z-10 text-center text-white px-4 md:px-6 max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">Never Miss a Compliance Deadline Again</h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 opacity-95 max-w-2xl mx-auto">AI-powered compliance management for UK businesses. Automatic deadline tracking, smart reminders, and complete peace of mind.</p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 md:px-10 py-5 md:py-6 text-base md:text-lg font-semibold w-full sm:w-auto" 
              onClick={() => setCurrentPage('pricing')}
              style={{ minHeight: '48px' }}
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-white/80 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 px-8 md:px-10 py-5 md:py-6 text-base md:text-lg font-semibold w-full sm:w-auto" 
              onClick={() => document.querySelector('video')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ minHeight: '48px' }}
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Preview - Mobile Optimized */}
      <section className="container mx-auto px-4 md:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">Why Choose FineGuard?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>AI-Powered Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">FineGuard AI, monitors deadlines 24/7 so you never miss a filing.</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <Bell className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Smart Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Get timely notifications before deadlines with actionable compliance checklists.</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Peace of Mind</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Focus on growing your business while we handle compliance automatically.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">See FineGuard in Action</h2>
          <p className="text-center text-muted-foreground mb-8 text-lg">Watch how FineGuard protects your business from compliance penalties</p>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <video 
              controls 
              className="w-full"
            >
              <source src="/demo-video.mov" type="video/quicktime" />
              <source src="/demo-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 rounded-2xl mx-4">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to protect your business?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of UK businesses using FineGuard</p>
          <Button 
            size="lg" 
            className="bg-white/90 backdrop-blur-md text-blue-900 hover:bg-white rounded-full px-10 py-6 text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all" 
            onClick={() => setCurrentPage('pricing')}
          >
            View Pricing Plans
          </Button>
        </div>
      </section>
    </div>
  )

  const AboutPage = () => (
    <div className="space-y-12">
      <section className="relative min-h-[400px] flex items-center justify-center overflow-hidden rounded-2xl">
        <img src={aboutImage} alt="FineGuard AI Guardian" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-purple-900/30"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">The Story of Protection</h1>
          <p className="text-xl opacity-90">Giving peace of mind to UK founders</p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardContent className="p-8 space-y-6">
            <h2 className="text-3xl font-bold">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              FineGuard was born from a simple truth: small business owners shouldn't lose sleep over compliance deadlines. 
              Every day, brilliant entrepreneurs face the burden of paperwork, filings, and regulations that distract from 
              what they do best—building amazing businesses.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              That's where FineGuard comes in. Our AI guardian watches over your compliance obligations 24/7, ensuring you 
              never miss a deadline, never face unnecessary penalties, and always stay protected. From Companies House 
              filings to HMRC submissions, we've got you covered.
            </p>

          </CardContent>
        </Card>
      </section>
    </div>
  )

  const HowItWorksPage = () => (
    <div className="space-y-12">
      <section className="relative min-h-[400px] flex items-center justify-center overflow-hidden rounded-2xl">
        <img src={howItWorksImage} alt="Engine Room" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/30 to-blue-900/30"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Inside the System</h1>
          <p className="text-xl opacity-90">How FineGuard keeps you compliant</p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl">
        <div className="space-y-8">
          {[
            {
              step: 1,
              title: "Connect Your Business",
              description: "Simply add your company number and we'll sync with Companies House and HMRC to identify all your obligations."
            },
            {
              step: 2,
              title: "FineGuard Monitors Everything",
              description: "Our AI guardian tracks every deadline, regulation change, and filing requirement specific to your business."
            },
            {
              step: 3,
              title: "Smart Reminders",
              description: "Get timely notifications via email, SMS, and dashboard alerts with AI-generated compliance checklists."
            },
            {
              step: 4,
              title: "Stay Protected",
              description: "Never miss a deadline again. Focus on growth while we handle the compliance burden automatically."
            }
          ].map((item) => (
            <Card key={item.step} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8 flex gap-6 items-start">
                <div className="flex-shrink-0 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-lg text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )

  const FeaturesPage = () => (
    <div className="space-y-12">
      <section className="relative min-h-[400px] flex items-center justify-center overflow-hidden rounded-2xl">
        <img src={featuresImage} alt="Features" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-indigo-900/30"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Never Miss a Deadline</h1>
          <p className="text-xl opacity-90">Powerful features for complete peace of mind</p>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "AI Guardian", desc: "FineGuard monitors your obligations 24/7" },
            { icon: Bell, title: "Smart Alerts", desc: "Multi-channel notifications (email, SMS, dashboard)" },
            { icon: Calendar, title: "Deadline Tracking", desc: "Never miss Companies House or HMRC filings" },
            { icon: Brain, title: "AI Checklists", desc: "Step-by-step compliance guidance" },
            { icon: TrendingUp, title: "Risk Scoring", desc: "Real-time compliance health monitoring" },
            { icon: CheckCircle2, title: "Auto-Sync", desc: "Automatic updates from official sources" }
          ].map((feature, idx) => (
            <Card key={idx} className="hover:shadow-xl transition-all hover:-translate-y-1">
              <CardHeader>
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )

  const PricingPage = () => (
    <div className="space-y-8 md:space-y-12">
      <section className="relative min-h-[300px] md:min-h-[400px] flex items-center justify-center overflow-hidden rounded-xl md:rounded-2xl">
        <img src={pricingImage} alt="Pricing" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-blue-900/30"></div>
        <div className="relative z-10 text-center text-white px-4 md:px-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4">Protection for Every Dream</h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90">Transparent pricing, no hidden fees</p>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-1 gap-8 max-w-2xl mx-auto">
          {[
            {
              name: "Starter",
              price: "£1",
              period: "/month",
              popular: true,
              features: [
                "1 company",
                "Basic deadline tracking",
                "Email notifications",
                "SMS message alert",
                "Phone call alert",
                "Compliance dashboard"
              ]
            }
          ].map((plan) => (
            <Card key={plan.name} className={`hover:shadow-2xl transition-all ${plan.popular ? 'border-blue-600 border-2 scale-105' : ''}`}>
              {plan.popular && (
                <div className="bg-blue-600 text-white text-center py-2 rounded-t-lg font-semibold">
                  Most Popular
                </div>
              )}
               <CardHeader className="text-center">
                <CardTitle className="text-xl md:text-2xl">{plan.name}</CardTitle>
                <div className="mt-3 md:mt-4">
                  <span className="text-4xl md:text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-base md:text-lg">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 md:space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full mt-6 py-6 text-base md:text-lg font-semibold" 
                  variant={plan.popular ? "default" : "outline"}
                  style={{ minHeight: '48px' }}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Premium Add-ons Section */}
      <section className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Need Accounting Services?</h2>
          <Card className="border-purple-600 border-2 hover:shadow-2xl transition-all">
            <CardHeader>
              <div className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                  Devonshire Green Accountants
                </CardTitle>
                <p className="text-muted-foreground mt-2">Professional accounting and financial services in Kent</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-gray-700">
                  Over 90 years of combined professional experience serving businesses across Kent and beyond. 
                  Expert accounting, taxation, and financial planning services tailored to your needs.
                </p>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-900">
                    <strong>💡 Partner Service:</strong> Get professional accounting support from our trusted partner, Devonshire Green Accountants.
                  </p>
                </div>
                <a 
                  href="https://devonshiregreen.uk/accountants-kent/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block w-full"
                >
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6">
                    Visit Devonshire Green Accountants →
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )

  const TestimonialsPage = () => (
    <div className="space-y-12">
      <section className="relative min-h-[400px] flex items-center justify-center overflow-hidden rounded-2xl">
        <img src={testimonialsImage} alt="Testimonials" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-900/30 to-blue-900/30"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Voices of Relief</h1>
          <p className="text-xl opacity-90">Trusted by UK businesses nationwide</p>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: "Sarah Mitchell",
              role: "Bakery Owner, London",
              quote: "FineGuard saved me from a £1,500 penalty. FineGuard reminded me about my accounts filing just in time!"
            },
            {
              name: "James Chen",
              role: "Tech Startup Founder",
              quote: "As a first-time founder, compliance was overwhelming. FineGuard made it effortless."
            },
            {
              name: "Emma Thompson",
              role: "Design Studio Director",
              quote: "The AI checklists are brilliant. I know exactly what to do for each filing."
            },
            {
              name: "David Patel",
              role: "Coffee Shop Chain Owner",
              quote: "Managing 3 companies was a nightmare. Now FineGuard handles everything automatically."
            }
          ].map((testimonial, idx) => (
            <Card key={idx} className="hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-4 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-lg mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )

  const ContactPage = () => (
    <div className="space-y-12">
      <section className="relative min-h-[400px] flex items-center justify-center overflow-hidden rounded-2xl">
        <img src={contactImage} alt="Contact" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-indigo-900/30"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Reach Out Anytime</h1>
          <p className="text-xl opacity-90">We're here to help</p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>Fill out the form and we'll respond within 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold">Phone</p>
                  <p className="text-muted-foreground">+44 20 1234 5678</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-muted-foreground">hello@fineguard.co.uk</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold">Address</p>
                  <p className="text-muted-foreground">123 Compliance Street<br/>London, SW1A 1AA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )

  const DashboardPage = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.overdueCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground mt-1">Active monitoring</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Overall health score</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penalty Risk</CardTitle>
            <Bell className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">£{stats.penaltyRisk.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Potential exposure</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Companies Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Companies
            </CardTitle>
            <CardDescription>Manage your registered companies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.companies.map(company => (
              <div
                key={company.id}
                onClick={() => setSelectedCompany(company)}
                className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer bg-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{company.name}</h3>
                  <Badge className={`${getRiskColor(company.riskLevel)} text-white`}>
                    {company.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>#{company.companyNumber}</div>
                  <div className="flex items-center justify-between">
                    <span>Compliance: {company.complianceScore}%</span>
                    <span className="flex items-center gap-1">
                      <i className="fas fa-tasks text-xs"></i>
                      {company.obligationCount} obligations
                    </span>
                  </div>
                  {company.overdueCount > 0 && (
                    <Badge variant="destructive" className="mt-2">
                      {company.overdueCount} overdue
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Obligations Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Obligations
            </CardTitle>
            <CardDescription>Track compliance deadlines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedObligations.map(obligation => {
              const daysUntilDue = getDaysUntilDue(obligation.dueDate)
              return (
                <div
                  key={obligation.id}
                  onClick={() => setSelectedObligation(obligation)}
                  className={`p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer ${
                    obligation.status === 'overdue' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                    obligation.status === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
                    'bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{obligation.title}</h3>
                      <p className="text-sm text-muted-foreground">{obligation.companyName}</p>
                    </div>
                    <Badge className={`${getStatusColor(obligation.status)} text-white text-xs`}>
                      {obligation.status === 'overdue' ? `${obligation.daysOverdue}d overdue` : obligation.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <i className="fas fa-calendar-alt text-xs"></i>
                      {formatDate(obligation.dueDate)}
                      {obligation.status === 'pending' && ` (in ${daysUntilDue} days)`}
                    </span>
                    {obligation.penalty > 0 && obligation.status !== 'completed' && (
                      <span className="font-semibold text-red-600">
                        <i className="fas fa-bell text-xs"></i> £{obligation.penalty.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Glassmorphism */}
      <header className="sticky top-0 z-50 w-full">
        <div className="mx-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-foreground">FineGuard</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full border-cyan-400/30"
                    onClick={() => setCurrentPage('member')}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {user.name}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Sign Up
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-full hover:bg-white/10"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full hover:bg-white/10"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Full Screen Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 z-40 bg-background/98 backdrop-blur-lg animate-in slide-in-from-top">
            <nav className="container px-6 py-8 space-y-3 h-full overflow-y-auto">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-lg text-lg font-medium transition-all duration-200 ${
                    currentPage === item.id 
                      ? 'bg-blue-600 text-white shadow-lg scale-105' 
                      : 'hover:bg-muted active:scale-95'
                  }`}
                  style={{ minHeight: '56px' }}
                >
                  <item.icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </button>
              ))}
              
              {/* Mobile Sign Up/Profile Button */}
              <div className="pt-4 border-t">
                {user ? (
                  <button
                    onClick={() => {
                      setCurrentPage('member')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-lg text-lg font-medium bg-blue-600 text-white"
                    style={{ minHeight: '56px' }}
                  >
                    <User className="h-6 w-6" />
                    <span>{user.name}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAuthModalOpen(true)
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg text-lg font-medium bg-blue-600 text-white shadow-lg"
                    style={{ minHeight: '56px' }}
                  >
                    Sign Up
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6">
        {renderPage()}
      </main>

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCompany(null)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedCompany.name}</span>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCompany(null)}>
                  <i className="fas fa-times"></i>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company Number</p>
                  <p className="font-semibold">{selectedCompany.companyNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <Badge className={`${getRiskColor(selectedCompany.riskLevel)} text-white`}>
                    {selectedCompany.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p>{selectedCompany.address}</p>
                </div>
              </div>

              {(selectedCompany.riskLevel === 'critical' || selectedCompany.riskLevel === 'high') && (
                <Button 
                  className="w-full" 
                  onClick={() => getAIMitigationPlan(selectedCompany)}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  AI Mitigation Plan
                </Button>
              )}

              <div>
                <h3 className="font-semibold mb-2">Obligations</h3>
                <div className="space-y-2">
                  {data.obligations
                    .filter(o => o.companyId === selectedCompany.id)
                    .map(o => (
                      <div key={o.id} className="p-3 border rounded-lg text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{o.title}</span>
                          <Badge className={`${getStatusColor(o.status)} text-white text-xs`}>
                            {o.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs mt-1">Due: {formatDate(o.dueDate)}</p>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Obligation Detail Modal */}
      {selectedObligation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedObligation(null)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedObligation.title}</span>
                <Button variant="ghost" size="icon" onClick={() => setSelectedObligation(null)}>
                  <i className="fas fa-times"></i>
                </Button>
              </CardTitle>
              <CardDescription>{selectedObligation.companyName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`${getStatusColor(selectedObligation.status)} text-white mt-1`}>
                    {selectedObligation.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold">{formatDate(selectedObligation.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Potential Penalty</p>
                  <p className={`font-semibold ${selectedObligation.penalty > 0 && selectedObligation.status !== 'completed' ? 'text-red-600' : 'text-green-600'}`}>
                    £{selectedObligation.penalty.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days {selectedObligation.status === 'overdue' ? 'Overdue' : 'Until Due'}</p>
                  <p className="font-semibold">
                    {selectedObligation.status === 'overdue' ? selectedObligation.daysOverdue : getDaysUntilDue(selectedObligation.dueDate)}
                  </p>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => getAIComplianceChecklist(selectedObligation)}
              >
                <Brain className="mr-2 h-4 w-4" />
                AI Compliance Checklist
              </Button>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedObligation.description}</p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedObligation(null)} className="flex-1">
                  Close
                </Button>
                {selectedObligation.status !== 'completed' && (
                  <Button 
                    onClick={() => markComplete(selectedObligation.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Result Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setAiModalOpen(false)}>
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  {aiContent.title}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setAiModalOpen(false)}>
                  <i className="fas fa-times"></i>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiContent.loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Analyzing compliance data...</p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {aiContent.content.split('\n').map((line, i) => {
                    if (line.startsWith('###')) {
                      return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.replace('###', '').trim()}</h3>
                    } else if (line.startsWith('**')) {
                      return <p key={i} className="font-semibold my-2">{line.replace(/\*\*/g, '')}</p>
                    } else if (line.startsWith('-')) {
                      return <li key={i} className="ml-4">{line.replace('-', '').trim()}</li>
                    } else if (line.match(/^\d+\./)) {
                      return <p key={i} className="my-1">{line}</p>
                    } else if (line.trim()) {
                      return <p key={i} className="my-2">{line}</p>
                    }
                    return null
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer with Glassmorphism */}
      <footer className="mt-16 mb-4">
        <div className="mx-4 rounded-3xl border border-cyan-400/30 bg-background/40 backdrop-blur-xl shadow-lg shadow-cyan-500/20 p-8">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Shield className="h-12 w-12 text-cyan-400" />
                  <div className="absolute inset-0 blur-lg bg-cyan-400/30"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">FineGuard</h3>
                  <p className="text-xs text-muted-foreground">by FineGuard</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <button onClick={() => setCurrentPage('home')} className="text-foreground/70 hover:text-cyan-400 transition-colors">
                  Home
                </button>
                <button onClick={() => setCurrentPage('about')} className="text-foreground/70 hover:text-cyan-400 transition-colors">
                  About
                </button>
                <button onClick={() => setCurrentPage('pricing')} className="text-foreground/70 hover:text-cyan-400 transition-colors">
                  Pricing
                </button>
                <button onClick={() => setCurrentPage('contact')} className="text-foreground/70 hover:text-cyan-400 transition-colors">
                  Contact
                </button>
              </div>

              <div className="flex items-center gap-4">
                <a href="#" className="text-foreground/70 hover:text-cyan-400 transition-colors">
                  <MessageSquare className="h-5 w-5" />
                </a>
                <a href="#" className="text-foreground/70 hover:text-cyan-400 transition-colors">
                  <Phone className="h-5 w-5" />
                </a>
                <a href="#" className="text-foreground/70 hover:text-cyan-400 transition-colors">
                  <Info className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-cyan-400/20 text-center">
              <p className="text-sm text-muted-foreground">
                © 2024 FineGuard. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(userData) => {
          setUser(userData)
          setCurrentPage('member')
        }}
      />
    </div>
  )
}
export default App

