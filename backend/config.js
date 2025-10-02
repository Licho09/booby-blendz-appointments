// Single User Application Configuration
// YOUR LOGIN CREDENTIALS - ONLY YOU CAN LOG IN

module.exports = {
  // YOUR LOGIN CREDENTIALS - Uses environment variables in production, hardcoded in development
  ALLOWED_USERNAME: process.env.ALLOWED_USERNAME || 'txpablito',        // YOUR USERNAME FOR LOGIN
  ALLOWED_PASSWORD: process.env.ALLOWED_PASSWORD || 'Edgardo19956',                       // YOUR PASSWORD FOR LOGIN
  
  // App settings
  APP_NAME: 'Booby Blendz Barbershop',
  APP_DESCRIPTION: 'Single User Appointment Management System'
};
