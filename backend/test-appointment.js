const https = require('https');
const http = require('http');

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testAppointmentCreation() {
  try {
    console.log('🧪 Testing appointment creation...');
    
    // First, let's login to get a token
    const loginResponse = await makeRequest('https://booby-blendz-backend.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'luischirinos1000@gmail.com',
        password: 'Fuha3556'
      })
    });
    
    console.log('🔐 Login response:', loginResponse);
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.error);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    // Now try to create an appointment
    const appointmentData = {
      clientName: 'Test Client',
      title: 'Test Appointment',
      date: '2025-01-17',
      time: '10:00',
      duration: 60,
      price: 50,
      notes: 'Test appointment',
      status: 'pending'
    };
    
    console.log('📅 Creating appointment with data:', appointmentData);
    
    const appointmentResponse = await makeRequest('https://booby-blendz-backend.onrender.com/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(appointmentData)
    });
    
    console.log('📅 Appointment creation response:', appointmentResponse);
    console.log('📅 Status code:', appointmentResponse.status);
    
    if (appointmentResponse.status >= 200 && appointmentResponse.status < 300) {
      console.log('✅ Appointment created successfully!');
    } else {
      console.error('❌ Appointment creation failed:', appointmentResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAppointmentCreation();
