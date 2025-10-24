const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BIRD_WEBHOOK_URL = 'http://localhost:3002/api/bird/webhook';
const PHONE_NUMBER = '+201066101340';

async function testCompletePdfWorkflow() {
  console.log('🧪 Testing Complete PDF to Image Workflow');
  console.log('📱 Phone:', PHONE_NUMBER);
  console.log('🐦 Bird Webhook:', BIRD_WEBHOOK_URL);
  console.log('📄 Expected PDF Folder:', `D:\\Results\\+201066101340_393595`);

  // Check if PDF folder exists
  const pdfFolder = 'D:\\Results\\+201066101340_393595';
  if (!fs.existsSync(pdfFolder)) {
    console.error('❌ PDF folder not found:', pdfFolder);
    return;
  }

  // List PDF files in the folder
  const pdfFiles = fs.readdirSync(pdfFolder).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log('📄 PDF files found:', pdfFiles);

  if (pdfFiles.length === 0) {
    console.error('❌ No PDF files found in folder');
    return;
  }

  console.log('✅ PDF folder and files exist');

  try {
    // Step 1: Trigger Bird webhook with PDF processing request
    console.log('\n🔵 Step 1: Triggering Bird webhook...');
    const webhookPayload = {
      event: 'whatsapp.inbound',
      payload: {
        sender: {
          contact: {
            identifierValue: PHONE_NUMBER,
            identifierKey: 'phonenumber'
          }
        },
        body: {
          text: {
            body: 'عايز التقرير في صور',
            actions: [
              {
                type: 'postback',
                postback: {
                  text: 'عايز التقرير في صور',
                  payload: 'Image'
                }
              }
            ]
          }
        }
      }
    };

    const webhookResponse = await axios.post(BIRD_WEBHOOK_URL, webhookPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000 // 60 second timeout for PDF processing
    });

    console.log('✅ Bird webhook response:');
    console.log('📊 Status:', webhookResponse.status);
    console.log('📋 Response:', JSON.stringify(webhookResponse.data, null, 2));

    if (webhookResponse.data.processed) {
      console.log('🎉 PDF processing successful!');
      console.log('📄 Images generated:', webhookResponse.data.images);
      console.log('📁 Folder:', webhookResponse.data.folder);

      // Step 2: Check if images were actually created
      console.log('\n🔵 Step 2: Checking generated images...');
      const imagesFolder = path.join(pdfFolder, 'images');
      
      if (fs.existsSync(imagesFolder)) {
        const imageFiles = fs.readdirSync(imagesFolder).filter(f => f.toLowerCase().endsWith('.jpg'));
        console.log('📸 Images found in folder:', imageFiles);
        
        if (imageFiles.length > 0) {
          console.log('✅ Images successfully generated!');
          
          // Step 3: Test Bird service directly to send images
          console.log('\n🔵 Step 3: Testing Bird service image sending...');
          const birdServiceUrl = 'http://localhost:3001/api/bird/webhook';
          
          const birdPayload = {
            event: 'whatsapp.inbound',
            payload: {
              sender: {
                contact: {
                  identifierValue: PHONE_NUMBER,
                  identifierKey: 'phonenumber'
                }
              },
              body: {
                text: {
                  body: 'image'
                }
              }
            }
          };

          try {
            const birdResponse = await axios.post(birdServiceUrl, birdPayload, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 60000
            });

            console.log('✅ Bird service response:');
            console.log('📊 Status:', birdResponse.status);
            console.log('📋 Response:', JSON.stringify(birdResponse.data, null, 2));

            if (birdResponse.data.success && birdResponse.data.processed) {
              console.log('🎉 Complete workflow successful!');
              console.log('📤 Images sent to WhatsApp:', birdResponse.data.imagesSent);
              console.log('📄 Images:', birdResponse.data.images);
            } else {
              console.log('⚠️ Bird service did not process the request');
            }

          } catch (birdError) {
            console.error('❌ Bird service error:', {
              message: birdError.message,
              status: birdError.response?.status,
              data: birdError.response?.data
            });
          }

        } else {
          console.log('⚠️ No images found in images folder');
        }
      } else {
        console.log('⚠️ Images folder not created');
      }

    } else {
      console.log('⚠️ PDF processing was not triggered');
    }

  } catch (error) {
    console.error('❌ Workflow test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testCompletePdfWorkflow();
