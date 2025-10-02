# 🐳 Docker Deployment Guide

This guide will help you deploy the TwilioChat application to another computer using Docker.

## 📋 Prerequisites

### On the Target Computer:
- **Docker Desktop** installed and running
- **Docker Compose** (usually included with Docker Desktop)
- **Git** (to clone the repository)
- **Internet connection** (to download Docker images)

### Required Information:
- Twilio Account SID and Auth Token
- Domain name (if deploying to production)
- SSL certificates (if using HTTPS)

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

#### For Linux/macOS:
```bash
# Clone the repository
git clone <your-repository-url>
cd twilio_new

# Make the script executable
chmod +x deploy-docker.sh

# Run the deployment script
./deploy-docker.sh
```

#### For Windows:
```cmd
# Clone the repository
git clone <your-repository-url>
cd twilio_new

# Run the deployment script
deploy-docker.bat
```

### Option 2: Manual Deployment

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd twilio_new
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the production environment template
   cp env.production.example env.production
   
   # Edit the file with your actual values
   nano env.production  # or use your preferred editor
   ```

3. **Build and start the application:**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Check the deployment:**
   ```bash
   # Check if containers are running
   docker-compose -f docker-compose.prod.yml ps
   
   # View logs
   docker-compose -f docker-compose.prod.yml logs -f
   ```

## ⚙️ Configuration

### Environment Variables

Edit the `env.production` file with your actual values:

```env
# Database Configuration (SQLite - Default)
DATABASE_TYPE=sqlite
SQLITE_DB_PATH=/app/data/database.sqlite

# Twilio Configuration (Required for WhatsApp functionality)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
WEBHOOK_URL=https://your-domain.com/api/twilio/webhook

# Application Configuration
NODE_ENV=production
NEXTAUTH_SECRET=your-super-secret-key-here-change-this-in-production
NEXTAUTH_URL=https://your-domain.com

# Server Configuration
PORT=3000
HOSTNAME=0.0.0.0
```

### Twilio Setup

1. **Get Twilio Credentials:**
   - Go to [Twilio Console](https://console.twilio.com/)
   - Copy your Account SID and Auth Token
   - Update `env.production` with these values

2. **Configure Webhook URL:**
   - Set `WEBHOOK_URL` to your domain + `/api/twilio/webhook`
   - Example: `https://yourdomain.com/api/twilio/webhook`

## 🌐 Accessing the Application

After successful deployment:

- **Application URL:** http://localhost:3000
- **Default Login:** 
  - Username: `admin`
  - Password: `admin`
- **Health Check:** http://localhost:3000/api/auth/me

## 🔧 Management Commands

### View Logs
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View only app logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Restart Application
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Stop Application
```bash
docker-compose -f docker-compose.prod.yml down
```

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Database Access
```bash
# Access SQLite database
docker-compose -f docker-compose.prod.yml exec app sqlite3 /app/data/database.sqlite

# Backup database
docker-compose -f docker-compose.prod.yml exec app cp /app/data/database.sqlite /app/data/backup-$(date +%Y%m%d).sqlite
```

## 🔒 Production Security

### 1. Change Default Credentials
- Log in with default credentials (`admin`/`admin`)
- Go to Settings and change the admin password
- Create additional user accounts as needed

### 2. SSL/HTTPS Setup
1. **Obtain SSL certificates** (Let's Encrypt recommended)
2. **Uncomment nginx service** in `docker-compose.prod.yml`
3. **Place certificates** in `./ssl/` directory:
   - `cert.pem` (certificate)
   - `key.pem` (private key)
4. **Update nginx configuration** in `nginx.prod.conf`

### 3. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp  # Block direct access to app port
```

## 📊 Monitoring

### Health Checks
The application includes built-in health checks:
- **Container health:** `docker-compose -f docker-compose.prod.yml ps`
- **Application health:** `curl http://localhost:3000/api/auth/me`

### Log Monitoring
```bash
# Monitor logs in real-time
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Save logs to file
docker-compose -f docker-compose.prod.yml logs > app-logs.txt
```

## 🗄️ Data Persistence

### Database Storage
- SQLite database is stored in Docker volume: `app-data`
- Data persists across container restarts and updates
- Location: `/app/data/database.sqlite` inside container

### Backup Strategy
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml exec app cp /app/data/database.sqlite /app/data/backup_$DATE.sqlite
echo "Backup created: backup_$DATE.sqlite"
EOF

chmod +x backup.sh
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 3000
netstat -tulpn | grep :3000

# Kill the process or change port in docker-compose.prod.yml
```

#### 2. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x deploy-docker.sh
```

#### 3. Container Won't Start
```bash
# Check logs for errors
docker-compose -f docker-compose.prod.yml logs app

# Check if environment file exists
ls -la env.production
```

#### 4. Database Issues
```bash
# Reset database (WARNING: This will delete all data)
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

### Getting Help

1. **Check logs:** `docker-compose -f docker-compose.prod.yml logs -f`
2. **Verify configuration:** Ensure `env.production` is properly configured
3. **Test connectivity:** `curl http://localhost:3000/api/auth/me`
4. **Check Docker status:** `docker ps` and `docker-compose -f docker-compose.prod.yml ps`

## 📈 Performance Optimization

### Resource Limits
Add to `docker-compose.prod.yml`:
```yaml
services:
  app:
    # ... existing configuration ...
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Nginx Caching
The included nginx configuration includes:
- Static file caching
- Gzip compression
- Rate limiting
- Security headers

## 🔄 Updates and Maintenance

### Regular Maintenance
1. **Update dependencies:** `npm update` (in development)
2. **Security updates:** Monitor for security patches
3. **Database backups:** Run backup script regularly
4. **Log rotation:** Monitor log file sizes

### Application Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
curl http://localhost:3000/api/auth/me
```

## 📞 Support

For deployment issues:
1. Check this documentation
2. Review application logs
3. Verify environment configuration
4. Test with default SQLite database first

---

**🎉 Congratulations!** Your TwilioChat application is now deployed and ready to use!
