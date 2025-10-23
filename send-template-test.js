const axios = require('axios');

async function sendTemplateTest() {
  try {
    console.log('🧪 Sending PDF template with buttons to +201016666348...');
    
    const apiKey = 'EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl';
    const workspaceId = '2d7a1e03-25e4-401e-bf1e-0ace545673d7';
    const channelId = '8e046034-bca7-5124-89d0-1a64c1cbe819';
    const phoneNumber = '+201016666348';
    
    const payload = {
      receiver: {
        contacts: [{
          identifierKey: 'phonenumber',
          identifierValue: phoneNumber
        }]
      },
      template: {
        projectId: '1c05f3a5-c35a-404f-9ac8-7af994fbeab1', // new_pdf_clone template with buttons
        version: '10e2dd22-b794-422f-8ab0-259d2a46327c', // new_pdf_clone template version
        locale: 'ar',
        parameters: [{
          type: 'string',
          key: 'url',
          value: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        }, {
          type: 'string', 
          key: 'patient_name',
          value: 'عبدالرحمن بركة'
        }]
      }
    };

    console.log(`📱 Sending template message to ${phoneNumber}...`);
    
    const response = await axios.post(
      `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`,
      payload,
      {
        headers: {
          Authorization: `AccessKey ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ Template message sent successfully!', {
      messageId: response.data.id,
      status: response.data.status,
      to: phoneNumber
    });
    console.log('🎯 Now you can test the "عايز التقرير في صور" button!');

  } catch (error) {
    console.error('❌ Template send failed:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

sendTemplateTest();
