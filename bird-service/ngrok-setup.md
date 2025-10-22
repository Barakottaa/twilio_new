# Ngrok Setup for Bird Service

Since the Bird service is running on a separate server, you'll need a dedicated ngrok tunnel for it.

## Setup Instructions

### 1. Install Ngrok on the New Server

```bash
# Download and install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Or download directly
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
```

### 2. Authenticate Ngrok

```bash
# Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 3. Start the Bird Service

```bash
cd bird-service-package
npm install
npm start
```

### 4. Create Ngrok Tunnel

```bash
# Create tunnel for port 3001 (Bird service)
ngrok http 3001
```

This will give you output like:
```
Session Status                online
Account                       your-account
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3001
```

### 5. Update Bird Webhook Configuration

Use the ngrok URL for your webhook:
```
https://abc123.ngrok.io/api/bird/webhook
```

## Alternative: Use Different Port

If you want to run both services on the same server:

### Option 1: Different Ports
- Main app: `ngrok http 3000`
- Bird service: `ngrok http 3001`

### Option 2: Subdomain Routing
```bash
# Main app
ngrok http 3000 --subdomain=your-main-app

# Bird service  
ngrok http 3001 --subdomain=your-bird-service
```

## Production Deployment

For production, replace ngrok with:
- **Cloudflare Tunnel** (free)
- **AWS Application Load Balancer**
- **DigitalOcean Load Balancer**
- **Nginx reverse proxy**

## Environment Variables for Production

Update your `.env` file:
```env
# For production, use your actual domain
WEBHOOK_BASE_URL=https://your-domain.com
# For development with ngrok
WEBHOOK_BASE_URL=https://abc123.ngrok.io
```

## Testing the Setup

1. Start the Bird service: `npm start`
2. Start ngrok: `ngrok http 3001`
3. Test health check: `curl https://abc123.ngrok.io/health`
4. Update Bird webhook URL in dashboard
5. Test webhook by clicking a button in WhatsApp
