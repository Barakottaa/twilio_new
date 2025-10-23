const { sendBirdImageMessage } = require('./twilio_chat/lib/bird-service.ts');

async function testImageSend() {
  try {
    console.log('🧪 Testing image send...');
    
    const imageUrl = 'http://localhost:3003/images/+201016666348_2000000390611/images/page-1.jpg';
    const phoneNumber = '+201016666348';
    const caption = 'تقرير المختبر - صفحة 1';
    
    console.log(`📸 Sending image to ${phoneNumber}: ${imageUrl}`);
    
    const result = await sendBirdImageMessage(phoneNumber, imageUrl, caption);
    
    if (result.success) {
      console.log('✅ Image sent successfully!', result);
    } else {
      console.log('❌ Image send failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImageSend();
