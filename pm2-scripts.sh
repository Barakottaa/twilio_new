#!/bin/bash

echo "🚀 PM2 Management Scripts for Twilio + Bird Services"
echo

case "$1" in
  start)
    echo "🟢 Starting all services..."
    pm2 start ecosystem.config.js
    echo "✅ All services started!"
    pm2 list
    ;;
  stop)
    echo "🔴 Stopping all services..."
    pm2 stop all
    echo "✅ All services stopped!"
    ;;
  restart)
    echo "🔄 Restarting all services..."
    pm2 restart all
    echo "✅ All services restarted!"
    pm2 list
    ;;
  status)
    echo "📊 Service Status:"
    pm2 list
    ;;
  logs)
    echo "📜 Service Logs:"
    pm2 logs --lines 50
    ;;
  monitor)
    echo "📈 Opening PM2 Monitor..."
    pm2 monit
    ;;
  setup)
    echo "⚙️ Setting up PM2 auto-start..."
    pm2 startup
    echo
    echo "📝 After running the command above, run:"
    echo "   pm2 save"
    echo
    echo "This will make all services start automatically on system boot."
    ;;
  *)
    echo "Usage: ./pm2-scripts.sh [command]"
    echo
    echo "Commands:"
    echo "  start    - Start all services (Twilio + Bird + Proxy)"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  status   - Show status of all services"
    echo "  logs     - Show logs for all services"
    echo "  monitor  - Open PM2 monitoring dashboard"
    echo "  setup    - Setup PM2 to auto-start on boot"
    echo
    ;;
esac
