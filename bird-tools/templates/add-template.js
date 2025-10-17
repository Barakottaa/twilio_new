#!/usr/bin/env node

/**
 * Add New Template Configuration
 * Easy way to add new templates to the system
 */

const fs = require('fs');
const path = require('path');

const configFile = path.join(__dirname, 'template-configs.json');

function loadConfigs() {
  try {
    const data = fs.readFileSync(configFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading configs:', error.message);
    return {};
  }
}

function saveConfigs(configs) {
  try {
    fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
    console.log('✅ Template configuration saved successfully!');
  } catch (error) {
    console.error('❌ Error saving configs:', error.message);
  }
}

function addTemplate() {
  console.log('🔧 Add New Template Configuration\n');
  
  const configs = loadConfigs();
  
  // Get template details from user
  const templateKey = process.argv[2];
  if (!templateKey) {
    console.log('Usage: node add-template.js <template-key>');
    console.log('Example: node add-template.js appointment');
    return;
  }
  
  if (configs[templateKey]) {
    console.log(`❌ Template "${templateKey}" already exists!`);
    console.log('Current config:', JSON.stringify(configs[templateKey], null, 2));
    return;
  }
  
  console.log(`📝 Adding template: ${templateKey}`);
  console.log('Please provide the following information:\n');
  
  // For now, let's create a template with common fields
  const newTemplate = {
    name: `${templateKey.charAt(0).toUpperCase() + templateKey.slice(1)} Template`,
    projectId: 'your-project-id-here',
    version: 'your-version-id-here',
    parameters: ['param1', 'param2', 'param3'],
    defaults: {
      param1: 'default_value_1',
      param2: 'default_value_2',
      param3: 'default_value_3'
    },
    description: `Template for ${templateKey}`
  };
  
  configs[templateKey] = newTemplate;
  saveConfigs(configs);
  
  console.log('\n📋 Template added successfully!');
  console.log('📝 Next steps:');
  console.log('1. Update the projectId and version with your actual Bird template IDs');
  console.log('2. Update the parameters array with your template parameter names');
  console.log('3. Update the defaults with appropriate default values');
  console.log('4. Test with: node send-any-template.js ' + templateKey + ' --phone=+201100414204');
  
  console.log('\n📄 Current configuration:');
  console.log(JSON.stringify(newTemplate, null, 2));
}

function listTemplates() {
  console.log('📋 Available Templates:\n');
  
  const configs = loadConfigs();
  
  Object.entries(configs).forEach(([key, config]) => {
    console.log(`🔹 ${key}: ${config.name}`);
    console.log(`   📊 Parameters: ${config.parameters.join(', ')}`);
    console.log(`   📝 Description: ${config.description}`);
    console.log('');
  });
}

// Main execution
const command = process.argv[2];

if (command === 'list') {
  listTemplates();
} else if (command) {
  addTemplate();
} else {
  console.log('🔧 Template Configuration Manager\n');
  console.log('Usage:');
  console.log('  node add-template.js list                    # List all templates');
  console.log('  node add-template.js <template-key>          # Add new template');
  console.log('');
  console.log('Examples:');
  console.log('  node add-template.js list');
  console.log('  node add-template.js appointment');
  console.log('  node add-template.js lab_results');
}
