/**
 * API Client for FineGuard Backend
 * Connects frontend to real backend APIs
 */

const API_BASE_URL = 'https://8000-ikoeu54axz2kkjnwr9zzk-5807ad40.manusvm.computer';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth
  async login(email, password) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = response.token;
    localStorage.setItem('auth_token', response.token);
    return response;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Users
  async getUsers() {
    return await this.request('/api/users');
  }

  async getUser(id) {
    return await this.request(`/api/users/${id}`);
  }

  async createUser(userData) {
    return await this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id, userData) {
    return await this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return await this.request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Companies
  async getCompanies() {
    return await this.request('/api/companies');
  }

  async getCompany(id) {
    return await this.request(`/api/companies/${id}`);
  }

  async createCompany(companyData) {
    return await this.request('/api/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  }

  async updateCompany(id, companyData) {
    return await this.request(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  }

  async deleteCompany(id) {
    return await this.request(`/api/companies/${id}`, {
      method: 'DELETE',
    });
  }

  // Obligations
  async getObligations() {
    return await this.request('/api/obligations');
  }

  async createObligation(obligationData) {
    return await this.request('/api/obligations', {
      method: 'POST',
      body: JSON.stringify(obligationData),
    });
  }

  // Settings
  async getSettings() {
    return await this.request('/api/settings');
  }

  async updateSettings(settings) {
    return await this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // CRM
  async getLeads() {
    return await this.request('/api/crm/leads');
  }

  async createLead(leadData) {
    return await this.request('/api/crm/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  // Bookings
  async createBooking(bookingData) {
    return await this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getBookings() {
    return await this.request('/api/bookings');
  }

  // Generic HTTP methods for flexibility
  async get(endpoint) {
    return await this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return await this.request(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const api = new APIClient();
export default api;

