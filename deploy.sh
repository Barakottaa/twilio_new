#!/bin/bash

# TwilioChat Deployment Script
# This script helps deploy the application to different environments

set -e

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

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "npm $(npm --version) is installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully"
}

# Build the application
build_app() {
    print_status "Building the application..."
    npm run build
    print_success "Application built successfully"
}

# Start the application
start_app() {
    print_status "Starting the application..."
    npm start
}

# Development mode
dev_mode() {
    print_status "Starting in development mode..."
    npm run dev
}

# Docker deployment
docker_deploy() {
    print_status "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    docker-compose up -d
    print_success "Application deployed with Docker"
}

# Create environment file
create_env() {
    print_status "Creating environment file..."
    
    if [ ! -f .env.local ]; then
        cat > .env.local << EOF
# Database Configuration (SQLite is default)
DATABASE_TYPE=sqlite
SQLITE_DB_PATH=./database.sqlite

# Oracle Database Configuration (uncomment to use Oracle instead)
# DATABASE_TYPE=oracle
# ORACLE_USER=crm
# ORACLE_PASSWORD=crm
# ORACLE_CONNECT_STRING=localhost:1521/ldm

# Twilio Configuration (optional)
# TWILIO_ACCOUNT_SID=your_account_sid
# TWILIO_AUTH_TOKEN=your_auth_token
# WEBHOOK_URL=https://your-domain.com/api/twilio/webhook

# Application Configuration
NODE_ENV=development
PORT=3000
EOF
        print_success "Environment file created"
    else
        print_warning "Environment file already exists"
    fi
}

# Show help
show_help() {
    echo "TwilioChat Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev         Start in development mode"
    echo "  build       Build the application"
    echo "  start       Start the production server"
    echo "  deploy      Deploy with Docker"
    echo "  setup       Initial setup (install deps, create env)"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup    # Initial setup"
    echo "  $0 dev      # Development mode"
    echo "  $0 deploy   # Docker deployment"
}

# Main script logic
case "${1:-help}" in
    "dev")
        check_nodejs
        check_npm
        install_dependencies
        create_env
        dev_mode
        ;;
    "build")
        check_nodejs
        check_npm
        install_dependencies
        build_app
        ;;
    "start")
        check_nodejs
        check_npm
        start_app
        ;;
    "deploy")
        docker_deploy
        ;;
    "setup")
        check_nodejs
        check_npm
        install_dependencies
        create_env
        print_success "Setup completed successfully!"
        print_status "Run '$0 dev' to start in development mode"
        ;;
    "help"|*)
        show_help
        ;;
esac
