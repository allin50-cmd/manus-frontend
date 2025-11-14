import React, { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const AdvancedFilters = ({ onFilterChange, onReset }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    authority: [],
    category: [],
    dateRange: 'all',
    amountRange: 'all'
  })

  const filterOptions = {
    status: ['pending', 'overdue', 'completed', 'in-progress'],
    priority: ['critical', 'high', 'medium', 'low'],
    authority: ['HMRC', 'Companies House', 'HSE', 'FCA', 'Environment Agency', 'Local Authority'],
    category: ['Tax', 'Corporate', 'Payroll', 'Regulatory', 'Environmental', 'Financial Regulation', 'Planning'],
    dateRange: [
      { value: 'all', label: 'All Time' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'today', label: 'Due Today' },
      { value: 'week', label: 'This Week' },
      { value: 'month', label: 'This Month' },
      { value: 'quarter', label: 'This Quarter' }
    ],
    amountRange: [
      { value: 'all', label: 'All Amounts' },
      { value: '0-500', label: '£0 - £500' },
      { value: '500-1000', label: '£500 - £1,000' },
      { value: '1000-5000', label: '£1,000 - £5,000' },
      { value: '5000+', label: '£5,000+' }
    ]
  }

  const handleFilterChange = (filterType, value) => {
    let newFilters = { ...filters }

    if (filterType === 'dateRange' || filterType === 'amountRange') {
      newFilters[filterType] = value
    } else {
      // Toggle multi-select filters
      if (newFilters[filterType].includes(value)) {
        newFilters[filterType] = newFilters[filterType].filter(v => v !== value)
      } else {
        newFilters[filterType] = [...newFilters[filterType], value]
      }
    }

    setFilters(newFilters)
    
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const handleReset = () => {
    const resetFilters = {
      status: [],
      priority: [],
      authority: [],
      category: [],
      dateRange: 'all',
      amountRange: 'all'
    }
    
    setFilters(resetFilters)
    
    if (onReset) {
      onReset()
    }
    
    if (onFilterChange) {
      onFilterChange(resetFilters)
    }
  }

  const getActiveFilterCount = () => {
    let count = 0
    count += filters.status.length
    count += filters.priority.length
    count += filters.authority.length
    count += filters.category.length
    if (filters.dateRange !== 'all') count++
    if (filters.amountRange !== 'all') count++
    return count
  }

  const activeCount = getActiveFilterCount()

  return (
    <Card className="mb-4">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
            {activeCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReset()
                }}
                className="text-sm"
              >
                Clear All
              </Button>
            )}
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-2">
                {filterOptions.status.map(status => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => handleFilterChange('status', status)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="space-y-2">
                {filterOptions.priority.map(priority => (
                  <label key={priority} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(priority)}
                      onChange={() => handleFilterChange('priority', priority)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm capitalize">{priority}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Authority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Authority</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filterOptions.authority.map(authority => (
                  <label key={authority} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.authority.includes(authority)}
                      onChange={() => handleFilterChange('authority', authority)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{authority}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filterOptions.category.map(category => (
                  <label key={category} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(category)}
                      onChange={() => handleFilterChange('category', category)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {filterOptions.dateRange.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fine Amount</label>
              <select
                value={filters.amountRange}
                onChange={(e) => handleFilterChange('amountRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {filterOptions.amountRange.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default AdvancedFilters

