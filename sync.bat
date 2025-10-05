@echo off
REM Batch file for GitHub synchronization
REM Usage: sync.bat [commit-message]

if "%1"=="" (
    powershell -ExecutionPolicy Bypass -File "%~dp0sync-to-github.ps1"
) else (
    powershell -ExecutionPolicy Bypass -File "%~dp0sync-to-github.ps1" "%1"
)
