import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  companiesService,
  obligationsService,
  documentsService,
  auditLogsService,
} from '../services/dataService.js'
import { useAuth } from './AuthContext.jsx'

const DataContext = createContext(null)

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [companies, setCompanies] = useState([])
  const [obligations, setObligations] = useState([])
  const [documents, setDocuments] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData()
    }
  }, [isAuthenticated])

  // Load all data
  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [companiesData, obligationsData, documentsData, auditLogsData] = await Promise.all([
        companiesService.getAll().catch(() => []),
        obligationsService.getAll().catch(() => []),
        documentsService.getAll().catch(() => []),
        auditLogsService.getAll({ limit: 100 }).catch(() => []),
      ])

      setCompanies(companiesData.companies || companiesData || [])
      setObligations(obligationsData.obligations || obligationsData || [])
      setDocuments(documentsData.documents || documentsData || [])
      setAuditLogs(auditLogsData.logs || auditLogsData || [])
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Refresh specific data
  const refreshCompanies = async () => {
    try {
      const data = await companiesService.getAll()
      setCompanies(data.companies || data || [])
    } catch (err) {
      console.error('Error refreshing companies:', err)
    }
  }

  const refreshObligations = async () => {
    try {
      const data = await obligationsService.getAll()
      setObligations(data.obligations || data || [])
    } catch (err) {
      console.error('Error refreshing obligations:', err)
    }
  }

  const refreshDocuments = async () => {
    try {
      const data = await documentsService.getAll()
      setDocuments(data.documents || data || [])
    } catch (err) {
      console.error('Error refreshing documents:', err)
    }
  }

  const refreshAuditLogs = async () => {
    try {
      const data = await auditLogsService.getAll({ limit: 100 })
      setAuditLogs(data.logs || data || [])
    } catch (err) {
      console.error('Error refreshing audit logs:', err)
    }
  }

  // Add new items
  const addCompany = (company) => {
    setCompanies(prev => [...prev, company])
  }

  const addObligation = (obligation) => {
    setObligations(prev => [...prev, obligation])
  }

  const addDocument = (document) => {
    setDocuments(prev => [...prev, document])
  }

  // Update items
  const updateCompany = (id, updates) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const updateObligation = (id, updates) => {
    setObligations(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
  }

  const updateDocument = (id, updates) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
  }

  // Delete items
  const deleteCompany = (id) => {
    setCompanies(prev => prev.filter(c => c.id !== id))
  }

  const deleteObligation = (id) => {
    setObligations(prev => prev.filter(o => o.id !== id))
  }

  const deleteDocument = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const value = {
    // Data
    companies,
    obligations,
    documents,
    auditLogs,
    loading,
    error,

    // Load functions
    loadAllData,
    refreshCompanies,
    refreshObligations,
    refreshDocuments,
    refreshAuditLogs,

    // Add functions
    addCompany,
    addObligation,
    addDocument,

    // Update functions
    updateCompany,
    updateObligation,
    updateDocument,

    // Delete functions
    deleteCompany,
    deleteObligation,
    deleteDocument,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export default DataContext

