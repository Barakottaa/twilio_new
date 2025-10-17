#!/usr/bin/env node

/**
 * Quick Template Adder
 * Add a new template configuration quickly
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
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.log('🔧 Quick Template Adder\n');
    console.log('Usage: node quick-add-template.js <template-key> <project-id> <version-id> <param1,param2,param3>');
    console.log('');
    console.log('Examples:');
    console.log('  node quick-add-template.js welcome abc123 def456 "name,message"');
    console.log('  node quick-add-template.js order xyz789 uvw012 "customer_name,order_id,total"');
    console.log('  node quick-add-template.js reminder pqr345 stu678 "patient_name,date,time"');
    return;
  }
  
  const [templateKey, projectId, versionId, paramString] = args;
  const parameters = paramString.split(',').map(p => p.trim());
  
  console.log(`🔧 Adding template: ${templateKey}`);
  console.log(`   🆔 Project ID: ${projectId}`);
  console.log(`   📝 Version: ${versionId}`);
  console.log(`   📊 Parameters: ${parameters.join(', ')}`);
  console.log('');
  
  const configs = loadConfigs();
  
  if (configs[templateKey]) {
    console.log(`❌ Template "${templateKey}" already exists!`);
    console.log('Current config:', JSON.stringify(configs[templateKey], null, 2));
    return;
  }
  
  // Create defaults for each parameter
  const defaults = {};
  parameters.forEach(param => {
    if (param.includes('name')) {
      defaults[param] = 'عميل';
    } else if (param.includes('date')) {
      defaults[param] = new Date().toLocaleDateString('ar-EG');
    } else if (param.includes('time')) {
      defaults[param] = '10:00 ص';
    } else if (param.includes('amount') || param.includes('total') || param.includes('paid')) {
      defaults[param] = '500';
    } else if (param.includes('id') || param.includes('no')) {
      defaults[param] = '1';
    } else {
      defaults[param] = 'قيمة افتراضية';
    }
  });
  
  const newTemplate = {
    name: `${templateKey.charAt(0).toUpperCase() + templateKey.slice(1)} Template`,
    projectId: projectId,
    version: versionId,
    parameters: parameters,
    defaults: defaults,
    description: `Template for ${templateKey}`
  };
  
  configs[templateKey] = newTemplate;
  saveConfigs(configs);
  
  console.log('✅ Template added successfully!');
  console.log('');
  console.log('🧪 Test it with:');
  console.log(`   node send-any-template.js ${templateKey} --phone=+201100414204 \\`);
  parameters.forEach((param, index) => {
    const exampleValue = defaults[param];
    console.log(`     --${param}="${exampleValue}"${index < parameters.length - 1 ? ' \\' : ''}`);
  });
  console.log('');
  console.log('📄 Configuration:');
  console.log(JSON.stringify(newTemplate, null, 2));
}

addTemplate();
