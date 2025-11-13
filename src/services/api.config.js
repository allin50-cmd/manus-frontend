// API Configuration
const API_CONFIG = {
  // Backend API URL - will be set based on environment
  BASE_URL: import.meta.env.VITE_API_URL || 'https://fineguard-api.azurewebsites.net',
  
  // API endpoints
  ENDPOINTS: {
    // Authentication
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    
    // Companies
    COMPANIES: '/companies',
    COMPANY_BY_ID: (id) => `/companies/${id}`,
    
    // Obligations/Deadlines
    OBLIGATIONS: '/obligations',
    OBLIGATION_BY_ID: (id) => `/obligations/${id}`,
    MARK_COMPLETE: (id) => `/obligations/${id}/complete`,
    
    // Documents
    DOCUMENTS: '/documents',
    DOCUMENT_BY_ID: (id) => `/documents/${id}`,
    DOCUMENT_UPLOAD: '/documents/upload',
    DOCUMENT_DOWNLOAD: (id) => `/documents/${id}/download`,
    
    // Reports
    REPORTS: '/reports',
    REPORT_GENERATE: '/reports/generate',
    REPORT_BY_ID: (id) => `/reports/${id}`,
    
    // Audit Logs
    AUDIT_LOGS: '/audit-logs',
    
    // Notifications
    NOTIFICATIONS: '/notifications',
    NOTIFICATION_SETTINGS: '/notifications/settings',
    NOTIFICATION_TEST: '/notifications/test',
    
    // Calendar
    CALENDAR_EVENTS: '/calendar/events',
    
    // Analytics
    ANALYTICS_OVERVIEW: '/analytics/overview',
    ANALYTICS_TRENDS: '/analytics/trends',
    
    // Users
    USERS: '/users',
    USER_PROFILE: '/users/profile',
    USER_BY_ID: (id) => `/users/${id}`,
  },
  
  // Request timeout (ms)
  TIMEOUT: 30000,
  
  // Retry configuration
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  },
}

export default API_CONFIG

