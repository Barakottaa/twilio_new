@echo off
REM TwilioChat Deployment Script for Windows
REM This script helps deploy the application to different environments

setlocal enabledelayedexpansion

REM Colors for output (Windows doesn't support colors in batch, but we can use echo)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

REM Function to print colored output
:print_status
echo %INFO% %~1
goto :eof

:print_success
echo %SUCCESS% %~1
goto :eof

:print_warning
echo %WARNING% %~1
goto :eof

:print_error
echo %ERROR% %~1
goto :eof

REM Check if Node.js is installed
:check_nodejs
node --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit /b 1
)
call :print_success "Node.js is installed"
goto :eof

REM Check if npm is installed
:check_npm
npm --version >nul 2>&1
if errorlevel 1 (
    call :print_error "npm is not installed. Please install npm first."
    exit /b 1
)
call :print_success "npm is installed"
goto :eof

REM Install dependencies
:install_dependencies
call :print_status "Installing dependencies..."
npm install
if errorlevel 1 (
    call :print_error "Failed to install dependencies"
    exit /b 1
)
call :print_success "Dependencies installed successfully"
goto :eof

REM Build the application
:build_app
call :print_status "Building the application..."
npm run build
if errorlevel 1 (
    call :print_error "Failed to build application"
    exit /b 1
)
call :print_success "Application built successfully"
goto :eof

REM Start the application
:start_app
call :print_status "Starting the application..."
npm start
goto :eof

REM Development mode
:dev_mode
call :print_status "Starting in development mode..."
npm run dev
goto :eof

REM Docker deployment
:docker_deploy
call :print_status "Deploying with Docker..."

docker --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not installed. Please install Docker first."
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit /b 1
)

docker-compose up -d
if errorlevel 1 (
    call :print_error "Failed to deploy with Docker"
    exit /b 1
)
call :print_success "Application deployed with Docker"
goto :eof

REM Create environment file
:create_env
call :print_status "Creating environment file..."

if not exist .env.local (
    (
        echo # Database Configuration ^(SQLite is default^)
        echo DATABASE_TYPE=sqlite
        echo SQLITE_DB_PATH=./database.sqlite
        echo.
        echo # Oracle Database Configuration ^(uncomment to use Oracle instead^)
        echo # DATABASE_TYPE=oracle
        echo # ORACLE_USER=crm
        echo # ORACLE_PASSWORD=crm
        echo # ORACLE_CONNECT_STRING=localhost:1521/ldm
        echo.
        echo # Twilio Configuration ^(optional^)
        echo # TWILIO_ACCOUNT_SID=your_account_sid
        echo # TWILIO_AUTH_TOKEN=your_auth_token
        echo # WEBHOOK_URL=https://your-domain.com/api/twilio/webhook
        echo.
        echo # Application Configuration
        echo NODE_ENV=development
        echo PORT=3000
    ) > .env.local
    call :print_success "Environment file created"
) else (
    call :print_warning "Environment file already exists"
)
goto :eof

REM Show help
:show_help
echo TwilioChat Deployment Script
echo.
echo Usage: %~nx0 [COMMAND]
echo.
echo Commands:
echo   dev         Start in development mode
echo   build       Build the application
echo   start       Start the production server
echo   deploy      Deploy with Docker
echo   setup       Initial setup ^(install deps, create env^)
echo   help        Show this help message
echo.
echo Examples:
echo   %~nx0 setup    # Initial setup
echo   %~nx0 dev      # Development mode
echo   %~nx0 deploy   # Docker deployment
goto :eof

REM Main script logic
if "%1"=="dev" (
    call :check_nodejs
    call :check_npm
    call :install_dependencies
    call :create_env
    call :dev_mode
) else if "%1"=="build" (
    call :check_nodejs
    call :check_npm
    call :install_dependencies
    call :build_app
) else if "%1"=="start" (
    call :check_nodejs
    call :check_npm
    call :start_app
) else if "%1"=="deploy" (
    call :docker_deploy
) else if "%1"=="setup" (
    call :check_nodejs
    call :check_npm
    call :install_dependencies
    call :create_env
    call :print_success "Setup completed successfully!"
    call :print_status "Run '%~nx0 dev' to start in development mode"
) else (
    call :show_help
)
