#!/usr/bin/env node

/**
 * Universal Bird Template Sender
 * Send any Bird WhatsApp template with different structures
 * 
 * Usage Examples:
 *   # Invoice template (default)
 *   node send-any-template.js invoice --phone=+201100414204 --name="عبدالرحمن" --lab=3 --paid=600 --remaining=200
 *   
 *   # Appointment template
 *   node send-any-template.js appointment --phone=+201100414204 --name="أحمد" --date="2025-10-20" --time="10:00" --doctor="د. محمد"
 *   
 *   # Custom template with any parameters
 *   node send-any-template.js custom --phone=+201100414204 --project=abc123 --version=def456 --param1="value1" --param2="value2"
 */

const axios = require('axios');

// Load template configurations from JSON file
const fs = require('fs');
const path = require('path');

function loadTemplateConfigs() {
  try {
    const configPath = path.join(__dirname, 'template-configs.json');
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading template configs:', error.message);
    return {};
  }
}

const TEMPLATE_CONFIGS = loadTemplateConfigs();

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    templateType: 'invoice',
    phone: '+201100414204',
    parameters: {}
  };

  // First argument is template type
  if (args[0] && !args[0].startsWith('--')) {
    config.templateType = args[0];
    args.shift(); // Remove template type from args
  }

  // Parse other arguments
  args.forEach(arg => {
    if (arg.startsWith('--phone=')) {
      config.phone = arg.split('=')[1];
    } else if (arg.startsWith('--project=')) {
      config.projectId = arg.split('=')[1];
    } else if (arg.startsWith('--version=')) {
      config.version = arg.split('=')[1];
    } else if (arg.startsWith('--')) {
      // Parse parameter: --key=value or --key="value"
      const [key, value] = arg.substring(2).split('=');
      let mappedKey = key;
      
      // If it's a direct parameter name (matches template config), use it as-is
      // Otherwise, try common mappings
      if (key === 'name') mappedKey = 'patient_name';
      else if (key === 'lab') mappedKey = 'lab_no';
      else if (key === 'paid') mappedKey = 'total_paid';
      else if (key === 'date') mappedKey = 'appointment_date';
      else if (key === 'time') mappedKey = 'appointment_time';
      else if (key === 'doctor') mappedKey = 'doctor_name';
      else if (key === 'test') mappedKey = 'test_type';
      else if (key === 'amount') mappedKey = 'amount';
      else if (key === 'method') mappedKey = 'payment_method';
      else if (key === 'transaction') mappedKey = 'transaction_id';
      else if (key === 'visit') mappedKey = 'last_visit';
      else if (key === 'followup') mappedKey = 'follow_up_type';
      else if (key === 'next') mappedKey = 'next_date';
      // For any other parameter, use the key as-is (allows direct parameter names)
      
      config.parameters[mappedKey] = value;
    }
  });

  return config;
}

