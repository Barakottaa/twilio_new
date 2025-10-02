#!/bin/bash

# Docker Deployment Script for TwilioChat Application
# This script helps deploy the application to another computer using Docker

set -e

echo "🚀 Starting Docker deployment for TwilioChat..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        print_status "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        print_status "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if environment file exists
check_env_file() {
    print_status "Checking environment configuration..."
    if [ ! -f "env.production" ]; then
        print_warning "env.production file not found. Creating from template..."
        if [ -f "env.production.example" ]; then
            cp env.production.example env.production
            print_warning "Please edit env.production with your actual configuration before continuing."
            print_status "Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, NEXTAUTH_SECRET"
            read -p "Press Enter after editing env.production..."
        else
            print_error "No environment template found. Please create env.production manually."
            exit 1
        fi
    fi
    print_success "Environment configuration found"
}

# Build and start the application
deploy_app() {
    print_status "Building Docker image..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    print_status "Starting application..."
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Application deployed successfully!"
}

# Check application health
check_health() {
    print_status "Checking application health..."
    
    # Wait for application to start
    print_status "Waiting for application to start (30 seconds)..."
    sleep 30
    
    # Check if container is running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        print_success "Application is running"
        
        # Try to access the application
        if curl -f http://localhost:3000/api/auth/me &> /dev/null; then
            print_success "Application is healthy and responding"
        else
            print_warning "Application is running but health check failed"
            print_status "Check logs with: docker-compose -f docker-compose.prod.yml logs"
        fi
    else
        print_error "Application failed to start"
        print_status "Check logs with: docker-compose -f docker-compose.prod.yml logs"
        exit 1
    fi
}

# Show deployment information
show_info() {
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "Application Information:"
    echo "  🌐 URL: http://localhost:3000"
    echo "  👤 Default Login: admin / admin"
    echo "  📊 Health Check: http://localhost:3000/api/auth/me"
    echo ""
    print_status "Useful Commands:"
    echo "  📋 View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  🔄 Restart: docker-compose -f docker-compose.prod.yml restart"
    echo "  🛑 Stop: docker-compose -f docker-compose.prod.yml down"
    echo "  📊 Status: docker-compose -f docker-compose.prod.yml ps"
    echo ""
    print_status "Database:"
    echo "  📁 SQLite database is stored in Docker volume: app-data"
    echo "  🔍 Access database: docker-compose -f docker-compose.prod.yml exec app sqlite3 /app/data/database.sqlite"
    echo ""
    print_warning "Next Steps:"
    echo "  1. Configure your Twilio credentials in env.production"
    echo "  2. Set up SSL certificates if using HTTPS"
    echo "  3. Configure your domain name"
    echo "  4. Set up proper backup for the database"
}

# Main deployment process
main() {
    echo "=========================================="
    echo "🐳 TwilioChat Docker Deployment"
    echo "=========================================="
    echo ""
    
    check_docker
    check_env_file
    deploy_app
    check_health
    show_info
}

# Run main function
main "$@"
