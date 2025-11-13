import apiClient from './apiClient.js'
import API_CONFIG from './api.config.js'

// Companies Service
export const companiesService = {
  async getAll(params = {}) {
    return apiClient.get(API_CONFIG.ENDPOINTS.COMPANIES, params)
  },

  async getById(id) {
    return apiClient.get(API_CONFIG.ENDPOINTS.COMPANY_BY_ID(id))
  },

  async create(companyData) {
    return apiClient.post(API_CONFIG.ENDPOINTS.COMPANIES, companyData)
  },

  async update(id, companyData) {
    return apiClient.put(API_CONFIG.ENDPOINTS.COMPANY_BY_ID(id), companyData)
  },

  async delete(id) {
    return apiClient.delete(API_CONFIG.ENDPOINTS.COMPANY_BY_ID(id))
  },
}

// Obligations/Deadlines Service
export const obligationsService = {
  async getAll(params = {}) {
    return apiClient.get(API_CONFIG.ENDPOINTS.OBLIGATIONS, params)
  },

  async getById(id) {
    return apiClient.get(API_CONFIG.ENDPOINTS.OBLIGATION_BY_ID(id))
  },

  async create(obligationData) {
    return apiClient.post(API_CONFIG.ENDPOINTS.OBLIGATIONS, obligationData)
  },

  async update(id, obligationData) {
    return apiClient.put(API_CONFIG.ENDPOINTS.OBLIGATION_BY_ID(id), obligationData)
  },

  async delete(id) {
    return apiClient.delete(API_CONFIG.ENDPOINTS.OBLIGATION_BY_ID(id))
  },

  async markComplete(id) {
    return apiClient.post(API_CONFIG.ENDPOINTS.MARK_COMPLETE(id))
  },
}

// Documents Service
export const documentsService = {
  async getAll(params = {}) {
    return apiClient.get(API_CONFIG.ENDPOINTS.DOCUMENTS, params)
  },

  async getById(id) {
    return apiClient.get(API_CONFIG.ENDPOINTS.DOCUMENT_BY_ID(id))
  },

  async upload(file, metadata = {}) {
    return apiClient.uploadFile(API_CONFIG.ENDPOINTS.DOCUMENT_UPLOAD, file, metadata)
  },

  async update(id, documentData) {
    return apiClient.put(API_CONFIG.ENDPOINTS.DOCUMENT_BY_ID(id), documentData)
  },

  async delete(id) {
    return apiClient.delete(API_CONFIG.ENDPOINTS.DOCUMENT_BY_ID(id))
  },

  async download(id, filename) {
    return apiClient.downloadFile(API_CONFIG.ENDPOINTS.DOCUMENT_DOWNLOAD(id), filename)
  },
}

// Reports Service
export const reportsService = {
  async getAll(params = {}) {
    return apiClient.get(API_CONFIG.ENDPOINTS.REPORTS, params)
  },

  async getById(id) {
    return apiClient.get(API_CONFIG.ENDPOINTS.REPORT_BY_ID(id))
  },

  async generate(reportType, params = {}) {
    return apiClient.post(API_CONFIG.ENDPOINTS.REPORT_GENERATE, {
      type: reportType,
      ...params,
    })
  },

  async download(id, filename) {
    return apiClient.downloadFile(API_CONFIG.ENDPOINTS.REPORT_BY_ID(id), filename)
  },
}

// Audit Logs Service
export const auditLogsService = {
  async getAll(params = {}) {
    return apiClient.get(API_CONFIG.ENDPOINTS.AUDIT_LOGS, params)
  },

  async export(params = {}) {
    return apiClient.get(API_CONFIG.ENDPOINTS.AUDIT_LOGS + '/export', params)
  },
}

// Notifications Service
export const notificationsService = {
  async getAll(params = {}) {
    return apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS, params)
  },

  async getSettings() {
    return apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATION_SETTINGS)
  },

  async updateSettings(settings) {
    return apiClient.put(API_CONFIG.ENDPOINTS.NOTIFICATION_SETTINGS, settings)
  },

  async sendTest(channel) {
    return apiClient.post(API_CONFIG.ENDPOINTS.NOTIFICATION_TEST, { channel })
  },
}

// Calendar Service
export const calendarService = {
  async getEvents(params = {}) {
    return apiClient.get(API_CONFIG.ENDPOINTS.CALENDAR_EVENTS, params)
  },
}

// Analytics Service
export const analyticsService = {
  async getOverview(params = {}) {
    return apiClient.get(API_CONFIG.ENDPOINTS.ANALYTICS_OVERVIEW, params)
  },

  async getTrends(params = {}) {
    return apiClient.get(API_CONFIG.ENDPOINTS.ANALYTICS_TRENDS, params)
  },
}

// Users Service
export const usersService = {
  async getAll(params = {}) {
    return apiClient.get(API_CONFIG.ENDPOINTS.USERS, params)
  },

  async getById(id) {
    return apiClient.get(API_CONFIG.ENDPOINTS.USER_BY_ID(id))
  },

  async create(userData) {
    return apiClient.post(API_CONFIG.ENDPOINTS.USERS, userData)
  },

  async update(id, userData) {
    return apiClient.put(API_CONFIG.ENDPOINTS.USER_BY_ID(id), userData)
  },

  async delete(id) {
    return apiClient.delete(API_CONFIG.ENDPOINTS.USER_BY_ID(id))
  },
}

