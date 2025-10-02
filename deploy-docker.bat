@echo off
REM Docker Deployment Script for TwilioChat Application (Windows)
REM This script helps deploy the application to another computer using Docker

echo 🚀 Starting Docker deployment for TwilioChat...

REM Check if Docker is installed
echo [INFO] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    echo [INFO] Visit: https://docs.docker.com/desktop/windows/install/
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    echo [INFO] Visit: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

echo [SUCCESS] Docker and Docker Compose are installed

REM Check if environment file exists
echo [INFO] Checking environment configuration...
if not exist "env.production" (
    echo [WARNING] env.production file not found. Creating from template...
    if exist "env.production.example" (
        copy env.production.example env.production
        echo [WARNING] Please edit env.production with your actual configuration before continuing.
        echo [INFO] Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, NEXTAUTH_SECRET
        pause
    ) else (
        echo [ERROR] No environment template found. Please create env.production manually.
        pause
        exit /b 1
    )
)
echo [SUCCESS] Environment configuration found

REM Build and start the application
echo [INFO] Building Docker image...
docker-compose -f docker-compose.prod.yml build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Docker image
    pause
    exit /b 1
)

echo [INFO] Starting application...
docker-compose -f docker-compose.prod.yml up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start application
    pause
    exit /b 1
)

echo [SUCCESS] Application deployed successfully!

REM Check application health
echo [INFO] Checking application health...
echo [INFO] Waiting for application to start (30 seconds)...
timeout /t 30 /nobreak >nul

REM Check if container is running
docker-compose -f docker-compose.prod.yml ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Application is running
    
    REM Try to access the application
    curl -f http://localhost:3000/api/auth/me >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Application is healthy and responding
    ) else (
        echo [WARNING] Application is running but health check failed
        echo [INFO] Check logs with: docker-compose -f docker-compose.prod.yml logs
    )
) else (
    echo [ERROR] Application failed to start
    echo [INFO] Check logs with: docker-compose -f docker-compose.prod.yml logs
    pause
    exit /b 1
)

REM Show deployment information
echo.
echo [SUCCESS] 🎉 Deployment completed successfully!
echo.
echo [INFO] Application Information:
echo   🌐 URL: http://localhost:3000
echo   👤 Default Login: admin / admin
echo   📊 Health Check: http://localhost:3000/api/auth/me
echo.
echo [INFO] Useful Commands:
echo   📋 View logs: docker-compose -f docker-compose.prod.yml logs -f
echo   🔄 Restart: docker-compose -f docker-compose.prod.yml restart
echo   🛑 Stop: docker-compose -f docker-compose.prod.yml down
echo   📊 Status: docker-compose -f docker-compose.prod.yml ps
echo.
echo [INFO] Database:
echo   📁 SQLite database is stored in Docker volume: app-data
echo   🔍 Access database: docker-compose -f docker-compose.prod.yml exec app sqlite3 /app/data/database.sqlite
echo.
echo [WARNING] Next Steps:
echo   1. Configure your Twilio credentials in env.production
echo   2. Set up SSL certificates if using HTTPS
echo   3. Configure your domain name
echo   4. Set up proper backup for the database
echo.
pause
