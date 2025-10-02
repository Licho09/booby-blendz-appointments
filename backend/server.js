const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
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

// Email-to-SMS notification function for individual appointments
const sendAppointmentEmailSMS = async (appointmentData) => {
  try {
    const { clientName, date, time, duration, price } = appointmentData;
    
    // Use barber phone number and carrier from environment variables
    const barberPhoneNumber = process.env.BARBER_PHONE_NUMBER || '8327080194';
    const barberCarrier = process.env.BARBER_CARRIER || 'verizon';
    
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

// Helper function to split message into SMS-sized chunks
const splitMessageIntoChunks = (message, maxLength = 95) => {
  const chunks = [];
  
  // Split by lines first
  const lines = message.split('\n');
  
  // Find where to split - look for appointment lines
  let currentChunk = '';
  let appointmentCount = 0;
  
  for (const line of lines) {
    // Check if this is an appointment line (starts with number and dot)
    const isAppointmentLine = /^\d+\./.test(line);
    
    if (isAppointmentLine) {
      appointmentCount++;
      
      // If this would be the 3rd appointment and we already have content, split here
      // This ensures only 2 appointments per message
      if (appointmentCount === 3 && currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
        // Start new chunk with a blank line for proper spacing
        currentChunk = '\n' + line;
        continue;
      }
    }
    
    // Add line to current chunk
    currentChunk += (currentChunk.length > 0 ? '\n' : '') + line;
    
    // If chunk gets too long, split it
    if (currentChunk.length > maxLength && chunks.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
};

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Daily morning reminder function with multi-part SMS support
const sendDailyReminderSMS = async (appointmentsCount, appointmentsList = []) => {
  try {
    // Use barber phone number and carrier from environment variables
    const barberPhoneNumber = process.env.BARBER_PHONE_NUMBER || '8327080194';
    const barberCarrier = process.env.BARBER_CARRIER || 'verizon';
    
    const today = new Date();
    const formattedDate = formatDate(today.toISOString().split('T')[0]);
    
    let message;
    
    if (appointmentsCount === 0) {
      message = `You have no appointments today. Enjoy your free day!`;
    } else {
      message = `You have ${appointmentsCount} appointment${appointmentsCount !== 1 ? 's' : ''} today.`;
      
      // If there are appointments, list them (shorter format)
      if (appointmentsList.length > 0) {
        message += '\n\nToday:\n';
        appointmentsList.forEach((appointment, index) => {
          const formattedTime = formatTime(appointment.time);
          message += `${index + 1}. ${appointment.clients.name} ${formattedTime}\n`;
        });
      }
    }
    
    // Split message into chunks
    const messageChunks = splitMessageIntoChunks(message, 95);
    
    console.log(`📱 Sending ${messageChunks.length} SMS part${messageChunks.length !== 1 ? 's' : ''} with 10-second delays...`);
    
    // Get the carrier email address for barber
    const toEmail = getCarrierEmail(barberPhoneNumber, barberCarrier);
    
    // Create transporter
    const transporter = createTransporter();
    
    const results = [];
    
    // Send each chunk with increasing delays
    for (let i = 0; i < messageChunks.length; i++) {
      const chunk = messageChunks[i];
      // Email options
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Daily Appointment Reminder',
        text: chunk,
        html: `<p>${chunk.replace(/\n/g, '<br>')}</p>`
      };
      
      // Send email
      const info = await transporter.sendMail(mailOptions);
      results.push({ part: i + 1, messageId: info.messageId });
      
      console.log(`✅ Part ${i + 1}/${messageChunks.length} sent successfully`);
      
      // Wait with specific delays before sending the next part (except for the last part)
      if (i < messageChunks.length - 1) {
        const delayMinutes = i === 0 ? 1 : 2; // 1 minute after first message, then 2 minutes between all others
        const delayMs = delayMinutes * 60000; // Convert to milliseconds
        
        console.log(`⏳ Waiting ${delayMinutes} minute${delayMinutes !== 1 ? 's' : ''} before sending next part...`);
        await delay(delayMs);
      }
    }
    
    console.log('📱 All SMS parts sent successfully');
    return { success: true, messageId: results, parts: messageChunks.length };
    
  } catch (error) {
    console.error('Error sending daily reminder Email-to-SMS:', error);
    return { success: false, error: error.message };
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Booby_Blendz Email-to-SMS API is running! 💈',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      carriers: '/api/carriers',
      sendSMS: '/api/send-appointment-sms',
      testSMS: '/api/test-sms'
    }
  });
});

