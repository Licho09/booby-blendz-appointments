const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  const token = localStorage.getItem('authToken');
  console.log('🔑 Auth token:', token ? 'Present' : 'Missing');
  return token;
};

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

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Retry logic for network errors
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
    }
    
    return response;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!getAuthToken();
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
    console.log('🔍 Fetching appointments from API...');
    const response = await apiRequest('/appointments');
    console.log('📋 Appointments response:', response);
    return response.appointments || [];
  },

  create: async (appointmentData: any) => {
    console.log('➕ Creating appointment:', appointmentData);
    const response = await apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    console.log('✅ Appointment created:', response);
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

