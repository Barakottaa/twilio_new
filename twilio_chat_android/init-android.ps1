# Script to initialize Android project properly
Write-Host "Initializing Android project..." -ForegroundColor Cyan

$androidDir = Join-Path $PSScriptRoot "android"
$tempDir = Join-Path $PSScriptRoot "temp_rn_project"

# Step 1: Create temporary React Native project
Write-Host "`nStep 1: Creating temporary React Native project..." -ForegroundColor Yellow
$parentDir = Split-Path $PSScriptRoot -Parent
Push-Location $parentDir

try {
    # Create temp project
    npx react-native@0.73.2 init TempRNProject --skip-install --version 0.73.2 --skip-git-init 2>&1 | Out-Null
    
    if (Test-Path "TempRNProject\android") {
        Write-Host "✅ Temporary project created" -ForegroundColor Green
        
        # Step 2: Backup current android folder
        Write-Host "`nStep 2: Backing up current Android folder..." -ForegroundColor Yellow
        if (Test-Path $androidDir) {
            $backupDir = "$androidDir.backup"
            if (Test-Path $backupDir) {
                Remove-Item $backupDir -Recurse -Force
            }
            Copy-Item $androidDir $backupDir -Recurse
            Write-Host "✅ Backup created at: $backupDir" -ForegroundColor Green
        }
        
        # Step 3: Copy Android folder from temp project
        Write-Host "`nStep 3: Copying Android folder from template..." -ForegroundColor Yellow
        if (Test-Path $androidDir) {
            Remove-Item $androidDir -Recurse -Force
        }
        Copy-Item "TempRNProject\android" $androidDir -Recurse
        Write-Host "✅ Android folder copied" -ForegroundColor Green
        
        # Step 4: Update package name and app name
        Write-Host "`nStep 4: Updating package name and configuration..." -ForegroundColor Yellow
        
        # Update build.gradle
        $appBuildGradle = Join-Path $androidDir "app\build.gradle"
        if (Test-Path $appBuildGradle) {
            $content = Get-Content $appBuildGradle -Raw
            $content = $content -replace 'namespace "com\.temprnproject"', 'namespace "com.twiliochatapp"'
            $content = $content -replace 'applicationId "com\.temprnproject"', 'applicationId "com.twiliochatapp"'
            Set-Content $appBuildGradle $content
        }
        
        # Update MainActivity.java
        $mainActivityPath = Join-Path $androidDir "app\src\main\java\com\temprnproject"
        $newMainActivityPath = Join-Path $androidDir "app\src\main\java\com\twiliochatapp"
        if (Test-Path $mainActivityPath) {
            if (-not (Test-Path $newMainActivityPath)) {
                New-Item -ItemType Directory -Path $newMainActivityPath -Force | Out-Null
            }
            Get-ChildItem $mainActivityPath -Recurse | ForEach-Object {
                $newPath = $_.FullName -replace [regex]::Escape("com\temprnproject"), "com\twiliochatapp"
                $newDir = Split-Path $newPath -Parent
                if (-not (Test-Path $newDir)) {
                    New-Item -ItemType Directory -Path $newDir -Force | Out-Null
                }
                Copy-Item $_.FullName $newPath -Force
                $fileContent = Get-Content $newPath -Raw
                $fileContent = $fileContent -replace 'package com\.temprnproject', 'package com.twiliochatapp'
                $fileContent = $fileContent -replace 'com\.temprnproject', 'com.twiliochatapp'
                Set-Content $newPath $fileContent
            }
            Remove-Item $mainActivityPath -Recurse -Force
        }
        
        # Update AndroidManifest.xml
        $manifestPath = Join-Path $androidDir "app\src\main\AndroidManifest.xml"
        if (Test-Path $manifestPath) {
            $content = Get-Content $manifestPath -Raw
            $content = $content -replace 'com\.temprnproject', 'com.twiliochatapp'
            Set-Content $manifestPath $content
        }
        
        Write-Host "✅ Package name updated to com.twiliochatapp" -ForegroundColor Green
        
        # Step 5: Clean up temp project
        Write-Host "`nStep 5: Cleaning up..." -ForegroundColor Yellow
        Remove-Item "TempRNProject" -Recurse -Force
        Write-Host "✅ Cleanup complete" -ForegroundColor Green
        
        Write-Host "`n✅ Android project initialized successfully!" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Cyan
        Write-Host "1. Open Android Studio" -ForegroundColor White
        Write-Host "2. Open the 'android' folder" -ForegroundColor White
        Write-Host "3. Wait for Gradle sync to complete" -ForegroundColor White
        Write-Host "4. Then run: npm run android" -ForegroundColor White
        
    } else {
        Write-Host "❌ Failed to create temporary project" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "`nTrying alternative method..." -ForegroundColor Yellow
    
    # Alternative: Just download gradle wrapper
    Write-Host "Downloading Gradle wrapper files..." -ForegroundColor Yellow
    $wrapperDir = Join-Path $androidDir "gradle\wrapper"
    if (-not (Test-Path $wrapperDir)) {
        New-Item -ItemType Directory -Path $wrapperDir -Force | Out-Null
    }
    
    # Download gradle-wrapper.jar
    $jarUrl = "https://raw.githubusercontent.com/gradle/gradle/v8.3.0/gradle/wrapper/gradle-wrapper.jar"
    $jarPath = Join-Path $wrapperDir "gradle-wrapper.jar"
    try {
        Invoke-WebRequest -Uri $jarUrl -OutFile $jarPath -UseBasicParsing
        Write-Host "✅ Gradle wrapper downloaded" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Could not download. Gradle will download it on first build." -ForegroundColor Yellow
    }
}

Pop-Location

