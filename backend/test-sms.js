// Simple test script for email-to-SMS
const http = require('http');

function testSMS() {
  console.log('🧪 Testing Email-to-SMS system...\n');
  
  const postData = JSON.stringify({});
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/send-daily-reminder',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success) {
          console.log('✅ SMS test sent successfully!');
          console.log(`📱 Message: ${response.message}`);
          console.log(`📊 Found ${response.appointmentsCount} appointment${response.appointmentsCount !== 1 ? 's' : ''} for today`);
          console.log(`📧 Message ID: ${response.messageId}`);
        } else {
          console.log('❌ SMS test failed:');
          console.log(`Error: ${response.error}`);
        }
      } catch (error) {
        console.error('❌ Failed to parse response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your backend server is running on port 3001');
  });

  req.write(postData);
  req.end();
}

// Run the test
testSMS();




