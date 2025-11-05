export type ConversationStatus = 'open' | 'closed' | 'pending' | 'resolved' | 'escalated';

export type Agent = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  email?: string;
  role: 'admin' | 'agent';
  status?: 'online' | 'offline' | 'busy' | 'away';
  maxConcurrentChats?: number;
  currentChats?: number;
  skills?: string[];
  department?: string;
  lastActive?: string;
  permissions: {
    dashboard: boolean;
    agents: boolean;
    contacts: boolean;
    analytics: boolean;
    settings: boolean;
  };
};

export type Customer = {
  id: string;
  name: string;
  avatar: string;
  phoneNumber?: string;
  email?: string;
  lastSeen?: string;
};

export type Contact = {
  id: string;
  name: string;
  avatar: string;
  phoneNumber?: string;
  email?: string;
  lastSeen?: string;
  notes?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  text: string;
  timestamp: string;
  sender: 'agent' | 'customer';
  senderId: string;
  // Message delivery status (for agent messages)
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
  twilioMessageSid?: string; // Twilio message SID for tracking delivery
  // Media fields (Option 1: Twilio-only storage)
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string; // Twilio temporary URL
  mediaContentType?: string; // MIME type
  mediaFileName?: string; // Original filename
  mediaCaption?: string; // Caption text
  // New media array for multiple media items
  media?: Array<{
    url: string;
    contentType: string;
    filename?: string;
  }>;
};

export type Chat = {
  id: string;
  title: string;
  lastMessagePreview: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  agentId: string;
  // Additional information for enhanced display
  customerPhone?: string;
  customerEmail?: string;
  agentName?: string;
  agentStatus?: string;
  status: ConversationStatus;
  isPinned?: boolean;
  tags?: string[];
  assignedAt?: string;
  closedAt?: string;
  closedBy?: string;
  notes?: string;
  // Twilio number this conversation uses
  proxyAddress?: string; // whatsapp:+1234567890 format
  twilioNumberId?: string; // ID of the configured number
};
