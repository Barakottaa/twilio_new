export type ConversationStatus = 'open' | 'closed' | 'pending' | 'resolved' | 'escalated';

export type Agent = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  role: 'admin' | 'agent';
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

export type Message = {
  id: string;
  text: string;
  timestamp: string;
  sender: 'agent' | 'customer';
  senderId: string;
};

export type Chat = {
  id: string;
  customer: Customer;
  agent: Agent;
  messages: Message[];
  unreadCount: number;
  status: ConversationStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  closedAt?: string;
  closedBy?: string;
  notes?: string;
};
