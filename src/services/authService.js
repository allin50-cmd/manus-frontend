import apiClient from './apiClient.js'
import API_CONFIG from './api.config.js'

class AuthService {
  // Login user
  async login(email, password) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, {
        email,
        password,
      })

      if (response.token) {
        apiClient.setAuthToken(response.token)
        this.setUser(response.user)
      }

      return response
    } catch (error) {
      throw new Error(error.message || 'Login failed')
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, userData)

      if (response.token) {
        apiClient.setAuthToken(response.token)
        this.setUser(response.user)
      }

      return response
    } catch (error) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  // Logout user
  async logout() {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      apiClient.removeAuthToken()
      this.removeUser()
    }
  }

  // Refresh auth token
  async refreshToken() {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REFRESH_TOKEN)

      if (response.token) {
        apiClient.setAuthToken(response.token)
      }

      return response
    } catch (error) {
      // If refresh fails, logout user
      this.logout()
      throw new Error('Session expired')
    }
  }

  // Get current user from localStorage
  getUser() {
    const userStr = localStorage.getItem('fineguard_user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch (error) {
        console.error('Error parsing user data:', error)
        return null
      }
    }
    return null
  }

  // Set user in localStorage
  setUser(user) {
    localStorage.setItem('fineguard_user', JSON.stringify(user))
  }

  // Remove user from localStorage
  removeUser() {
    localStorage.removeItem('fineguard_user')
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!apiClient.getAuthToken()
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_PROFILE)
      this.setUser(response.user)
      return response.user
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch profile')
    }
  }

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.USER_PROFILE, userData)
      this.setUser(response.user)
      return response.user
    } catch (error) {
      throw new Error(error.message || 'Failed to update profile')
    }
  }
}

// Create singleton instance
const authService = new AuthService()

export default authService

