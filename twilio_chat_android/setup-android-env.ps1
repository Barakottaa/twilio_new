# PowerShell script to set up Android environment variables
# Run this script as Administrator or add to your PowerShell profile

Write-Host "Setting up Android environment variables..." -ForegroundColor Cyan

# Common Android SDK locations
$sdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk"
)

$sdkPath = $null
foreach ($path in $sdkPaths) {
    if (Test-Path $path) {
        $sdkPath = $path
        Write-Host "✅ Found Android SDK at: $path" -ForegroundColor Green
        break
    }
}

if (-not $sdkPath) {
    Write-Host "❌ Android SDK not found in common locations." -ForegroundColor Red
    Write-Host "Please install Android SDK through Android Studio:" -ForegroundColor Yellow
    Write-Host "1. Open Android Studio" -ForegroundColor Yellow
    Write-Host "2. Go to Tools > SDK Manager" -ForegroundColor Yellow
    Write-Host "3. Install Android SDK Platform 33" -ForegroundColor Yellow
    Write-Host "4. Note the SDK location (usually shown at top)" -ForegroundColor Yellow
    exit 1
}

# Set ANDROID_HOME
Write-Host "`nSetting ANDROID_HOME to: $sdkPath" -ForegroundColor Cyan
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkPath, [System.EnvironmentVariableTarget]::User)

# Add to PATH
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)
$pathsToAdd = @(
    "$sdkPath\platform-tools",
    "$sdkPath\tools",
    "$sdkPath\tools\bin"
)

foreach ($pathToAdd in $pathsToAdd) {
    if ($currentPath -notlike "*$pathToAdd*") {
        Write-Host "Adding to PATH: $pathToAdd" -ForegroundColor Cyan
        $currentPath += ";$pathToAdd"
    }
}

[System.Environment]::SetEnvironmentVariable("Path", $currentPath, [System.EnvironmentVariableTarget]::User)

Write-Host "`n✅ Environment variables set successfully!" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANT: Please restart your terminal/PowerShell for changes to take effect." -ForegroundColor Yellow
Write-Host "After restarting, run: adb version" -ForegroundColor Yellow

