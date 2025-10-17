# MCP (Model Context Protocol) Development Setup

This folder contains all the MCP-related files for setting up and using Model Context Protocol in your development workflow.

## 📁 Contents

### Configuration Files
- **`mcp-config.json`** - Main MCP server configuration file
- **`setup-mcp.bat`** - Automated setup script for Windows

### Documentation
- **`mcp-setup-guide.md`** - Complete setup and installation guide
- **`mcp-development-instructions.md`** - Detailed development workflow guidelines
- **`mcp-quick-reference.md`** - Daily command reference card

### Scripts
- **`start-mcp-dev.bat`** - Quick start script for development sessions

## 🚀 Quick Start

### 1. Setup MCP
```bash
# Run the setup script from project root
mcp\setup-mcp.bat
```

### 2. Start Development Session
```bash
# Start MCP development session
mcp\start-mcp-dev.bat
```

## 📚 Documentation

### Setup Guide
Read `mcp-setup-guide.md` for:
- Installation instructions
- Configuration details
- Server setup
- Troubleshooting

### Development Instructions
Read `mcp-development-instructions.md` for:
- Daily workflow guidelines
- Best practices
- Code quality standards
- Project-specific instructions

### Quick Reference
Read `mcp-quick-reference.md` for:
- Common commands
- Daily routines
- Troubleshooting tips
- Project-specific commands

## 🎯 What is MCP?

Model Context Protocol (MCP) is a standard for connecting AI assistants to external tools and data sources. It allows you to:

- **File Operations** - Read, write, and manage files through AI
- **Git Integration** - Version control operations via AI
- **Memory Management** - Store and retrieve information
- **Web Search** - Search the web for information
- **Database Access** - Query databases directly
- **Container Management** - Manage Docker containers

## 🔧 MCP Servers Included

- **Filesystem** - File operations
- **Git** - Version control
- **Memory** - Information storage
- **Brave Search** - Web search (optional)
- **SQLite** - Database operations (optional)
- **Docker** - Container management (optional)

## 📋 Daily Workflow

1. **Start Session:**
   ```bash
   mcp\start-mcp-dev.bat
   ```

2. **File Operations:**
   ```bash
   mcp filesystem list .
   mcp filesystem read src/app/page.tsx
   mcp filesystem write src/components/NewComponent.tsx "// Code"
   ```

3. **Git Operations:**
   ```bash
   mcp git status
   mcp git add .
   mcp git commit -m "Add feature"
   mcp git push origin main
   ```

4. **Memory Operations:**
   ```bash
   mcp memory store "working-on: PDF upload"
   mcp memory search "PDF"
   ```

## 🚨 Troubleshooting

### Common Issues
- **MCP not starting** - Run `mcp\setup-mcp.bat` again
- **Permission errors** - Check file permissions
- **Configuration issues** - Validate `mcp-config.json`

### Getting Help
- Check the documentation files in this folder
- Review the quick reference for common commands
- Ensure all MCP servers are properly installed

## 🎉 Benefits

Using MCP in development provides:
- **Efficient file management** through AI
- **Automated git operations**
- **Persistent memory** for project decisions
- **Integrated web search** capabilities
- **Streamlined development workflow**
- **Better code organization**

This MCP setup is specifically configured for your Twilio/Bird WhatsApp project and will significantly improve your development efficiency!