// Send template directly to Bird API
async function sendTemplateDirect(phoneNumber, projectId, version, locale = 'ar', variables = {}) {
  const payload = {
    receiver: {
      contacts: [
        {
          identifierValue: phoneNumber,
          identifierKey: "phonenumber"
        }
      ]
    },
    template: {
      projectId: projectId,
      version: version,
      locale: locale,
      variables: variables
    }
  };

  console.log('📤 Sending to Bird API directly...');
  console.log('🌐 URL: https://api.bird.com/workspaces/2d7a1e03-25e4-401e-bf1e-0ace545673d7/channels/8e046034-bca7-5124-89d0-1a64c1cbe819/messages');
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(
      'https://api.bird.com/workspaces/2d7a1e03-25e4-401e-bf1e-0ace545673d7/channels/8e046034-bca7-5124-89d0-1a64c1cbe819/messages',
      payload,
      {
        headers: {
          'Authorization': 'AccessKey EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Template sent successfully!');
    console.log(`   📨 Message ID: ${response.data.id}`);
    console.log(`   📊 Status: ${response.data.status}`);
    
    if (response.data.body?.text?.actions) {
      console.log('🔘 Buttons available:', response.data.body.text.actions.map(a => a.postback?.text).join(', '));
    }

    return {
      success: true,
      messageId: response.data.id,
      status: response.data.status,
      data: response.data
    };

  } catch (error) {
    console.error('❌ Template send failed:');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Build variables object in correct format
function buildVariables(templateConfig, userParams) {
  const variables = {};
  
  templateConfig.parameters.forEach(paramName => {
    const value = userParams[paramName] || templateConfig.defaults[paramName] || 'غير محدد';
    variables[paramName] = value;
  });
  
  return variables;
}

// Show available templates
function showAvailableTemplates() {
  console.log('📋 Available Templates:\n');
  
  Object.entries(TEMPLATE_CONFIGS).forEach(([key, config]) => {
    console.log(`🔹 ${key}: ${config.name}`);
    console.log(`   📊 Parameters: ${config.parameters.join(', ')}`);
    console.log(`   📝 Description: ${config.description || 'No description'}`);
    console.log('');
  });
  
  console.log('💡 Usage:');
  console.log('   node send-any-template.js <template-type> --phone=+1234567890 --param1=value1 --param2=value2');
  console.log('   node send-any-template.js custom --phone=+1234567890 --project=abc123 --version=def456 --param1=value1');
  console.log('');
}

// Main execution
async function main() {
  console.log('🚀 Universal Bird Template Sender\n');
  
  const config = parseArgs();
  
  // Show help if no template type or --help
  if (!config.templateType || config.templateType === 'help' || process.argv.includes('--help')) {
    showAvailableTemplates();
    return;
  }
  
  console.log(`📋 Template Type: ${config.templateType}`);
  console.log(`📱 Phone: ${config.phone}`);
  console.log('');

  let result;

  if (config.templateType === 'custom' && config.projectId && config.version) {
    // Custom template with provided project/version
    console.log('🔧 Custom Template Mode');
    console.log(`   🆔 Project ID: ${config.projectId}`);
    console.log(`   📝 Version: ${config.version}`);
    console.log(`   📊 Parameters: ${JSON.stringify(config.parameters, null, 2)}`);
    console.log('');

    const parameters = Object.entries(config.parameters).map(([key, value]) => ({
      type: 'string',
      key: key,
      value: value
    }));

    result = await sendTemplateDirect(
      config.phone,
      config.projectId,
      config.version,
      'ar',
      parameters
    );

  } else if (TEMPLATE_CONFIGS[config.templateType]) {
    // Predefined template
    const templateConfig = TEMPLATE_CONFIGS[config.templateType];
    
    console.log(`📋 ${templateConfig.name}`);
    console.log(`   🆔 Project ID: ${templateConfig.projectId}`);
    console.log(`   📝 Version: ${templateConfig.version}`);
    console.log(`   📊 Expected Parameters: ${templateConfig.parameters.join(', ')}`);
    console.log('');

    const variables = buildVariables(templateConfig, config.parameters);
    
    console.log('📤 Final Variables:');
    Object.entries(variables).forEach(([key, value], index) => {
      console.log(`   ${index + 1}. ${key}: ${value}`);
    });
    console.log('');

    result = await sendTemplateDirect(
      config.phone,
      templateConfig.projectId,
      templateConfig.version,
      templateConfig.locale || 'ar',
      variables
    );

  } else {
    console.error(`❌ Unknown template type: ${config.templateType}`);
    console.log('\n📋 Available template types:');
    Object.keys(TEMPLATE_CONFIGS).forEach(type => {
      console.log(`   • ${type}: ${TEMPLATE_CONFIGS[type].name}`);
    });
    console.log('   • custom: Use with --project= and --version= flags');
    return;
  }

  if (result.success) {
    console.log('\n💡 Check WhatsApp for the template message');
    if (result.data?.body?.text?.actions) {
      console.log('🔘 Click the buttons to test webhook functionality');
    }
  }

  console.log('\n📋 Usage Examples:');
  console.log('   # Invoice template');
  console.log('   node send-any-template.js invoice --phone=+201100414204 --name="عبدالرحمن" --lab=3 --paid=600 --remaining=200');
  console.log('');
  console.log('   # Appointment template');
  console.log('   node send-any-template.js appointment --phone=+201100414204 --name="أحمد" --date="2025-10-20" --time="10:00" --doctor="د. محمد"');
  console.log('');
  console.log('   # Custom template');
  console.log('   node send-any-template.js custom --phone=+201100414204 --project=abc123 --version=def456 --param1="value1" --param2="value2"');
}

// Export functions for use in other scripts
module.exports = {
  sendTemplateDirect,
  buildVariables,
  TEMPLATE_CONFIGS,
  parseArgs
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
