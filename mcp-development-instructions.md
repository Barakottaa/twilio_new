# MCP Development Instructions for AI Assistant

## 🎯 Core Development Principles

When working with MCP in development, follow these instructions:

### 1. File Operations
- **Always use MCP filesystem server** for file operations
- **Check file existence** before reading: `mcp filesystem exists path/to/file`
- **Use absolute paths** when possible, relative paths from project root
- **Maintain file permissions** and handle errors gracefully
- **Backup important files** before making changes

### 2. Git Integration
- **Use MCP git server** for all version control operations
- **Check git status** before making changes: `mcp git status`
- **Create feature branches** for new development: `mcp git checkout -b feature/name`
- **Write meaningful commit messages** with clear descriptions
- **Review changes** before committing: `mcp git diff`

### 3. Memory Management
- **Store important decisions** in MCP memory: `mcp memory store "key: value"`
- **Keep track of API keys** and configurations securely
- **Document troubleshooting steps** for future reference
- **Remember project patterns** and conventions
- **Search memory** before starting new tasks: `mcp memory search "keyword"`

### 4. Code Quality Standards
- **Follow existing code patterns** in the project
- **Maintain consistent naming conventions** (camelCase for JS, kebab-case for files)
- **Add proper error handling** and validation
- **Include relevant comments** for complex logic
- **Test functionality** after making changes

## 🛠️ Project-Specific Instructions

### For Twilio/Bird WhatsApp Project

#### File Structure Awareness
```
twilio_new/
├── src/                    # Next.js application
├── bird-tools/            # Bird WhatsApp tools
│   ├── templates/         # Template scripts
│   ├── uploads/          # File upload tools
│   ├── tests/            # Test scripts
│   └── utilities/        # Utility scripts
├── bird-service-package/  # Bird service
├── scripts/              # Batch/shell scripts
└── docs/                 # Documentation
```

#### Key Files to Remember
- `ecosystem.config.js` - PM2 configuration
- `bird-tools/templates/send-bird-universal.js` - Main template sender
- `bird-tools/uploads/upload-single-pdf.js` - PDF upload tool
- `bird-service-package/simple-proxy.js` - Reverse proxy
- `start-twilio.js` - Main app starter
- `start-ngrok.js` - Ngrok tunnel starter

#### Development Workflow
1. **Check PM2 services**: `pm2 status`
2. **Test upload functionality**: Use `upload-single-pdf.js`
3. **Test template sending**: Use `send-bird-universal.js`
4. **Verify ngrok tunnel**: Check public URL accessibility
5. **Update documentation**: Keep README files current

## 📋 Daily Development Checklist

### Before Starting Work
- [ ] Start MCP session: `mcp start`
- [ ] Connect to filesystem: `mcp connect filesystem`
- [ ] Connect to git: `mcp connect git`
- [ ] Check project status: `mcp git status`
- [ ] Review recent changes: `mcp git log --oneline -5`

### During Development
- [ ] Use MCP for all file operations
- [ ] Store important decisions in memory
- [ ] Test functionality after changes
- [ ] Follow existing code patterns
- [ ] Add proper error handling

### Before Committing
- [ ] Check git status: `mcp git status`
- [ ] Review changes: `mcp git diff`
- [ ] Test all functionality
- [ ] Update documentation if needed
- [ ] Write meaningful commit message

### After Committing
- [ ] Push changes: `mcp git push origin main`
- [ ] Store completion notes: `mcp memory store "Completed: description"`
- [ ] Update project status
- [ ] Clean up temporary files

## 🔧 Common MCP Commands

### File Operations
```bash
# List files
mcp filesystem list [path]

# Read file
mcp filesystem read path/to/file

# Write file
mcp filesystem write path/to/file "content"

# Check if file exists
mcp filesystem exists path/to/file

# Create directory
mcp filesystem mkdir path/to/directory
```

### Git Operations
```bash
# Check status
mcp git status

# Add files
mcp git add path/to/file

# Commit changes
mcp git commit -m "message"

# Push changes
mcp git push origin branch

# Create branch
mcp git checkout -b feature/name

# View history
mcp git log --oneline -10
```

### Memory Operations
```bash
# Store information
mcp memory store "key: value"

# Search memory
mcp memory search "keyword"

# List all stored items
mcp memory list

# Delete item
mcp memory delete "key"
```

## 🚨 Error Handling

### Common Issues and Solutions

#### File Not Found
```bash
# Check if file exists
mcp filesystem exists path/to/file

# List directory contents
mcp filesystem list parent/directory
```

#### Permission Denied
```bash
# Check file permissions
mcp filesystem stat path/to/file

# Use appropriate user context
```

#### Git Conflicts
```bash
# Check status
mcp git status

# Resolve conflicts
mcp git add resolved/file

# Complete merge
mcp git commit -m "Resolve merge conflict"
```

#### MCP Server Issues
```bash
# Restart MCP session
mcp stop
mcp start

# Check server status
mcp status

# Reconnect to servers
mcp connect filesystem
```

## 📚 Development Patterns

### Code Organization
- Keep related files in the same directory
- Use descriptive file names
- Maintain consistent indentation (2 spaces for JS/TS)
- Group imports logically

### Error Handling
```javascript
try {
  // Main logic
} catch (error) {
  console.error('Error:', error.message);
  // Handle error appropriately
}
```

### Configuration Management
- Use environment variables for sensitive data
- Keep configuration files in version control
- Document configuration options
- Validate configuration on startup

### Testing Approach
- Test individual components
- Test integration between components
- Test error scenarios
- Verify PM2 services are running
- Check ngrok tunnel connectivity

## 🎯 Success Metrics

### Code Quality
- [ ] No syntax errors
- [ ] Proper error handling
- [ ] Consistent formatting
- [ ] Meaningful variable names
- [ ] Appropriate comments

### Functionality
- [ ] All features work as expected
- [ ] Error scenarios handled gracefully
- [ ] Performance is acceptable
- [ ] Integration points work correctly
- [ ] Documentation is updated

### Process
- [ ] Changes are properly committed
- [ ] Git history is clean
- [ ] Important decisions are documented
- [ ] Project structure is maintained
- [ ] Dependencies are up to date

## 🔄 Continuous Improvement

### Regular Tasks
- Review and update MCP configuration
- Clean up temporary files
- Update documentation
- Review git history
- Optimize performance

### Learning Opportunities
- Explore new MCP servers
- Improve development workflow
- Learn new features
- Share knowledge with team
- Contribute to MCP ecosystem

This comprehensive guide will help you use MCP effectively in your development workflow!
