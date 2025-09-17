const API_BASE_URL = 'https://booby-blendz-backend.onrender.com/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Flag to prevent multiple redirects
let isRedirecting = false;

// Helper function to make API requests with timeout and retry
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  retries: number = 2
): Promise<any> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...config,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const data = await response.json();

    // Check for authentication errors (401, 403)
    if (response.status === 401 || response.status === 403) {
      console.log('🔐 Authentication token expired, logging out...');
      authAPI.logout();
      
      // Show a user-friendly message and redirect after a delay
      if (typeof window !== 'undefined' && !isRedirecting) {
        isRedirecting = true;
        
        // Check if we're on mobile by looking at user agent
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // On mobile, show a brief message then redirect
          alert('Your session has expired. Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          // On desktop, redirect immediately
          window.location.href = '/';
        }
      }
      
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Retry logic for network errors (but not for auth errors)
    if (retries > 0 && (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch')))) {
      console.log(`Retrying API request (${endpoint}), attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return apiRequest(endpoint, options, retries - 1);
    }
    
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  register: async (userData: { email: string; password: string }) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      isRedirecting = false; // Reset redirect flag on successful login
    }
    
    return response;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Clear any cached data
    localStorage.removeItem('appointments');
    localStorage.removeItem('clients');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!getAuthToken();
  },

  // Check if token exists (no automatic redirect)
  checkTokenExpiration: () => {
    const token = getAuthToken();
    return !!token;
  },
};

// Clients API
export const clientsAPI = {
  getAll: async () => {
    const response = await apiRequest('/clients');
    return response.clients || [];
  },

  create: async (clientData: any) => {
    const response = await apiRequest('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
    return response.client;
  },

  update: async (id: string, clientData: any) => {
    const response = await apiRequest(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
    return response.client;
  },

  delete: async (id: string) => {
    await apiRequest(`/clients/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};

// Appointments API
export const appointmentsAPI = {
  getAll: async () => {
    const response = await apiRequest('/appointments');
    return response.appointments || [];
  },

  create: async (appointmentData: any) => {
    const response = await apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    return response.appointment;
  },

  update: async (id: string, appointmentData: any) => {
    const response = await apiRequest(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
    return response.appointment;
  },

  delete: async (id: string) => {
    await apiRequest(`/appointments/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};

// Statistics API
export const statsAPI = {
  getStats: async () => {
    const response = await apiRequest('/stats');
    return response.stats;
  },

  getEarnings: async () => {
    const response = await apiRequest('/earnings');
    return response.earnings;
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default {
  auth: authAPI,
  clients: clientsAPI,
  appointments: appointmentsAPI,
  stats: statsAPI,
  healthCheck,
};

