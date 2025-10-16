import React, { useState } from 'react'
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { HelpCircle, Search, Book, MessageSquare, LifeBuoy, ChevronDown, ChevronUp } from 'lucide-react'

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [openFaq, setOpenFaq] = useState(null)
  
  const faqs = [
    {
      q: 'How do I add a new company?',
      a: 'Navigate to the Dashboard, click the "Add New Company" button, and fill in the required details. The system will automatically enrich the company data from Companies House.'
    },
    {
      q: 'What do the different risk levels mean?',
      a: 'Risk levels (low, medium, high) are determined by our AI Lead Scoring Agent based on various factors including compliance history, company size, and industry. High-risk companies may require closer monitoring.'
    },
    {
      q: 'How can I customize my notification preferences?',
      a: 'Go to the Notifications page and scroll down to "Notification Preferences". You can toggle email, push, and SMS notifications for different categories like compliance alerts, payment updates, and AI insights.'
    },
    {
      q: 'How do I generate a new API key?',
      a: 'Visit the API Manager page. Click the "Create New Key" button, give it a name, and set the desired permissions. The new key will be displayed for you to copy.'
    },
    {
      q: 'Can I create custom automation workflows?',
      a: 'Yes, on the Workflow Automation page, you can create custom workflows. Click "Create Workflow", choose a trigger (e.g., "Obligation Overdue"), and add a sequence of actions (e.g., "Send Email", "Create Task").'
    }
  ]
  
  const docs = [
    {
      category: 'Getting Started',
      articles: [
        { title: 'Account Setup & Configuration', link: '#' },
        { title: 'Adding Your First Company', link: '#' },
        { title: 'Understanding the Dashboard', link: '#' },
        { title: 'Navigating the Platform', link: '#' }
      ]
    },
    {
      category: 'Core Features',
      articles: [
        { title: 'Compliance Management', link: '#' },
        { title: 'AI-Powered Insights', link: '#' },
        { title: 'Data Enrichment', link: '#' },
        { title: 'Risk Assessment', link: '#' }
      ]
    },
    {
      category: 'Advanced Features',
      articles: [
        { title: 'Billing & Subscriptions', link: '#' },
        { title: 'Workflow Automation Builder', link: '#' },
        { title: 'API Integration Guide', link: '#' },
        { title: 'Team Management & Roles', link: '#' }
      ]
    },
    {
      category: 'Troubleshooting',
      articles: [
        { title: 'Common Issues & Fixes', link: '#' },
        { title: 'API Error Codes', link: '#' },
        { title: 'Contacting Support', link: '#' }
      ]
    }
  ]
  
  const handleToggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <HelpCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-5xl font-bold text-white mb-2">Help & Documentation</h1>
          <p className="text-xl text-gray-300">Your guide to mastering the FineGuard platform</p>
        </div>
        
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search documentation & FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* FAQs */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden">
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5"
                  onClick={() => handleToggleFaq(index)}
                >
                  <h3 className="text-lg font-semibold text-white">{faq.q}</h3>
                  {openFaq === index ? <ChevronUp className="w-5 h-5 text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-300" />}
                </div>
                {openFaq === index && (
                  <div className="p-4 border-t border-white/10">
                    <p className="text-gray-300">{faq.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
          
          {/* Documentation */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Documentation</h2>
            {docs.map((category, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Book className="w-5 h-5" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.articles.map((article, idx) => (
                      <li key={idx}>
                        <a href={article.link} className="flex items-center gap-2 text-purple-300 hover:text-purple-400 transition-colors">
                          <span>{article.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Contact Support */}
        <Card className="mt-8 bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <LifeBuoy className="w-6 h-6" />
              Need More Help?
            </CardTitle>
            <CardDescription className="text-gray-300">
              If you can't find what you're looking for, our support team is here to assist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <p className="text-gray-300">Contact us via email or live chat for personalized support.</p>
                <p className="text-lg font-semibold text-white mt-2">support@fineguard.com</p>
              </div>
              <div className="flex gap-4">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
                <Button className="bg-white/10 hover:bg-white/20 text-white">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Live Chat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

