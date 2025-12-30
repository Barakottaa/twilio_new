// Update this to match your backend server URL
// For local development, use your computer's IP address
// For production, use your deployed server URL
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.94:3000' // Your local IP - update if it changes
  : 'https://your-production-server.com';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
  
  // Conversations
  CONVERSATIONS: '/api/conversations',
  CONVERSATION_BY_ID: (id: string) => `/api/conversations/${id}`,
  CONVERSATION_MESSAGES: (id: string) => `/api/conversations/${id}/messages`,
  CONVERSATION_ASSIGN: (id: string) => `/api/conversations/${id}/assign`,
  CONVERSATION_MARK_READ: (id: string) => `/api/conversations/${id}/mark-read`,
  
  // Twilio
  TWILIO_CONVERSATIONS: '/api/twilio/conversations',
  TWILIO_CONVERSATION_MESSAGE: (id: string) => `/api/twilio/conversations/${id}/message`,
  TWILIO_MESSAGES: '/api/twilio/messages',
  
  // Contacts
  CONTACTS: '/api/contacts',
  CONTACT_BY_ID: (id: string) => `/api/contacts/${id}`,
  
  // Agents
  AGENTS: '/api/agents',
  AGENT_BY_ID: (id: string) => `/api/agents/${id}`,
  
  // Numbers
  NUMBERS: '/api/twilio/numbers',
  
  // Events (SSE)
  EVENTS: '/api/events',
};

