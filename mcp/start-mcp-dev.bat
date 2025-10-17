@echo off
echo 🚀 Starting MCP Development Session...

REM Check if MCP is installed
where mcp >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MCP is not installed. Please run setup-mcp.bat first.
    pause
    exit /b 1
)

echo ✅ MCP found

REM Start MCP session
echo 🔌 Starting MCP session...
start "MCP Session" cmd /k "mcp start"

REM Wait for MCP to start
timeout /t 3 /nobreak >nul

REM Connect to filesystem
echo 📁 Connecting to filesystem...
start "MCP Filesystem" cmd /k "mcp connect filesystem"

REM Connect to git
echo 🔄 Connecting to git...
start "MCP Git" cmd /k "mcp connect git"

REM Connect to memory
echo 🧠 Connecting to memory...
start "MCP Memory" cmd /k "mcp connect memory"

echo.
echo 🎉 MCP Development Session Started!
echo.
echo 📋 Available Windows:
echo - MCP Session: Main MCP server
echo - MCP Filesystem: File operations
echo - MCP Git: Version control
echo - MCP Memory: Store/retrieve information
echo.
echo 📚 Quick Commands:
echo - mcp filesystem list .
echo - mcp git status
echo - mcp memory store "note: value"
echo - mcp memory search "keyword"
echo.
echo Press any key to exit...
pause >nul
