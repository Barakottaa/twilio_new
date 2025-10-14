#!/bin/bash

# Bird Service with Ngrok Setup Script
# This script starts the Bird service and creates an ngrok tunnel

echo "🚀 Starting Bird WhatsApp Service with Ngrok..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok is not installed. Please install it first:"
    echo "   https://ngrok.com/download"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it:"
    echo "   cp env.example .env"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the Bird service in background
echo "🕊️ Starting Bird service on port 3001..."
npm start &
BIRD_PID=$!

# Wait a moment for the service to start
sleep 3

# Check if the service is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Bird service failed to start"
    kill $BIRD_PID 2>/dev/null
    exit 1
fi

echo "✅ Bird service started successfully"

# Start ngrok tunnel
echo "🌐 Creating ngrok tunnel..."
ngrok http 3001 --log=stdout &
NGROK_PID=$!

# Wait for ngrok to start
sleep 5

# Get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL"
    kill $BIRD_PID $NGROK_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo "📡 Bird Service: http://localhost:3001"
echo "🌐 Ngrok URL: $NGROK_URL"
echo "🔗 Webhook URL: $NGROK_URL/api/bird/webhook"
echo "💊 Health Check: $NGROK_URL/health"
echo ""
echo "📋 Next Steps:"
echo "1. Update your Bird dashboard webhook URL to: $NGROK_URL/api/bird/webhook"
echo "2. Test the webhook by clicking a button in WhatsApp"
echo ""
echo "Press Ctrl+C to stop both services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BIRD_PID $NGROK_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
