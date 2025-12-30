# Fix Gradle timeout issue
Write-Host "Fixing Gradle timeout issue..." -ForegroundColor Cyan

# Step 1: Kill any running Gradle/Java processes
Write-Host "`nStep 1: Checking for running Gradle/Java processes..." -ForegroundColor Yellow
$gradleProcesses = Get-Process | Where-Object {$_.ProcessName -like "*gradle*" -or ($_.ProcessName -like "*java*" -and $_.CommandLine -like "*gradle*")} -ErrorAction SilentlyContinue
if ($gradleProcesses) {
    Write-Host "Found running processes. Killing them..." -ForegroundColor Yellow
    $gradleProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✅ Processes killed" -ForegroundColor Green
} else {
    Write-Host "✅ No running Gradle processes found" -ForegroundColor Green
}

# Step 2: Delete corrupted Gradle distribution
Write-Host "`nStep 2: Cleaning up Gradle cache..." -ForegroundColor Yellow
$gradleDistPath = "$env:USERPROFILE\.gradle\wrapper\dists\gradle-8.3-all"
if (Test-Path $gradleDistPath) {
    Write-Host "Found Gradle distribution at: $gradleDistPath" -ForegroundColor Yellow
    Write-Host "Deleting (this may take a moment)..." -ForegroundColor Yellow
    
    # Try to delete with retries
    $maxRetries = 3
    $retryCount = 0
    $deleted = $false
    
    while ($retryCount -lt $maxRetries -and -not $deleted) {
        try {
            Remove-Item $gradleDistPath -Recurse -Force -ErrorAction Stop
            $deleted = $true
            Write-Host "✅ Gradle distribution deleted successfully" -ForegroundColor Green
        } catch {
            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Write-Host "Retry $retryCount/$maxRetries - Waiting 3 seconds..." -ForegroundColor Yellow
                Start-Sleep -Seconds 3
            } else {
                Write-Host "⚠️ Could not delete. You may need to:" -ForegroundColor Yellow
                Write-Host "   1. Close Android Studio" -ForegroundColor White
                Write-Host "   2. Close all terminals" -ForegroundColor White
                Write-Host "   3. Manually delete: $gradleDistPath" -ForegroundColor White
            }
        }
    }
} else {
    Write-Host "✅ No Gradle distribution found (will download fresh)" -ForegroundColor Green
}

# Step 3: Clean Gradle cache
Write-Host "`nStep 3: Cleaning Gradle cache..." -ForegroundColor Yellow
$gradleCachePath = "$env:USERPROFILE\.gradle\caches"
if (Test-Path $gradleCachePath) {
    try {
        Get-ChildItem $gradleCachePath -Directory | Where-Object {$_.Name -like "*gradle-8.3*"} | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Cache cleaned" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Could not clean cache (non-critical)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Fix complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Make sure Android Studio is closed" -ForegroundColor White
Write-Host "2. Make sure no other terminals are running npm/android commands" -ForegroundColor White
Write-Host "3. Try running: npm run android" -ForegroundColor White
Write-Host "`nNote: First build will download Gradle 8.3 (this may take 5-10 minutes)" -ForegroundColor Yellow

