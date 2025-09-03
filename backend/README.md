# Booby_Blendz Email-to-SMS Backend

This backend service handles appointment notifications using Email-to-SMS functionality, which sends emails that are delivered as text messages to mobile phones.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# Email Configuration for Email-to-SMS
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration (for frontend)
FRONTEND_URL=http://localhost:5173
```

### 3. Gmail App Password Setup

For Gmail, you need to use an App Password instead of your regular password:

1. Go to your Google Account settings
2. Enable 2-Step Verification if not already enabled
3. Go to Security > App passwords
4. Generate a new app password for "Mail"
5. Use this app password in your `.env` file

### 4. Supported Carriers

The system supports the following mobile carriers for Email-to-SMS:

- AT&T: `@txt.att.net`
- Verizon: `@vtext.com`
- T-Mobile: `@tmomail.net`
- Sprint: `@messaging.sprintpcs.com`
- Boost Mobile: `@myboostmobile.com`
- Cricket: `@mms.cricketwireless.net`
- Metro PCS: `@mymetropcs.com`
- US Cellular: `@email.uscc.net`
- Virgin Mobile: `@vmobl.com`
- Google Fi: `@msg.fi.google.com`

### 5. Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

- `GET /` - Health check
- `GET /api/health` - Service health status
- `GET /api/carriers` - Get supported carriers
- `POST /api/send-appointment-sms` - Send appointment notification

## How Email-to-SMS Works

1. User provides phone number and carrier
2. System converts phone number to carrier-specific email address
3. Email is sent to that address
4. Carrier delivers email as SMS to the phone

Example:
- Phone: 281-555-1234
- Carrier: AT&T
- Email address: 2815551234@txt.att.net
- Result: SMS delivered to the phone

