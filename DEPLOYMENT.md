# TwilioChat Deployment Guide

This guide covers deploying the TwilioChat application to different environments.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker and Docker Compose (for containerized deployment)
- Oracle Database (optional, for production)

## Quick Start

### 1. Development Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd twilio_new

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### 2. Production Setup

```bash
# Build the application
npm run build

# Start production server
npm start
```

### 3. Docker Deployment

```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Configuration

### Required Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database Configuration
DATABASE_TYPE=memory  # or 'oracle' for Oracle Database

# Oracle Database Configuration (if using Oracle)
ORACLE_USER=crm
ORACLE_PASSWORD=crm
ORACLE_CONNECT_STRING=localhost:1521/ldm

# Twilio Configuration (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
WEBHOOK_URL=https://your-domain.com/api/twilio/webhook

# Application Configuration
NODE_ENV=production
PORT=3000
```

### Database Options

#### In-Memory Database (Default)
- No setup required
- Data is lost on restart
- Good for development and testing

#### Oracle Database
- Requires Oracle Database installation
- Persistent data storage
- Production-ready

## Deployment Options

### 1. Local Development

```bash
# Use the deployment script
./deploy.sh setup    # Initial setup
./deploy.sh dev      # Development mode
```

### 2. Production Server

```bash
# Build and deploy
./deploy.sh build
./deploy.sh start
```

### 3. Docker Deployment

```bash
# Deploy with Docker
./deploy.sh deploy
```

### 4. Cloud Deployment

#### Vercel
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

#### AWS/GCP/Azure
1. Use the Dockerfile for container deployment
2. Set up environment variables
3. Configure load balancer and SSL

## Database Setup

### Oracle Database Setup

1. Install Oracle Database
2. Create user and schema:
   ```sql
   CREATE USER crm IDENTIFIED BY crm;
   GRANT CONNECT, RESOURCE TO crm;
   GRANT CREATE TABLE TO crm;
   ```

3. Update environment variables:
   ```env
   DATABASE_TYPE=oracle
   ORACLE_USER=crm
   ORACLE_PASSWORD=crm
   ORACLE_CONNECT_STRING=localhost:1521/ldm
   ```

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **HTTPS**: Use HTTPS in production
3. **Database**: Use strong passwords for database connections
4. **Twilio**: Keep Twilio credentials secure
5. **CORS**: Configure CORS properly for production domains

## Monitoring and Logs

### Development
- Logs are displayed in the terminal
- Use browser dev tools for client-side debugging

### Production
- Configure logging service (e.g., Winston, Pino)
- Set up monitoring (e.g., PM2, Docker health checks)
- Use external logging services (e.g., LogRocket, Sentry)

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes using port 3000
   npx kill-port 3000
   ```

2. **Database connection errors**
   - Check database service is running
   - Verify connection string
   - Check firewall settings

3. **Twilio webhook errors**
   - Verify webhook URL is accessible
   - Check Twilio credentials
   - Ensure HTTPS in production

### Logs and Debugging

```bash
# View application logs
npm run dev  # Development
npm start    # Production

# Docker logs
docker-compose logs -f app

# Check environment variables
node -e "console.log(process.env)"
```

## Performance Optimization

1. **Database**: Use connection pooling
2. **Caching**: Implement Redis for session storage
3. **CDN**: Use CDN for static assets
4. **Load Balancing**: Use multiple app instances
5. **Monitoring**: Set up performance monitoring

## Backup and Recovery

### Database Backup
```bash
# Oracle backup
exp crm/crm@localhost:1521/ldm file=backup.dmp

# Restore
imp crm/crm@localhost:1521/ldm file=backup.dmp
```

### Application Backup
- Backup source code
- Backup environment configuration
- Backup database data
- Document deployment process

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review application logs
3. Check environment configuration
4. Verify all services are running

## Changelog

- v1.0.0: Initial release with basic chat functionality
- v1.1.0: Added Oracle database support
- v1.2.0: Added Docker deployment
- v1.3.0: Added authentication system
