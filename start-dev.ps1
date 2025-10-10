# Twilio WhatsApp Development Environment Starter
Write-Host "Starting Twilio WhatsApp Development Environment..." -ForegroundColor Green
Write-Host ""

# Change to project directory
Set-Location "D:\New folder\twilio_new"

# Start Node.js development server in background
Write-Host "Starting Node.js development server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

# Wait a moment for the server to start
Start-Sleep -Seconds 3

# Start ngrok tunnel
Write-Host "Starting ngrok tunnel..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 3000" -WindowStyle Normal

Write-Host ""
Write-Host "Both services are starting..." -ForegroundColor Green
Write-Host "- Node.js app will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- ngrok interface will be available at: http://localhost:4040" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
