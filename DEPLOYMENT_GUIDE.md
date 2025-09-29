# TwilioChat Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- SQLite (included with Node.js)
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

#### SQLite Database (Default)
The app uses SQLite database by default. No additional setup required.

#### Optional: Use Oracle Database
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

### SQLite Database (Default)
- **Pros**: No setup required, persistent data, fast, production-ready
- **Cons**: Single-user access (suitable for most use cases)
- **Use case**: Development, testing, production (small to medium scale)

### Oracle Database (Optional)
- **Pros**: Multi-user, enterprise features, high concurrency
- **Cons**: Requires Oracle setup and licensing
- **Use case**: Enterprise production environments

### Switching Database Types
Set the `DATABASE_TYPE` environment variable:
- `sqlite` - SQLite database (default)
- `oracle` - Oracle database

## 🔧 Configuration Options

### Environment Variables
```env
# Database (SQLite is default)
DATABASE_TYPE=sqlite
SQLITE_DB_PATH=./database.sqlite

# Oracle Database (Optional)
# DATABASE_TYPE=oracle
# ORACLE_USER=crm
# ORACLE_PASSWORD=crm
# ORACLE_CONNECT_STRING=localhost:1521/XE

# Twilio (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
WEBHOOK_URL=https://your-domain.com/api/twilio/webhook

# Application
NODE_ENV=development
PORT=3000
```

## 📱 Features

### ✅ Implemented
- **Authentication System**: Login/logout with session management
- **Agent Management**: Add, edit, delete agents with role-based permissions
- **Contact Management**: Manage customer contacts and information
- **Chat Interface**: WhatsApp integration via Twilio
- **Real-time Messaging**: Live chat functionality
- **Database Support**: SQLite (default) and Oracle database
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
1. **SQLite**: Check file permissions and disk space
2. **Oracle**: Verify Oracle service is running, check connection string format, ensure user has proper permissions

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
- [ ] Configure environment variables (SQLite works out of the box)
- [ ] Set up Oracle database (if using Oracle instead of SQLite)
- [ ] Test login functionality
- [ ] Verify all features work
- [ ] Set up ngrok for external access

### After Deployment
- [ ] Test external access via ngrok URL
- [ ] Verify database persistence (SQLite file should be created)
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
4. Test with SQLite database (default)

## 🎯 Next Steps

1. **Password Security**: Implement bcrypt for password hashing
2. **Session Management**: Add session refresh and better security
3. **Error Handling**: Add comprehensive error handling
4. **Monitoring**: Set up application monitoring and logging
5. **Database Migration**: Consider PostgreSQL/MySQL for high-concurrency production
