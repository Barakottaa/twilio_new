# TwilioChat Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Oracle Database (optional - can use in-memory database)
- Git installed

### 1. Clone the Repository
```bash
git clone https://github.com/Barakottaa/twilio_new.git
cd twilio_new
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

#### Option A: Use In-Memory Database (Default)
No additional setup required. The app will use the in-memory database by default.

#### Option B: Use Oracle Database
1. Install Oracle Instant Client
2. Create a `.env.local` file:
```env
DATABASE_TYPE=oracle
ORACLE_USER=crm
ORACLE_PASSWORD=crm
ORACLE_CONNECT_STRING=localhost:1521/XE
```

### 4. Start the Application
```bash
npm run dev
```

The application will be available at `http://localhost:9002`

### 5. Login Credentials
- **Username**: `admin`
- **Password**: `admin`

## 🌐 External Access with ngrok

### Install ngrok
```bash
npm install -g ngrok
```

### Start ngrok tunnel
```bash
ngrok http 9002
```

This will provide a stable public URL that doesn't drop like Cloudflare.

## 🗄️ Database Configuration

### In-Memory Database (Default)
- **Pros**: No setup required, fast for development
- **Cons**: Data lost on restart
- **Use case**: Development, testing

### Oracle Database
- **Pros**: Persistent data, production-ready
- **Cons**: Requires Oracle setup
- **Use case**: Production, data persistence

### Switching Database Types
Set the `DATABASE_TYPE` environment variable:
- `memory` - In-memory database
- `oracle` - Oracle database

## 🔧 Configuration Options

### Environment Variables
```env
# Database
DATABASE_TYPE=oracle
ORACLE_USER=crm
ORACLE_PASSWORD=crm
ORACLE_CONNECT_STRING=localhost:1521/XE

# Twilio (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
WEBHOOK_URL=https://your-domain.com/api/twilio/webhook

# Application
NODE_ENV=development
```

## 📱 Features

### ✅ Implemented
- **Authentication System**: Login/logout with session management
- **Agent Management**: Add, edit, delete agents with role-based permissions
- **Contact Management**: Manage customer contacts and information
- **Chat Interface**: WhatsApp integration via Twilio
- **Real-time Messaging**: Live chat functionality
- **Database Support**: Both in-memory and Oracle database
- **Responsive UI**: Modern interface with Tailwind CSS

### 🔄 In Progress
- **Performance Optimization**: Monitoring and testing tools
- **Advanced Analytics**: Conversation metrics and reporting

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

### Project Structure
```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
├── lib/                 # Utility functions and services
├── types/               # TypeScript type definitions
└── hooks/               # Custom React hooks
```

## 🚨 Troubleshooting

### Login Issues
1. Clear browser cookies
2. Check server logs for errors
3. Verify database connection (if using Oracle)

### Database Connection Issues
1. Verify Oracle service is running
2. Check connection string format
3. Ensure user has proper permissions

### Port Conflicts
If port 9002 is in use, modify `package.json`:
```json
{
  "scripts": {
    "dev": "next dev --turbopack -p 9003"
  }
}
```

## 📋 Deployment Checklist

### Before Deployment
- [ ] Set up Oracle database (if using)
- [ ] Configure environment variables
- [ ] Test login functionality
- [ ] Verify all features work
- [ ] Set up ngrok for external access

### After Deployment
- [ ] Test external access via ngrok URL
- [ ] Verify database persistence
- [ ] Check all API endpoints
- [ ] Test Twilio integration (if configured)

## 🔐 Security Notes

- Default admin credentials should be changed in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Consider implementing proper password hashing
- Set up proper session management

## 📞 Support

For issues or questions:
1. Check the GitHub repository: https://github.com/Barakottaa/twilio_new
2. Review server logs for error messages
3. Verify all prerequisites are installed
4. Test with in-memory database first

## 🎯 Next Steps

1. **Production Database**: Set up PostgreSQL or MySQL for production
2. **Password Security**: Implement bcrypt for password hashing
3. **Session Management**: Add session refresh and better security
4. **Error Handling**: Add comprehensive error handling
5. **Monitoring**: Set up application monitoring and logging
