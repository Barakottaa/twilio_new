# PowerShell script for manual GitHub synchronization
# Usage: .\sync-to-github.ps1 [commit-message]

param(
    [string]$CommitMessage = "Auto-sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

Write-Host "🔄 Starting GitHub synchronization..." -ForegroundColor Cyan

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not in a git repository!" -ForegroundColor Red
    exit 1
}

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Yellow

# Check for changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
} else {
    Write-Host "📝 Changes detected:" -ForegroundColor Yellow
    git status --short
    
    # Add all changes
    Write-Host "📦 Adding changes..." -ForegroundColor Cyan
    git add .
    
    # Commit changes
    Write-Host "💾 Committing changes..." -ForegroundColor Cyan
    git commit -m $CommitMessage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Commit failed!" -ForegroundColor Red
        exit 1
    }
}

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
git push origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully synced with GitHub!" -ForegroundColor Green
    Write-Host "🔗 Repository: https://github.com/Barakottaa/twilio_new" -ForegroundColor Blue
} else {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    Write-Host "💡 You may need to pull changes first:" -ForegroundColor Yellow
    Write-Host "   git pull origin $currentBranch" -ForegroundColor Gray
    exit 1
}

Write-Host "🎉 GitHub synchronization complete!" -ForegroundColor Green
