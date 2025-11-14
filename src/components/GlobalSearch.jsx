import React, { useState, useEffect } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const GlobalSearch = ({ data, onResults, placeholder = "Search fines, companies, or deadlines..." }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([])
      setShowResults(false)
      if (onResults) onResults([])
      return
    }

    setIsSearching(true)
    
    // Debounce search
    const timer = setTimeout(() => {
      performSearch(searchTerm)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, data])

  const performSearch = (term) => {
    if (!data || data.length === 0) {
      setSearchResults([])
      return
    }

    const lowerTerm = term.toLowerCase()
    
    const results = data.filter(item => {
      // Search across multiple fields
      const searchableFields = [
        item.title,
        item.companyName,
        item.description,
        item.authority,
        item.category,
        item.status,
        item.assignedTo
      ]

      return searchableFields.some(field => 
        field && field.toLowerCase().includes(lowerTerm)
      )
    })

    setSearchResults(results)
    setShowResults(true)
    
    if (onResults) {
      onResults(results)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSearchResults([])
    setShowResults(false)
    if (onResults) onResults([])
  }

  const highlightMatch = (text, term) => {
    if (!text || !term) return text
    
    const regex = new RegExp(`(${term})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 font-semibold">{part}</mark> : 
        part
    )
  }

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results Count */}
      {searchTerm && (
        <div className="mt-2 text-sm text-gray-600">
          {isSearching ? (
            <span>Searching...</span>
          ) : (
            <span>
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Quick Results Preview (optional) */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute z-50 w-full mt-2 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            <div className="divide-y">
              {searchResults.slice(0, 5).map((result, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    // Handle result click - could navigate to detail page
                    console.log('Selected result:', result)
                  }}
                >
                  <div className="font-semibold text-gray-900">
                    {highlightMatch(result.title, searchTerm)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {result.companyName && (
                      <span>{highlightMatch(result.companyName, searchTerm)}</span>
                    )}
                    {result.authority && (
                      <span className="ml-2 text-gray-500">• {result.authority}</span>
                    )}
                  </div>
                  {result.dueDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Due: {new Date(result.dueDate).toLocaleDateString('en-GB')}
                    </div>
                  )}
                </div>
              ))}
              {searchResults.length > 5 && (
                <div className="p-3 text-center text-sm text-blue-600 hover:bg-gray-50">
                  View all {searchResults.length} results
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default GlobalSearch

