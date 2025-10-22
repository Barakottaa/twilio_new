# MCP Quick Reference Card

## 🚀 Daily Commands

### Start Development Session
```bash
# Windows
start-mcp-dev.bat

# Manual
mcp start
mcp connect filesystem
mcp connect git
mcp connect memory
```

### File Operations
```bash
# List files
mcp filesystem list .
mcp filesystem list src/
mcp filesystem list bird-tools/

# Read files
mcp filesystem read package.json
mcp filesystem read src/app/page.tsx
mcp filesystem read bird-tools/templates/send-bird-universal.js

# Write files
mcp filesystem write src/components/NewComponent.tsx "// Component code"
mcp filesystem write .env "NODE_ENV=development"

# Check existence
mcp filesystem exists path/to/file
```

### Git Operations
```bash
# Status and history
mcp git status
mcp git log --oneline -10
mcp git diff

# Branch operations
mcp git checkout -b feature/new-feature
mcp git checkout main

# Commit workflow
mcp git add .
mcp git commit -m "Add new feature"
mcp git push origin main
```

### Memory Operations
```bash
# Store information
mcp memory store "working-on: PDF upload feature"
mcp memory store "api-key: your-key-here"
mcp memory store "issue: Fixed ngrok tunnel problem"

# Search and retrieve
mcp memory search "PDF"
mcp memory search "api-key"
mcp memory list

# Delete
mcp memory delete "old-note"
```

## 🎯 Project-Specific Commands

### Twilio/Bird Project
```bash
# Check PM2 services
pm2 status

# Test upload
node bird-tools/uploads/upload-single-pdf.js "D:\Results\file.pdf"

# Test template
node bird-tools/templates/send-bird-universal.js --help

# Check ngrok
curl -s http://localhost:4040/api/tunnels
```

### File Management
```bash
# Project structure
mcp filesystem list .
mcp filesystem list src/
mcp filesystem list bird-tools/
mcp filesystem list bird-service-package/

# Key files
mcp filesystem read ecosystem.config.js
mcp filesystem read package.json
mcp filesystem read env.example
```

## 🔧 Troubleshooting

### Common Issues
```bash
# MCP not starting
mcp stop
mcp start

# File not found
mcp filesystem exists path/to/file
mcp filesystem list parent/directory

# Git issues
mcp git status
mcp git diff

# Memory issues
mcp memory list
mcp memory search "keyword"
```

### Reset Commands
```bash
# Restart MCP
mcp stop
mcp start

# Reconnect servers
mcp connect filesystem
mcp connect git
mcp connect memory

# Clear memory
mcp memory clear
```

## 📋 Development Workflow

### 1. Start Session
```bash
start-mcp-dev.bat
# or manually:
mcp start
mcp connect filesystem
mcp connect git
```

### 2. Check Status
```bash
mcp git status
mcp filesystem list .
pm2 status
```

### 3. Make Changes
```bash
mcp filesystem read file.tsx
mcp filesystem write file.tsx "// Updated code"
```

### 4. Test Changes
```bash
# Test functionality
node script.js

# Check services
pm2 status
curl http://localhost:3001/health
```

### 5. Commit Changes
```bash
mcp git add .
mcp git commit -m "Feature: Add new functionality"
mcp git push origin main
```

### 6. Store Notes
```bash
mcp memory store "completed: Feature X"
mcp memory store "next: Work on Feature Y"
```

## 🎯 Quick Tips

- **Always use MCP** for file operations
- **Store important decisions** in memory
- **Check git status** before making changes
- **Test functionality** after changes
- **Document everything** in memory
- **Use meaningful commit messages**
- **Keep configuration updated**

## 📚 Help Commands
```bash
# MCP help
mcp --help
mcp filesystem --help
mcp git --help
mcp memory --help

# Server status
mcp status

# List available servers
mcp list-servers
```

## 🔄 Daily Routine

1. **Start**: `start-mcp-dev.bat`
2. **Check**: `mcp git status`
3. **Work**: Use MCP for all operations
4. **Test**: Verify functionality
5. **Commit**: `mcp git add . && mcp git commit -m "message"`
6. **Store**: `mcp memory store "completed: description"`

This quick reference will help you use MCP efficiently in your daily development work!
