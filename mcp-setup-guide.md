# MCP (Model Context Protocol) Development Setup Guide

## 🚀 Quick Start

### 1. Install MCP CLI
```bash
npm install -g @modelcontextprotocol/cli
```

### 2. Install Common MCP Servers
```bash
# Core servers for development
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-git
npm install -g @modelcontextprotocol/server-memory

# Optional servers (install as needed)
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-sqlite
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-docker
```

### 3. Configure MCP
Copy the `mcp-config.json` file to your MCP configuration directory:

**Windows:**
```bash
copy mcp-config.json %APPDATA%\mcp\config.json
```

**macOS/Linux:**
```bash
cp mcp-config.json ~/.config/mcp/config.json
```

### 4. Update Configuration
Edit the config file and update the paths and API keys:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:\\New folder\\twilio_new"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "D:\\New folder\\twilio_new"]
    }
  }
}
```

## 🛠️ Development Workflow

### Daily Development Commands

#### 1. Start MCP Server
```bash
mcp start
```

#### 2. Connect to Your Project
```bash
mcp connect filesystem
mcp connect git
```

#### 3. Common Development Tasks

**File Operations:**
```bash
# List project files
mcp filesystem list

# Read specific file
mcp filesystem read src/app/page.tsx

# Write to file
mcp filesystem write src/components/NewComponent.tsx "// New component code"
```

**Git Operations:**
```bash
# Check git status
mcp git status

# View commit history
mcp git log --oneline -10

# Create new branch
mcp git checkout -b feature/new-feature
```

**Memory Operations:**
```bash
# Store development notes
mcp memory store "Working on PDF upload functionality"

# Retrieve stored information
mcp memory search "PDF upload"
```

## 🔧 Project-Specific Configuration

### For Your Twilio/Bird Project

Create a project-specific MCP config:

```json
{
  "mcpServers": {
    "twilio-project": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:\\New folder\\twilio_new"],
      "env": {
        "NODE_ENV": "development",
        "PROJECT_TYPE": "twilio-bird-whatsapp"
      }
    },
    "bird-tools": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:\\New folder\\twilio_new\\bird-tools"],
      "env": {
        "TOOLS_DIR": "true"
      }
    },
    "project-git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "D:\\New folder\\twilio_new"]
    }
  }
}
```

## 📋 Development Instructions for AI Assistant

When working with MCP in development, use these instructions:

### File Management
- Use `mcp filesystem` for all file operations
- Always check file existence before reading/writing
- Use relative paths from project root
- Maintain proper file permissions

### Git Integration
- Use `mcp git` for version control operations
- Always check status before making changes
- Create meaningful commit messages
- Use feature branches for new development

### Memory Management
- Store important project decisions in `mcp memory`
- Keep track of API keys and configurations
- Document troubleshooting steps
- Remember project-specific patterns

### Code Quality
- Follow existing code patterns in the project
- Maintain consistent naming conventions
- Add proper error handling
- Include relevant comments

## 🚨 Troubleshooting

### Common Issues

**MCP Server Not Starting:**
```bash
# Check if servers are installed
npm list -g @modelcontextprotocol/server-filesystem

# Reinstall if needed
npm install -g @modelcontextprotocol/server-filesystem
```

**Permission Errors:**
```bash
# Check file permissions
ls -la /path/to/project

# Fix permissions if needed
chmod -R 755 /path/to/project
```

**Configuration Issues:**
```bash
# Validate config
mcp validate-config

# Test connection
mcp test-connection filesystem
```

## 📚 Useful MCP Commands

### Development Workflow
```bash
# Start development session
mcp start --config mcp-config.json

# Connect to project
mcp connect filesystem
mcp connect git
mcp connect memory

# Quick file operations
mcp filesystem list src/
mcp filesystem read package.json
mcp filesystem write .env.example "NODE_ENV=development"

# Git operations
mcp git status
mcp git add .
mcp git commit -m "Add new feature"
mcp git push origin main

# Memory operations
mcp memory store "Fixed PDF upload issue"
mcp memory search "upload"
```

### Project-Specific Commands
```bash
# Work with bird-tools
mcp filesystem list bird-tools/
mcp filesystem read bird-tools/templates/send-bird-universal.js

# Check PM2 services
mcp filesystem read ecosystem.config.js

# Update configuration
mcp filesystem read env.example
mcp filesystem write .env "TWILIO_ACCOUNT_SID=your_sid"
```

## 🎯 Best Practices

1. **Always use MCP for file operations** - Don't use direct file system access
2. **Store important information in memory** - Keep track of decisions and solutions
3. **Use git integration** - Track all changes properly
4. **Maintain clean configuration** - Keep MCP config up to date
5. **Test connections regularly** - Ensure MCP servers are working
6. **Document your workflow** - Keep notes in MCP memory

## 🔄 Daily Development Routine

1. **Start MCP session:**
   ```bash
   mcp start
   mcp connect filesystem
   mcp connect git
   ```

2. **Check project status:**
   ```bash
   mcp git status
   mcp filesystem list .
   ```

3. **Work on features:**
   ```bash
   mcp filesystem read src/components/Component.tsx
   mcp filesystem write src/components/Component.tsx "// Updated code"
   ```

4. **Commit changes:**
   ```bash
   mcp git add .
   mcp git commit -m "Feature: Add new functionality"
   mcp git push origin main
   ```

5. **Store notes:**
   ```bash
   mcp memory store "Completed feature X, next: work on feature Y"
   ```

This setup will make your development workflow much more efficient and organized!
