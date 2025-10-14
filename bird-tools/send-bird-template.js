#!/usr/bin/env node

/**
 * Bird Template Sender
 * Reusable script to send Bird WhatsApp templates through the proxy
 * 
 * Usage:
 *   node send-bird-template.js
 *   node send-bird-template.js --phone=+201016666348 --lab=3 --paid=600 --remaining=200
 */

const axios = require('axios');

// Configuration
const PROXY_URL = 'http://localhost:8080';
const DEFAULT_PHONE = '+201016666348';
const DEFAULT_PATIENT_NAME = 'عبدالرحمن';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    phone: DEFAULT_PHONE,
    patientName: DEFAULT_PATIENT_NAME,
    labNo: '1',
    totalPaid: '400',
    remaining: '100'
  };

  args.forEach(arg => {
    if (arg.startsWith('--phone=')) {
      config.phone = arg.split('=')[1];
    } else if (arg.startsWith('--lab=')) {
      config.labNo = arg.split('=')[1];
    } else if (arg.startsWith('--paid=')) {
      config.totalPaid = arg.split('=')[1];
    } else if (arg.startsWith('--remaining=')) {
      config.remaining = arg.split('=')[1];
    } else if (arg.startsWith('--name=')) {
      config.patientName = arg.split('=')[1];
    }
  });

  return config;
}

async function sendInvoiceTemplate(config) {
  console.log('🧾 Sending Bird Invoice Template...\n');

  const payload = {
    phoneNumber: config.phone,
    invoiceData: {
      patientName: config.patientName,
      labNo: config.labNo,
      totalPaid: config.totalPaid,
      remaining: config.remaining
    }
  };

  console.log('📤 Template Details:');
  console.log(`   📱 Phone: ${config.phone}`);
  console.log(`   👤 Patient: ${config.patientName}`);
  console.log(`   🧪 Lab No: ${config.labNo}`);
  console.log(`   💰 Total Paid: ${config.totalPaid}ج`);
  console.log(`   💳 Remaining: ${config.remaining}ج`);
  console.log('');

  try {
    const response = await axios.post(
      `${PROXY_URL}/bird/api/send-invoice`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Template sent successfully!');
    console.log(`   📨 Message ID: ${response.data.messageId}`);
    console.log(`   📊 Status: ${response.data.status}`);
    console.log('');
    console.log('💡 Check WhatsApp for the template with payment buttons');
    console.log('🔘 Click "Instapay" or "Vodafone cash" to test webhook');

    return {
      success: true,
      messageId: response.data.messageId,
      status: response.data.status
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

async function sendCustomTemplate(phoneNumber, projectId, templateVersion, locale = 'ar', parameters = {}) {
  console.log('📋 Sending Custom Bird Template...\n');

  const payload = {
    phoneNumber,
    projectId,
    templateVersion,
    locale,
    parameters
  };

  console.log('📤 Template Details:');
  console.log(`   📱 Phone: ${phoneNumber}`);
  console.log(`   🆔 Project ID: ${projectId}`);
  console.log(`   📝 Version: ${templateVersion}`);
  console.log(`   🌐 Locale: ${locale}`);
  console.log(`   📊 Parameters: ${JSON.stringify(parameters, null, 2)}`);
  console.log('');

  try {
    const response = await axios.post(
      `${PROXY_URL}/bird/api/send-template`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Custom template sent successfully!');
    console.log(`   📨 Message ID: ${response.data.messageId}`);
    console.log(`   📊 Status: ${response.data.status}`);

    return {
      success: true,
      messageId: response.data.messageId,
      status: response.data.status
    };

  } catch (error) {
    console.error('❌ Custom template send failed:');
    
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

// Main execution
async function main() {
  console.log('🚀 Bird Template Sender\n');
  
  const config = parseArgs();
  
  // Check if custom template parameters are provided
  const customProjectId = process.argv.find(arg => arg.startsWith('--project='))?.split('=')[1];
  const customVersion = process.argv.find(arg => arg.startsWith('--version='))?.split('=')[1];
  
  if (customProjectId && customVersion) {
    // Send custom template
    const result = await sendCustomTemplate(
      config.phone,
      customProjectId,
      customVersion,
      'ar',
      {
        patient_name: config.patientName,
        lab_no: config.labNo,
        total_paid: config.totalPaid,
        remaining: config.remaining
      }
    );
  } else {
    // Send invoice template
    const result = await sendInvoiceTemplate(config);
  }
  
  console.log('\n📋 Usage Examples:');
  console.log('   node send-bird-template.js');
  console.log('   node send-bird-template.js --phone=+201016666348 --lab=5 --paid=800 --remaining=300');
  console.log('   node send-bird-template.js --name="أحمد" --lab=10 --paid=1000 --remaining=500');
  console.log('   node send-bird-template.js --project=your-project-id --version=your-version-id');
}

// Export functions for use in other scripts
module.exports = {
  sendInvoiceTemplate,
  sendCustomTemplate,
  parseArgs
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
