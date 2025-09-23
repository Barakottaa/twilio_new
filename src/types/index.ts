export type Agent = {
  id: string;
  name: string;
  avatar: string;
};

export type Customer = {
  id: string;
  name: string;
  avatar: string;
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
};
