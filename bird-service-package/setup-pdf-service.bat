@echo off
echo 🚀 Setting up PDF to Image Conversion Service...
echo.

echo 📦 Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Checking for poppler-utils...
where pdftoppm >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ poppler-utils not found. Please install it manually:
    echo.
    echo For Windows (using Chocolatey):
    echo   choco install poppler
    echo.
    echo For Windows (using Scoop):
    echo   scoop install poppler
    echo.
    echo For Ubuntu/Debian:
    echo   sudo apt-get install poppler-utils
    echo.
    echo For macOS:
    echo   brew install poppler
    echo.
    echo After installing poppler-utils, run this script again.
    pause
    exit /b 1
) else (
    echo ✅ poppler-utils found
)

echo.
echo 📁 Creating directories...
if not exist "temp" mkdir temp
if not exist "output" mkdir output
echo ✅ Directories created

echo.
echo ⚙️ Checking environment configuration...
if not exist ".env" (
    echo ⚠️ .env file not found. Please create it with your Bird API credentials:
    echo.
    echo BIRD_API_KEY=your_bird_api_key
    echo BIRD_WORKSPACE_ID=your_workspace_id
    echo BIRD_CHANNEL_ID=your_channel_id
    echo BIRD_WHATSAPP_NUMBER=your_whatsapp_number
    echo.
    echo Copy env.example to .env and fill in your credentials.
    pause
    exit /b 1
) else (
    echo ✅ .env file found
)

echo.
echo 🧪 Running tests...
call node test-pdf-conversion.js
if %errorlevel% neq 0 (
    echo ❌ Tests failed. Please check your configuration.
    pause
    exit /b 1
)

echo.
echo ✅ Setup completed successfully!
echo.
echo 🚀 To start the service:
echo   npm start
echo.
echo 🧪 To run tests:
echo   node test-pdf-conversion.js
echo.
echo 📖 For more information, see PDF_CONVERSION_README.md
echo.
pause
