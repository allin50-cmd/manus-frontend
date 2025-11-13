import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Clock, Filter, Download } from 'lucide-react'

const FineGuardCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // month, week, year
  const [filterStatus, setFilterStatus] = useState('all') // all, overdue, upcoming, completed

  // Sample fineguard deadlines
  const deadlines = [
    { id: 1, title: 'VAT Return Q4', date: '2024-11-15', status: 'upcoming', type: 'tax', priority: 'high' },
    { id: 2, title: 'Annual Accounts Filing', date: '2024-11-20', status: 'upcoming', type: 'filing', priority: 'critical' },
    { id: 3, title: 'PAYE Payment', date: '2024-11-22', status: 'upcoming', type: 'payment', priority: 'high' },
    { id: 4, title: 'Corporation Tax Return', date: '2024-11-25', status: 'upcoming', type: 'tax', priority: 'high' },
    { id: 5, title: 'Confirmation Statement', date: '2024-11-10', status: 'overdue', type: 'filing', priority: 'critical' },
    { id: 6, title: 'P11D Submission', date: '2024-10-30', status: 'completed', type: 'filing', priority: 'medium' },
    { id: 7, title: 'VAT Return Q3', date: '2024-10-15', status: 'completed', type: 'tax', priority: 'high' },
    { id: 8, title: 'Payroll Report', date: '2024-12-05', status: 'upcoming', type: 'report', priority: 'medium' },
    { id: 9, title: 'Directors Meeting Minutes', date: '2024-12-10', status: 'upcoming', type: 'governance', priority: 'low' },
    { id: 10, title: 'Insurance Renewal', date: '2024-12-15', status: 'upcoming', type: 'fineguard', priority: 'medium' },
  ]

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getDeadlinesForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return deadlines.filter(d => d.date === dateStr)
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-300'
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3" />
      case 'overdue': return <AlertTriangle className="w-3 h-3" />
      case 'upcoming': return <Clock className="w-3 h-3" />
      default: return null
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredDeadlines = deadlines.filter(d => {
    if (filterStatus === 'all') return true
    return d.status === filterStatus
  })

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Day headers
    const headers = dayNames.map(day => (
      <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2">
        {day}
      </div>
    ))

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="border border-gray-200 dark:border-gray-700 p-2 min-h-[100px] bg-gray-50 dark:bg-gray-800"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDeadlines = getDeadlinesForDate(day)
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() === currentDate.getMonth() &&
                      new Date().getFullYear() === currentDate.getFullYear()

      days.push(
        <div 
          key={day} 
          className={`border border-gray-200 dark:border-gray-700 p-2 min-h-[100px] ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-900'}`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayDeadlines.map(deadline => (
              <div 
                key={deadline.id}
                className={`text-xs p-1 rounded border ${getStatusColor(deadline.status)} cursor-pointer hover:shadow-sm transition-shadow`}
                title={deadline.title}
              >
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(deadline.priority)}`}></div>
                  <span className="truncate">{deadline.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {headers}
        {days}
      </div>
    )
  }

  const renderUpcomingList = () => {
    const sortedDeadlines = [...filteredDeadlines].sort((a, b) => new Date(a.date) - new Date(b.date))
    
    return (
      <div className="space-y-3">
        {sortedDeadlines.map(deadline => (
          <Card key={deadline.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(deadline.priority)}`}></div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{deadline.title}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(deadline.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {deadline.type}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(deadline.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(deadline.status)}
                      <span>{deadline.status}</span>
                    </div>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = {
    total: deadlines.length,
    overdue: deadlines.filter(d => d.status === 'overdue').length,
    upcoming: deadlines.filter(d => d.status === 'upcoming').length,
    completed: deadlines.filter(d => d.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">FineGuard Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and manage all your fineguard deadlines in one place</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Deadlines</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
                  {getMonthName(currentDate)}
                </h2>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button 
                    variant={viewMode === 'month' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setViewMode('month')}
                  >
                    Month
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    List
                  </Button>
                </div>

                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button 
                    variant={filterStatus === 'all' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                  </Button>
                  <Button 
                    variant={filterStatus === 'overdue' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setFilterStatus('overdue')}
                  >
                    Overdue
                  </Button>
                  <Button 
                    variant={filterStatus === 'upcoming' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setFilterStatus('upcoming')}
                  >
                    Upcoming
                  </Button>
                  <Button 
                    variant={filterStatus === 'completed' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setFilterStatus('completed')}
                  >
                    Completed
                  </Button>
                </div>

                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'list' && renderUpcomingList()}

        {/* Legend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Critical Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Medium Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Low Priority</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FineGuardCalendarPage

