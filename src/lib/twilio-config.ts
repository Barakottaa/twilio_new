import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials are not configured in environment variables. Please check your .env file.');
}

if (!accountSid.startsWith('AC')) {
  throw new Error('Invalid TWILIO_ACCOUNT_SID. It must start with "AC". Please check your .env file.');
}


export const twilioClient = twilio(accountSid, authToken);
