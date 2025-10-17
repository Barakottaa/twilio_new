# PM2 Setup for Twilio + Bird Services

## ⚠️ Current Status

**PM2 is currently disabled** due to service restart loops. Use the simple batch files instead:

### 🚀 Quick Start (Recommended)
```bash
# Start both services in separate windows
start-services.bat

# Start all services including proxy
start-with-proxy.bat
```

## 🔧 PM2 Setup (Advanced)

**Note**: PM2 setup is available but may cause restart loops. Use with caution.

### Start All Services
```bash
# Windows
pm2-scripts.bat start

# Linux/Mac
./pm2-scripts.sh start
```

### Check Status
```bash
pm2 list
```

### View Logs
```bash
pm2 logs
```

### Stop All Services
```bash
pm2 stop all
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `pm2-scripts.bat start` | Start both Twilio and Bird services |
| `pm2-scripts.bat stop` | Stop all services |
| `pm2-scripts.bat restart` | Restart all services |
| `pm2-scripts.bat status` | Show service status |
| `pm2-scripts.bat logs` | Show logs for all services |
| `pm2-scripts.bat monitor` | Open PM2 monitoring dashboard |
| `pm2-scripts.bat setup` | Setup auto-start on boot |

## 🔧 Manual PM2 Commands

### Start Individual Services
```bash
# Start Twilio app
pm2 start start-twilio.js --name "twilio-app"

# Start Bird service
pm2 start "D:\New folder\twilio_new\bird-service-package\start-bird.js" --name "bird-service"
```

### Service Management
```bash
# Restart a specific service
pm2 restart twilio-app
pm2 restart bird-service

# Stop a specific service
pm2 stop twilio-app
pm2 stop bird-service

# Delete a service
pm2 delete twilio-app
pm2 delete bird-service
```

### Monitoring
```bash
# View real-time logs
pm2 logs

# View logs for specific service
pm2 logs twilio-app
pm2 logs bird-service

# Open monitoring dashboard
pm2 monit
```

## ⚙️ Auto-Start Setup

To make services start automatically when your computer boots:

```bash
# Setup PM2 to start on boot
pm2 startup

# Save current process list
pm2 save
```

## 📊 Service Details

| Service | Port | Description |
|---------|------|-------------|
| `twilio-app` | 3000 | Main Twilio WhatsApp application |
| `bird-service` | 3001 | Bird WhatsApp service for templates |

## 🔍 Troubleshooting

### Services Not Starting
1. Check logs: `pm2 logs`
2. Check if ports are available: `netstat -an | findstr :3000`
3. Restart services: `pm2 restart all`

### High Memory Usage
- Services will auto-restart if they exceed 1GB memory
- Monitor with: `pm2 monit`

### Log Files
- Logs are saved in the `logs/` directory
- Each service has separate error and output logs

## 🎯 Benefits of PM2

✅ **Always Running**: Services stay up even if you close terminal  
✅ **Auto-Restart**: Services restart automatically if they crash  
✅ **Log Management**: All logs are saved and accessible  
✅ **Resource Monitoring**: Track CPU and memory usage  
✅ **Easy Management**: Start/stop/restart with simple commands  
✅ **Boot Integration**: Services can start automatically on system boot  

## 📝 Notes

- The reverse proxy is not included in PM2 setup due to dependency issues
- You can still run the proxy manually: `cd bird-service-package && node simple-proxy.js`
- All services are configured to restart automatically on crashes
- Memory limit is set to 1GB per service
