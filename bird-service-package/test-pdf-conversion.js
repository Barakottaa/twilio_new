/**
 * Test script for PDF to Image conversion service
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

async function testHealthCheck() {
  try {
    console.log('🏥 Testing health check...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testConfigValidation() {
  try {
    console.log('⚙️ Testing configuration...');
    const response = await axios.get(`${BASE_URL}/api/config`);
    console.log('✅ Configuration check:', response.data);
    return response.data.bird.valid && response.data.pdfToImage.valid;
  } catch (error) {
    console.error('❌ Configuration check failed:', error.message);
    return false;
  }
}

async function testPdfConversion() {
  try {
    console.log('🧪 Testing PDF conversion...');
    
    // Use a sample PDF URL (you can replace this with an actual PDF URL)
    const testPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    const testPhoneNumber = '+201016666348'; // Replace with your test number
    
    const response = await axios.post(`${BASE_URL}/api/test-pdf-conversion`, {
      pdfUrl: testPdfUrl,
      phoneNumber: testPhoneNumber
    });
    
    console.log('✅ PDF conversion test result:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('❌ PDF conversion test failed:', error.message);
    return false;
  }
}

async function testWebhookSimulation() {
  try {
    console.log('📩 Testing webhook simulation...');
    
    // Simulate a Bird webhook with PDF attachment
    const webhookPayload = {
      service: "channels",
      event: "whatsapp.inbound",
      payload: {
        sender: {
          contact: {
            identifierValue: "+201016666348" // Replace with your test number
          }
        },
        body: {
          document: {
            url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            mimeType: "application/pdf",
            filename: "test-document.pdf"
          }
        }
      }
    };
    
    const response = await axios.post(`${BASE_URL}/api/bird/pdf-webhook`, webhookPayload);
    console.log('✅ Webhook simulation result:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('❌ Webhook simulation failed:', error.message);
    return false;
  }
}

async function testTextMessage() {
  try {
    console.log('💬 Testing text message...');
    
    const response = await axios.post(`${BASE_URL}/api/send-message`, {
      phoneNumber: "+201016666348", // Replace with your test number
      text: "🧪 Test message from PDF conversion service"
    });
    
    console.log('✅ Text message test result:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('❌ Text message test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting PDF to Image conversion service tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Configuration', fn: testConfigValidation },
    { name: 'Text Message', fn: testTextMessage },
    { name: 'PDF Conversion', fn: testPdfConversion },
    { name: 'Webhook Simulation', fn: testWebhookSimulation }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n📋 Running ${test.name}...`);
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
      console.log(result ? '✅' : '❌', test.name, result ? 'PASSED' : 'FAILED');
    } catch (error) {
      console.error('❌', test.name, 'ERROR:', error.message);
      results.push({ name: test.name, success: false, error: error.message });
    }
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Service is ready for production.');
  } else {
    console.log('⚠️ Some tests failed. Please check the configuration and try again.');
  }
  
  return passed === total;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner error:', error);
      process.exit(1);
    });
}

module.exports = {
  testHealthCheck,
  testConfigValidation,
  testPdfConversion,
  testWebhookSimulation,
  testTextMessage,
  runAllTests
};
