# PowerShell script to restart dev server and run tests
Write-Host "🔄 Restarting development server..." -ForegroundColor Yellow
Write-Host ""

# Kill any existing Next.js dev server
Write-Host "Stopping existing dev server..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next dev*" } | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ Old server stopped" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Starting new dev server in background..." -ForegroundColor Cyan
Write-Host ""

# Start dev server in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

Write-Host "⏳ Waiting 10 seconds for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🧪 Running SSE tests..." -ForegroundColor Cyan
Write-Host ""

# Run the test
node test-sse-complete.js

Write-Host ""
Write-Host "✅ Test complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Check the dev server window for SSE connection logs"
Write-Host "   2. Open browser to http://localhost:3000 and log in"
Write-Host "   3. Open browser console and look for SSE connection messages"
Write-Host "   4. Send a WhatsApp message to test real-time delivery"
Write-Host ""

