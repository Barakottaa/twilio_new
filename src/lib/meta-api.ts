// Meta Graph API integration for WhatsApp Business
// This requires a Meta Business account and WhatsApp Business API setup

interface MetaContactInfo {
  name?: string;
  profile_picture_url?: string;
  phone_number?: string;
}

interface MetaProfileResponse {
  data: {
    profile: {
      name: string;
      profile_picture_url: string;
    };
  };
}

// Get contact profile from Meta Graph API
export async function getMetaContactProfile(phoneNumber: string): Promise<MetaContactInfo | null> {
  try {
    // Note: This requires proper Meta Business API setup
    // You need to:
    // 1. Set up a Meta Business account
    // 2. Create a WhatsApp Business app
    // 3. Get access tokens and phone number ID
    // 4. Configure webhooks
    
    const accessToken = process.env.META_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    
    if (!accessToken || !phoneNumberId) {
      console.log('⚠️ Meta API credentials not configured');
      return null;
    }
    
    // Clean phone number (remove + and spaces)
    const cleanPhone = phoneNumber.replace(/[\s+]/g, '');
    
    // Meta Graph API endpoint for getting profile
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/contacts/${cleanPhone}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log('⚠️ Meta API request failed:', response.status, response.statusText);
      return null;
    }
    
    const data: MetaProfileResponse = await response.json();
    
    return {
      name: data.data.profile.name,
      profile_picture_url: data.data.profile.profile_picture_url,
      phone_number: phoneNumber,
    };
    
  } catch (error) {
    console.error('❌ Error fetching Meta contact profile:', error);
    return null;
  }
}

// Alternative: Use WhatsApp Business API to get contact info
export async function getWhatsAppContactInfo(phoneNumber: string): Promise<MetaContactInfo | null> {
  try {
    // This is a simplified approach - in production you'd use the full WhatsApp Business API
    // For now, we'll return a formatted phone number as the name
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    return {
      name: `WhatsApp ${formattedPhone}`,
      phone_number: phoneNumber,
      // No profile picture available without proper API setup
    };
    
  } catch (error) {
    console.error('❌ Error getting WhatsApp contact info:', error);
    return null;
  }
}

// Format phone number for display
function formatPhoneNumber(phoneNumber: string): string {
  // Remove whatsapp: prefix if present
  const cleanNumber = phoneNumber.replace(/^whatsapp:/, '');
  
  // Format: +20 10 1666 6348 (12 digits)
  if (cleanNumber.match(/^\+\d{12}$/)) {
    return cleanNumber.replace(/(\+\d{2})(\d{2})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  }
  
  // Format: +1 234 567 8901 (11 digits)
  if (cleanNumber.match(/^\+\d{11}$/)) {
    return cleanNumber.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }
  
  // Format: +123 456 7890 (10 digits)
  if (cleanNumber.match(/^\+\d{10}$/)) {
    return cleanNumber.replace(/(\+\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  return cleanNumber;
}
