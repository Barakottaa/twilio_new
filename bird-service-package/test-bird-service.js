#!/usr/bin/env node

/**
 * Test script for Bird WhatsApp Service
 */

require('dotenv').config();
const BirdService = require('./bird-service');

async function testBirdService() {
  console.log('🧪 Testing Bird WhatsApp Service...\n');

  try {
    // Initialize service
    const birdService = new BirdService();
    console.log('✅ Bird service initialized');

    // Validate configuration
    const config = birdService.validateConfig();
    if (!config.valid) {
      console.error('❌ Configuration invalid:', config.error);
      return;
    }
    console.log('✅ Configuration valid:', config.config);

    // Test 1: Send invoice template
    console.log('\n📤 Test 1: Sending invoice template...');
    const invoiceResult = await birdService.sendInvoiceTemplate('+201016666348', {
      patientName: 'عبدالرحمن',
      labNo: '1',
      totalPaid: '400',
      remaining: '100'
    });

    if (invoiceResult.success) {
      console.log('✅ Invoice template sent successfully!');
      console.log(`   Message ID: ${invoiceResult.messageId}`);
    } else {
      console.log('❌ Invoice template failed:', invoiceResult.error);
    }

    // Test 2: Send text message
    console.log('\n💬 Test 2: Sending text message...');
    const textResult = await birdService.sendTextMessage(
      '+201016666348',
      'Test message from Bird service'
    );

    if (textResult.success) {
      console.log('✅ Text message sent successfully!');
      console.log(`   Message ID: ${textResult.messageId}`);
    } else {
      console.log('❌ Text message failed:', textResult.error);
    }

    // Test 3: Process webhook
    console.log('\n🔗 Test 3: Processing webhook...');
    const webhookData = {
      service: "channels",
      event: "whatsapp.inbound",
      payload: {
        sender: {
          contact: {
            identifierValue: "+201016666348"
          }
        },
        body: {
          text: {
            actions: [
              {
                type: "postback",
                postback: {
                  payload: "PAY_VCASH"
                }
              }
            ]
          }
        }
      }
    };

    const webhookResult = birdService.processWebhook(webhookData);
    if (webhookResult.success) {
      console.log('✅ Webhook processed successfully!');
      console.log('   Should reply:', webhookResult.shouldReply);
      console.log('   Contact:', webhookResult.contact);
      console.log('   Payload:', webhookResult.postbackPayload);
    } else {
      console.log('❌ Webhook processing failed:', webhookResult.error);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testBirdService();
