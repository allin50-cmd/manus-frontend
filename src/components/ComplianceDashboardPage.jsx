import React, { useState, useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner.jsx'
import QuickStatsCards from './QuickStatsCards.jsx'
import QuickActions from './QuickActions.jsx'
import RecentActivity from './RecentActivity.jsx'
import UpcomingDeadlines from './UpcomingDeadlines.jsx'
import { demoStats, demoAuditLogs, demoFines } from '../data/demoData.js'
import api from '../utils/api'

const FineGuardDashboardPage = () => {
  const [fineguardData, setFineGuardData] = useState([])
  const [loading, setLoading] = useState(false) // Set to false to show demo data immediately
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(demoStats)
  const [activities, setActivities] = useState(demoAuditLogs)
  const [upcomingFines, setUpcomingFines] = useState(demoFines)

  useEffect(() => {
    // Try to fetch real data from API, but fall back to demo data
    const fetchData = async () => {
      try {
        // Uncomment when backend is ready
        // const response = await api.get('/api/dashboard/stats')
        // setStats(response.stats)
        // setActivities(response.activities)
        // setUpcomingFines(response.upcomingFines)
        
        // For now, use demo data
        setStats(demoStats)
        setActivities(demoAuditLogs)
        setUpcomingFines(demoFines)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        // Fall back to demo data on error
        setStats(demoStats)
        setActivities(demoAuditLogs)
        setUpcomingFines(demoFines)
      }
    }

    fetchData()
  }, [])

  const handleQuickAction = (actionId) => {
    console.log(`Quick action triggered: ${actionId}`)
    // Handle different actions
    switch (actionId) {
      case 'view-calendar':
        window.location.hash = '#compliance-calendar'
        break
      case 'generate-report':
        window.location.hash = '#reports-dashboard'
        break
      case 'manage-notifications':
        window.location.hash = '#notifications-settings'
        break
      case 'add-fine':
        alert('Add New Fine feature coming soon!')
        break
      case 'export-data':
        alert('Export Data feature coming soon!')
        break
      case 'search-fines':
        alert('Search Fines feature coming soon!')
        break
      default:
        alert(`${actionId} feature coming soon!`)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Fine Management Dashboard</h1>
        <LoadingSpinner text="Loading fine management data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Fine Management Dashboard</h1>
        <p className="text-red-500">Error loading dashboard data: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fine Management Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage all your UK regulatory fines and deadlines
          </p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <QuickStatsCards stats={stats} />

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <UpcomingDeadlines deadlines={upcomingFines} />

        {/* Recent Activity */}
        <RecentActivity activities={activities} />
      </div>
    </div>
  )
}

export default FineGuardDashboardPage

