import React, { useState, useEffect, useRef } from 'react'
import { Search, Menu, X, ChevronDown, Shield, LogIn, UserPlus } from 'lucide-react'

const EnhancedNavigation = ({ currentPage, setCurrentPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [activeDropdown, setActiveDropdown] = useState(null)
  const searchRef = useRef(null)

  // Navigation structure with categories
  const navigationCategories = [
    {
      title: 'Dashboard',
      items: [
        { name: 'Home', path: 'home' },
        { name: 'Dashboard', path: 'dashboard' },
        { name: 'Fine Management', path: 'fineguard-dashboard' },
        { name: 'Analytics', path: 'analytics' }
      ]
    },
    {
      title: 'Fine Management',
      items: [
        { name: 'Deadline Tracker', path: 'deadline-tracker' },
        { name: 'Calendar', path: 'fineguard-calendar' },
        { name: 'Fine Details', path: 'fine-details' },
        { name: 'Audit Trail', path: 'audit-trail' }
      ]
    },
    {
      title: 'Documents & Reports',
      items: [
        { name: 'Document Vault', path: 'document-vault' },
        { name: 'Documents', path: 'documents' },
        { name: 'Reports Dashboard', path: 'reports-dashboard' },
        { name: 'Compliance Reports', path: 'compliance-reports' },
        { name: 'Export Center', path: 'export-center' }
      ]
    },
    {
      title: 'Team & Users',
      items: [
        { name: 'Team', path: 'team' },
        { name: 'User Management', path: 'user-management' },
        { name: 'Permissions', path: 'permissions' },
        { name: 'User Profile', path: 'user-profile' }
      ]
    },
    {
      title: 'Settings & Admin',
      items: [
        { name: 'Settings', path: 'settings' },
        { name: 'Admin Panel', path: 'admin' },
        { name: 'Company Details', path: 'company-details' },
        { name: 'Billing', path: 'billing' },
        { name: 'Notifications', path: 'notifications-settings' }
      ]
    }
  ]

  // All pages for search
  const allPages = navigationCategories.flatMap(cat => cat.items)

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = allPages.filter(page =>
        page.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(results.slice(0, 5))
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavigation = (path) => {
    setCurrentPage(path)
    setIsMenuOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setActiveDropdown(null)
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigation('home')}>
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">FineGuard</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Main Nav Items */}
            <div className="flex items-center gap-1">
              {navigationCategories.slice(0, 3).map((category, index) => (
                <div
                  key={index}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(index)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors">
                    {category.title}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown */}
                  {activeDropdown === index && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2">
                      {category.items.map((item, itemIndex) => (
                        <button
                          key={itemIndex}
                          onClick={() => handleNavigation(item.path)}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-100 py-2 max-h-64 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleNavigation(result.path)}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {result.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavigation('login')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
              <button
                onClick={() => handleNavigation('register')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-blue-600"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mobile Navigation Categories */}
            {navigationCategories.map((category, catIndex) => (
              <div key={catIndex} className="border-b border-gray-100 pb-4">
                <h3 className="font-bold text-gray-900 mb-2">{category.title}</h3>
                <div className="space-y-1">
                  {category.items.map((item, itemIndex) => (
                    <button
                      key={itemIndex}
                      onClick={() => handleNavigation(item.path)}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Mobile Auth Buttons */}
            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={() => handleNavigation('login')}
                className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => handleNavigation('register')}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default EnhancedNavigation

