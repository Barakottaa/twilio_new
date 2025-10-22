@echo off
echo Starting all services...

echo Starting Bird Service...
start "Bird Service" cmd /k "cd /d D:\New folder\twilio_new\bird-service && node server.js"

echo Starting Reverse Proxy...
start "Reverse Proxy" cmd /k "cd /d D:\New folder\twilio_new\bird-service && node simple-proxy.js"

echo Starting Ngrok Tunnel...
start "Ngrok Tunnel" cmd /k "cd /d D:\New folder\twilio_new && node start-ngrok.js"

echo Starting Twilio Chat...
start "Twilio Chat" cmd /k "cd /d D:\New folder\twilio_new\twilio_chat && npm run dev"

echo All services started!
pause
