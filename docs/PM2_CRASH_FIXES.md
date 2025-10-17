# PM2 Crash Prevention & Fixes

## 🛡️ **Crash Prevention Features Added**

### 1. **Limited Restart Policy**
- **Max Restarts**: 5 attempts (prevents infinite loops)
- **Min Uptime**: 10 seconds (must run stable for 10s)
- **Restart Delay**: 5 seconds between restart attempts
- **Graceful Shutdown**: 5 seconds to shutdown properly

### 2. **Enhanced Error Handling**
- **File Existence Checks**: Verify required files exist before starting
- **Environment Validation**: Check for missing environment variables
- **Graceful Signal Handling**: Proper SIGINT/SIGTERM handling
- **Uncaught Exception Handling**: Catch and log all errors

### 3. **Improved Start Scripts**
- **Better Error Messages**: Detailed error reporting with codes
- **Working Directory Validation**: Ensure scripts run from correct location
- **Process Monitoring**: Track child process lifecycle
- **Exit Code Management**: Proper exit codes for PM2 to understand

### 4. **Diagnostic Tools**
- **Pre-Start Diagnostics**: Check system before starting services
- **Port Availability**: Verify ports are free
- **File System Checks**: Ensure all required files exist
- **Environment Validation**: Check critical environment variables

## 🚀 **How to Use**

### **Start Services with Crash Protection**
```bash
pm2-scripts.bat start
```
This will:
1. Run diagnostics first
2. Start services with crash protection
3. Limit restarts to 5 attempts
4. Log everything to `logs/` directory

### **Run Diagnostics Only**
```bash
pm2-scripts.bat diagnose
```

### **Monitor Services**
```bash
pm2-scripts.bat monitor
```

## 📊 **PM2 Configuration Changes**

### **Before (Problematic)**
```javascript
autorestart: true,  // Infinite restarts
// No restart limits
// No error handling
```

### **After (Fixed)**
```javascript
autorestart: true,
max_restarts: 5,           // Limit to 5 restarts
min_uptime: '10s',         // Must be stable for 10s
restart_delay: 5000,       // 5s delay between restarts
kill_timeout: 5000,        // 5s graceful shutdown
listen_timeout: 10000      // 10s startup timeout
```

## 🔧 **What This Fixes**

### **Infinite Restart Loops**
- ✅ **Fixed**: Services will only restart 5 times max
- ✅ **Fixed**: 5-second delay between restarts
- ✅ **Fixed**: Must run stable for 10 seconds

### **Crash Detection**
- ✅ **Fixed**: Better error handling in start scripts
- ✅ **Fixed**: File existence validation
- ✅ **Fixed**: Environment variable checks
- ✅ **Fixed**: Port availability verification

### **Resource Management**
- ✅ **Fixed**: Graceful shutdown handling
- ✅ **Fixed**: Memory limits (1GB max)
- ✅ **Fixed**: Proper process cleanup

## 📝 **Logging**

All logs are saved to the `logs/` directory:
- `twilio-error.log` - Twilio app errors
- `twilio-out.log` - Twilio app output
- `twilio-combined.log` - Combined Twilio logs
- `bird-error.log` - Bird service errors
- `bird-out.log` - Bird service output
- `bird-combined.log` - Combined Bird logs

## 🚨 **If Services Still Crash**

1. **Check Logs**: Look in `logs/` directory for error details
2. **Run Diagnostics**: `pm2-scripts.bat diagnose`
3. **Check Environment**: Ensure all required env vars are set
4. **Verify Files**: Make sure all required files exist
5. **Port Conflicts**: Ensure ports 3000, 3001, 8080 are free

## 🎯 **Expected Behavior**

- **Normal Operation**: Services start and run stably
- **Temporary Crash**: Service restarts up to 5 times
- **Persistent Crash**: After 5 failed restarts, service stops
- **No More Infinite Loops**: PM2 won't keep restarting forever
- **Better Error Messages**: Clear indication of what went wrong

## 🔄 **Recovery Process**

If a service fails 5 times:
1. PM2 stops trying to restart it
2. Check logs for the root cause
3. Fix the underlying issue
4. Manually restart: `pm2-scripts.bat restart`

This prevents the system from being overwhelmed by restart loops while still providing automatic recovery for temporary issues.
