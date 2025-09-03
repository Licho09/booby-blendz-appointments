const API_BASE_URL = 'http://localhost:3001';

export interface AppointmentData {
  clientName: string;
  date: string;
  time: string;
  duration: number;
  price?: number;
  notes?: string;
  status?: string;
}

export interface SMSResponse {
  success: boolean;
  message?: string;
  messageId?: string;
  error?: string;
  details?: string;
}

export interface Carrier {
  name: string;
  value: string;
  domain: string;
}

export interface CarriersResponse {
  carriers: Carrier[];
}

class SMSService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Send appointment confirmation Email-to-SMS
  async sendAppointmentSMS(appointmentData: AppointmentData): Promise<SMSResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/send-appointment-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send Email-to-SMS');
      }

      return data;
    } catch (error) {
      console.error('Error sending Email-to-SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Get supported carriers
  async getCarriers(): Promise<CarriersResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/carriers`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching carriers:', error);
      return { carriers: [] };
    }
  }

  // Check if the Email-to-SMS service is healthy
  async checkHealth(): Promise<{ status: string; emailConfigured: boolean; supportedCarriers: string[] }> {
    try {
      const response = await fetch(`${this.baseURL}/api/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking Email-to-SMS service health:', error);
      return {
        status: 'unhealthy',
        emailConfigured: false,
        supportedCarriers: [],
      };
    }
  }

  // Test the Email-to-SMS service
  async testSMS(): Promise<SMSResponse> {
    const testAppointment: AppointmentData = {
      clientName: 'Test Client',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      duration: 60,
      price: 25,
      notes: 'Test appointment for Email-to-SMS functionality',
      status: 'pending',
    };

    return this.sendAppointmentSMS(testAppointment);
  }
}

// Export a singleton instance
export const smsService = new SMSService();

// Export the class for testing or custom instances
export default SMSService;
