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
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
  twilioMessageSid?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  mediaContentType?: string;
  mediaFileName?: string;
  mediaCaption?: string;
  media?: Array<{
    url: string;
    contentType: string;
    filename?: string;
    sid?: string;
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
  proxyAddress?: string;
  twilioNumberId?: string;
};

export type TwilioNumber = {
  id: string;
  number: string;
  name: string;
  department: string;
  isActive: boolean;
};

export type Conversation = {
  id: string;
  customer: Customer;
  agent: Agent;
  messages: Message[];
  unreadCount: number;
  status: ConversationStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  closedAt?: string;
  closedBy?: string;
  notes?: string;
  proxyAddress?: string; // whatsapp:+1234567890 format
  twilioNumberId?: string; // ID of the configured number
};

