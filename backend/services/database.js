const { supabase, supabaseAdmin } = require('../supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Authentication functions
const authService = {
  // Register a new user
  async registerUser(email, password) {
    try {
      const passwordHash = await bcrypt.hash(password, 12);
      
      const { data, error } = await supabase
        .from('users')
        .insert([
          { email, password_hash: passwordHash }
        ])
        .select()
        .single();

      if (error) throw error;

      // Generate JWT token
      const token = jwt.sign(
        { userId: data.id, email: data.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return { success: true, user: data, token };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  },

  // Login user
  async loginUser(email, password) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;

      const isValidPassword = await bcrypt.compare(password, data.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: data.id, email: data.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return { success: true, user: data, token };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
};

// Client functions
const clientService = {
  // Get all clients
  async getClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, clients: data };
    } catch (error) {
      console.error('Get clients error:', error);
      return { success: false, error: error.message };
    }
  },

  // Create new client
  async createClient(clientData) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, client: data };
    } catch (error) {
      console.error('Create client error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update client
  async updateClient(id, updates) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, client: data };
    } catch (error) {
      console.error('Update client error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete client
  async deleteClient(id) {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete client error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Appointment functions
const appointmentService = {
  // Get all appointments
  async getAppointments() {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (
            id,
            name,
            phone,
            email
          )
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      return { success: true, appointments: data };
    } catch (error) {
      console.error('Get appointments error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get appointments by date range
  async getAppointmentsByDateRange(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (
            id,
            name,
            phone,
            email
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      return { success: true, appointments: data };
    } catch (error) {
      console.error('Get appointments by date range error:', error);
      return { success: false, error: error.message };
    }
  },

  // Create new appointment
  async createAppointment(appointmentData) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select(`
          *,
          clients (
            id,
            name,
            phone,
            email
          )
        `)
        .single();

      if (error) throw error;
      return { success: true, appointment: data };
    } catch (error) {
      console.error('Create appointment error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update appointment
  async updateAppointment(id, updates) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          clients (
            id,
            name,
            phone,
            email
          )
        `)
        .single();

      if (error) throw error;
      return { success: true, appointment: data };
    } catch (error) {
      console.error('Update appointment error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete appointment
  async deleteAppointment(id) {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete appointment error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get appointment statistics
  async getAppointmentStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's appointments
      const { data: todayAppointments, error: todayError } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', today);

      if (todayError) throw todayError;

      // Get scheduled appointments
      const { data: scheduledAppointments, error: scheduledError } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'scheduled');

      if (scheduledError) throw scheduledError;

      // Get total appointments
      const { data: totalAppointments, error: totalError } = await supabase
        .from('appointments')
        .select('*');

      if (totalError) throw totalError;

      // Calculate total earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('appointments')
        .select('price')
        .eq('status', 'completed');

      if (earningsError) throw earningsError;

      const totalEarnings = earningsData.reduce((sum, appt) => sum + parseFloat(appt.price), 0);

      return {
        success: true,
        stats: {
          today: todayAppointments.length,
          scheduled: scheduledAppointments.length,
          total: totalAppointments.length,
          earnings: totalEarnings
        }
      };
    } catch (error) {
      console.error('Get appointment stats error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get earnings summary
  async getEarningsSummary() {
    try {
      const { data, error } = await supabase
        .from('earnings_summary')
        .select('*')
        .order('date', { ascending: false })
        .limit(30); // Last 30 days

      if (error) throw error;
      return { success: true, earnings: data };
    } catch (error) {
      console.error('Get earnings summary error:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = {
  authService,
  clientService,
  appointmentService
};

