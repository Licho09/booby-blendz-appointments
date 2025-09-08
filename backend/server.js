const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Import services and middleware
const { authService, clientService, appointmentService } = require('./services/database');
const { authenticateToken, optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', // Local development
    'https://booby-blendz-appointments.onrender.com', // Deployed frontend
    process.env.FRONTEND_URL // Environment variable override
  ].filter(Boolean), // Remove any undefined values
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Carrier Email-to-SMS mapping
const CARRIER_EMAILS = {
  'att': '@txt.att.net',
  'verizon': '@vtext.com',
  'tmobile': '@tmomail.net',
  'sprint': '@messaging.sprintpcs.com',
  'boost': '@myboostmobile.com',
  'cricket': '@mms.cricketwireless.net',
  'metro': '@mymetropcs.com',
  'uscellular': '@email.uscc.net',
  'virgin': '@vmobl.com',
  'googlefi': '@msg.fi.google.com'
};

// Helper function to format time
const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Helper function to format date
const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // Create date object using local time
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[date.getDay()];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = months[month - 1];
  return `${dayName} ${monthName} ${day}, ${year}`;
};

// Helper function to clean phone number (remove all non-digits)
const cleanPhoneNumber = (phoneNumber) => {
  return phoneNumber.replace(/\D/g, '');
};

// Helper function to get carrier email address
const getCarrierEmail = (phoneNumber, carrier) => {
  const cleanNumber = cleanPhoneNumber(phoneNumber);
  const carrierDomain = CARRIER_EMAILS[carrier.toLowerCase()];
  
  if (!carrierDomain) {
    throw new Error(`Unsupported carrier: ${carrier}`);
  }
  
  return `${cleanNumber}${carrierDomain}`;
};

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD // Use app password for Gmail
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Email-to-SMS notification function
const sendAppointmentEmailSMS = async (appointmentData) => {
  try {
    const { clientName, date, time, duration, price } = appointmentData;
    
    // Use barber phone number and carrier from environment variables
    const barberPhoneNumber = process.env.BARBER_PHONE_NUMBER || '8326807628';
    const barberCarrier = process.env.BARBER_CARRIER || 'tmobile';
    
    const formattedDate = formatDate(date);
    const formattedTime = formatTime(time);
    const durationText = duration === 60 ? '1 hour' : `${duration} minutes`;
    
    const message = `Client: ${clientName}

Date: ${formattedDate}

Time: ${formattedTime}`;
    
    // Get the carrier email address for barber
    const toEmail = getCarrierEmail(barberPhoneNumber, barberCarrier);
    
    // Create transporter
    const transporter = createTransporter();
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: 'New Appointment',
      text: message,
      html: `<p>${message}</p>`
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email-to-SMS sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending Email-to-SMS:', error);
    return { success: false, error: error.message };
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Booby_Blendz Email-to-SMS API is running! 💈',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Endpoint to send appointment confirmation Email-to-SMS
app.post('/api/send-appointment-sms', async (req, res) => {
  try {
    const appointmentData = req.body;
    
    // Validate required fields
    if (!appointmentData.clientName || !appointmentData.date || !appointmentData.time) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required appointment data' 
      });
    }
    
    // Send Email-to-SMS notification
    const result = await sendAppointmentEmailSMS(appointmentData);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Appointment confirmation Email-to-SMS sent successfully!',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send Email-to-SMS',
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in Email-to-SMS endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Authentication routes
// REGISTRATION DISABLED - Single user application only
/*
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await authService.registerUser(email, password);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User registered successfully',
        token: result.token,
        user: { id: result.user.id, email: result.user.email }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
*/

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await authService.loginUser(email, password);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Login successful',
        token: result.token,
        user: { id: result.user.id, email: result.user.email }
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Client routes
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const result = await clientService.getClients();
    
    if (result.success) {
      res.json({
        success: true,
        clients: result.clients
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const clientData = {
      ...req.body,
      userId: '550e8400-e29b-41d4-a716-446655440000'  // Hardcoded single user ID
    };

    const result = await clientService.createClient(clientData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Client created successfully',
        client: result.client
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await clientService.updateClient(id, req.body);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Client updated successfully',
        client: result.client
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await clientService.deleteClient(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Client deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Appointment routes
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const result = await appointmentService.getAppointments();
    
    if (result.success) {
      res.json({
        success: true,
        appointments: result.appointments
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const appointmentData = {
      ...req.body,
      userId: '550e8400-e29b-41d4-a716-446655440000'  // Hardcoded single user ID
    };

    const result = await appointmentService.createAppointment(appointmentData);
    
    if (result.success) {
      // Only send SMS notification if explicitly requested
      if (req.body.sendSMS) {
        try {
          await sendAppointmentEmailSMS({
            clientName: result.appointment.clients.name,
            date: result.appointment.date,
            time: result.appointment.time,
            duration: result.appointment.duration,
            price: result.appointment.price
          });
        } catch (smsError) {
          console.error('SMS notification failed:', smsError);
          // Don't fail the appointment creation if SMS fails
        }
      }

      res.json({
        success: true,
        message: 'Appointment created successfully',
        appointment: result.appointment
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await appointmentService.updateAppointment(id, req.body);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Appointment updated successfully',
        appointment: result.appointment
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await appointmentService.deleteAppointment(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Appointment deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Statistics routes
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const result = await appointmentService.getAppointmentStats();
    
    if (result.success) {
      res.json({
        success: true,
        stats: result.stats
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/earnings', authenticateToken, async (req, res) => {
  try {
    const result = await appointmentService.getEarningsSummary();
    
    if (result.success) {
      res.json({
        success: true,
        earnings: result.earnings
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get supported carriers endpoint
app.get('/api/carriers', (req, res) => {
  const carriers = Object.keys(CARRIER_EMAILS).map(carrier => ({
    name: carrier.toUpperCase(),
    value: carrier,
    domain: CARRIER_EMAILS[carrier]
  }));
  
  res.json({ carriers });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
    supportedCarriers: Object.keys(CARRIER_EMAILS)
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Booby_Blendz Email-to-SMS Server running on port ${PORT}`);
  console.log(`📧 Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD)}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📱 Supported carriers: ${Object.keys(CARRIER_EMAILS).join(', ')}`);
});