// Test SMS endpoint
app.post('/api/test-sms', async (req, res) => {
  try {
    const { phoneNumber, carrier, message } = req.body;
    
    // Use provided values or defaults
    const testPhoneNumber = phoneNumber || process.env.BARBER_PHONE_NUMBER || '8327080194';
    const testCarrier = carrier || process.env.BARBER_CARRIER || 'verizon';
    const testMessage = message || 'Test SMS from Booby_Blendz! 💈';
    
    // Get the carrier email address
    const toEmail = getCarrierEmail(testPhoneNumber, testCarrier);
    
    // Create transporter
    const transporter = createTransporter();
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: 'Test SMS',
      text: testMessage,
      html: `<p>${testMessage}</p>`
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Test SMS sent successfully:', info.messageId);
    res.json({
      success: true,
      message: 'Test SMS sent successfully!',
      messageId: info.messageId,
      details: {
        phoneNumber: testPhoneNumber,
        carrier: testCarrier,
        email: toEmail,
        messageLength: testMessage.length,
        message: testMessage
      }
    });
    
  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test SMS',
      details: error.message
    });
  }
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

// Endpoint to send daily reminder
app.post('/api/send-daily-reminder', async (req, res) => {
  try {
    // Get today's appointments
    const today = new Date().toISOString().split('T')[0];
    const result = await appointmentService.getAppointmentsByDate(today);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch today\'s appointments'
      });
    }
    
    const todaysAppointments = result.appointments || [];
    const appointmentsCount = todaysAppointments.length;
    
    // Send daily reminder
    const reminderResult = await sendDailyReminderSMS(appointmentsCount, todaysAppointments);
    
    if (reminderResult.success) {
      const statusMessage = appointmentsCount === 0 
        ? "Daily reminder sent successfully! You have no appointments today."
        : `Daily reminder sent successfully! Found ${appointmentsCount} appointment${appointmentsCount !== 1 ? 's' : ''} for today.`;
      
      res.json({
        success: true,
        message: statusMessage,
        appointmentsCount,
        messageId: reminderResult.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send daily reminder',
        details: reminderResult.error
      });
    }
    
  } catch (error) {
    console.error('Error in daily reminder endpoint:', error);
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
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const result = await authService.loginUser(username, password);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Login successful',
        token: result.token,
        user: { id: result.user.id, username: result.user.username }
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

// Scheduled job to send daily reminder every morning at 7:30 AM
cron.schedule('30 7 * * *', async () => {
  console.log('🌅 Running daily reminder job...');
  
  try {
    // Get today's appointments
    const today = new Date().toISOString().split('T')[0];
    const result = await appointmentService.getAppointmentsByDate(today);
    
    if (!result.success) {
      console.error('❌ Failed to fetch today\'s appointments for daily reminder:', result.error);
      return;
    }
    
    const todaysAppointments = result.appointments || [];
    const appointmentsCount = todaysAppointments.length;
    
    // Only send reminder if there are appointments today
    if (appointmentsCount > 0) {
      const reminderResult = await sendDailyReminderSMS(appointmentsCount, todaysAppointments);
      
      if (reminderResult.success) {
        console.log(`✅ Daily reminder sent successfully! Found ${appointmentsCount} appointment${appointmentsCount !== 1 ? 's' : ''} for today.`);
      } else {
        console.error('❌ Failed to send daily reminder:', reminderResult.error);
      }
    } else {
      console.log('📅 No appointments scheduled for today, skipping reminder.');
    }
    
  } catch (error) {
    console.error('❌ Error in daily reminder cron job:', error);
  }
}, {
  timezone: "America/Chicago" // Adjust timezone as needed
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Booby_Blendz Email-to-SMS Server running on port ${PORT}`);
  console.log(`📧 Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD)}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📱 Supported carriers: ${Object.keys(CARRIER_EMAILS).join(', ')}`);
  console.log(`⏰ Daily reminder scheduled for 7:30 AM (America/Chicago timezone)`);
});