@echo off
echo 🚀 Setting up MCP for Development...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install it first:
    echo    https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found

REM Install MCP CLI globally
echo 📦 Installing MCP CLI...
npm install -g @modelcontextprotocol/cli

REM Install core MCP servers
echo 📦 Installing core MCP servers...
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-git
npm install -g @modelcontextprotocol/server-memory

REM Install optional servers
echo 📦 Installing optional MCP servers...
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @modelcontextprotocol/server-sqlite
npm install -g @modelcontextprotocol/server-docker

REM Create MCP config directory
echo 📁 Creating MCP config directory...
if not exist "%APPDATA%\mcp" mkdir "%APPDATA%\mcp"

REM Copy configuration file
echo 📋 Setting up configuration...
copy mcp\mcp-config.json "%APPDATA%\mcp\config.json"

REM Update configuration with current project path
echo 🔧 Updating configuration for current project...
set "PROJECT_PATH=%~dp0"
set "PROJECT_PATH=%PROJECT_PATH:~0,-1%"

powershell -Command "(Get-Content '%APPDATA%\mcp\config.json') -replace 'D:\\\\New folder\\\\twilio_new', '%PROJECT_PATH:\=\\%' | Set-Content '%APPDATA%\mcp\config.json'"

echo.
echo 🎉 MCP Setup Complete!
echo.
echo 📋 Next Steps:
echo 1. Edit the configuration file: %APPDATA%\mcp\config.json
echo 2. Add your API keys (Brave Search, GitHub, etc.)
echo 3. Start MCP: mcp start
echo 4. Connect to servers: mcp connect filesystem
echo.
echo 📚 Documentation:
echo - mcp\mcp-setup-guide.md
echo - mcp\mcp-development-instructions.md
echo.
echo Press any key to exit...
pause >nul
