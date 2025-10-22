import type { Agent, Chat, Customer, Message } from '@/types';
import { subMinutes, subHours, subDays } from 'date-fns';

const agents: Agent[] = [
  { 
    id: 'agent-1', 
    name: 'Alice Johnson', 
    avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=3b82f6&color=ffffff&size=150',
    email: 'alice@company.com',
    status: 'online',
    maxConcurrentChats: 5,
    currentChats: 2,
    skills: ['customer-support', 'technical-support', 'billing'],
    department: 'Customer Success',
    lastActive: new Date().toISOString()
  },
  { 
    id: 'agent-2', 
    name: 'Bob Smith', 
    avatar: 'https://ui-avatars.com/api/?name=Bob+Smith&background=3b82f6&color=ffffff&size=150',
    email: 'bob@company.com',
    status: 'online',
    maxConcurrentChats: 4,
    currentChats: 1,
    skills: ['sales', 'product-support'],
    department: 'Sales',
    lastActive: new Date().toISOString()
  },
  { 
    id: 'agent-3', 
    name: 'Charlie Brown', 
    avatar: 'https://ui-avatars.com/api/?name=Charlie+Brown&background=3b82f6&color=ffffff&size=150',
    email: 'charlie@company.com',
    status: 'busy',
    maxConcurrentChats: 6,
    currentChats: 4,
    skills: ['technical-support', 'escalation'],
    department: 'Technical Support',
    lastActive: new Date().toISOString()
  },
  { 
    id: 'agent-4', 
    name: 'Diana Prince', 
    avatar: 'https://ui-avatars.com/api/?name=Diana+Prince&background=3b82f6&color=ffffff&size=150',
    email: 'diana@company.com',
    status: 'away',
    maxConcurrentChats: 3,
    currentChats: 0,
    skills: ['customer-support', 'billing'],
    department: 'Customer Success',
    lastActive: subHours(new Date(), 1).toISOString()
  },
];

const customers: Customer[] = [
  { 
    id: 'customer-1', 
    name: 'John Doe', 
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=10b981&color=ffffff&size=150',
    phoneNumber: '+1 (555) 123-4567',
    email: 'john.doe@email.com',
    lastSeen: new Date().toISOString()
  },
  { 
    id: 'customer-2', 
    name: 'Jane Smith', 
    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=10b981&color=ffffff&size=150',
    phoneNumber: '+1 (555) 987-6543',
    email: 'jane.smith@email.com',
    lastSeen: subHours(new Date(), 2).toISOString()
  },
  { 
    id: 'customer-3', 
    name: 'Peter Jones', 
    avatar: 'https://ui-avatars.com/api/?name=Peter+Jones&background=10b981&color=ffffff&size=150',
    phoneNumber: '+1 (555) 456-7890',
    lastSeen: subHours(new Date(), 5).toISOString()
  },
  { 
    id: 'customer-4', 
    name: 'Mary Johnson', 
    avatar: 'https://ui-avatars.com/api/?name=Mary+Johnson&background=10b981&color=ffffff&size=150',
    email: 'mary.johnson@email.com',
    lastSeen: subDays(new Date(), 1).toISOString()
  },
  { 
    id: 'customer-5', 
    name: 'David Williams', 
    avatar: 'https://ui-avatars.com/api/?name=David+Williams&background=10b981&color=ffffff&size=150',
    phoneNumber: '+1 (555) 321-0987',
    email: 'david.williams@email.com',
    lastSeen: subDays(new Date(), 2).toISOString()
  },
];

const generateMessages = (count: number, customer: Customer, agent: Agent, baseDate: Date): Message[] => {
  const messages: Message[] = [];
  const messageContent = [
    "Hello, I need help with my order.",
    "Sure, I can help with that. What's your order number?",
    "It's #12345.",
    "Thank you. I see the order. It seems to be delayed.",
    "Oh no! When can I expect it?",
    "I'm checking with our logistics team. One moment please.",
    "Okay, I'll wait.",
    "It looks like it will be delivered tomorrow morning.",
    "That's great news! Thank you for your help.",
    "You're welcome! Is there anything else I can assist you with?",
    "No, that's all. Have a great day!",
    "You too!",
    "I'm having trouble with the payment page.",
    "Can you describe the issue you're facing?",
    "The 'Pay Now' button is grayed out.",
    "I see. Have you filled in all the required fields?",
    "Yes, I believe so.",
    "Could you try clearing your browser cache and trying again?",
    "Okay, I'll try that now.",
    "It worked! Thank you so much.",
  ];

  // Limit message count to reduce memory usage
  const limitedCount = Math.min(count, 10);
  
  for (let i = 0; i < limitedCount; i++) {
    const sender = i % 2 === 0 ? 'customer' : 'agent';
    messages.push({
      id: `msg-${customer.id}-${i}`,
      text: messageContent[i % messageContent.length],
      timestamp: subMinutes(baseDate, (limitedCount - i) * 2).toISOString(),
      sender,
      senderId: sender === 'customer' ? customer.id : agent.id,
    });
  }
  return messages;
};

export const chats: Chat[] = [
  {
    id: 'chat-1',
    customer: customers[0],
    agent: agents[0],
    messages: generateMessages(5, customers[0], agents[0], new Date()),
    unreadCount: 2,
    status: 'open',
    priority: 'medium',
    tags: ['order-support', 'billing'],
    createdAt: subMinutes(new Date(), 30).toISOString(),
    updatedAt: subMinutes(new Date(), 5).toISOString(),
    assignedAt: subMinutes(new Date(), 25).toISOString(),
  },
  {
    id: 'chat-2',
    customer: customers[1],
    agent: agents[0],
    messages: generateMessages(3, customers[1], agents[0], subHours(new Date(), 1)),
    unreadCount: 0,
    status: 'open',
    priority: 'low',
    tags: ['sales', 'pricing'],
    createdAt: subHours(new Date(), 1).toISOString(),
    updatedAt: subMinutes(new Date(), 10).toISOString(),
    assignedAt: subHours(new Date(), 1).toISOString(),
  },
  {
    id: 'chat-3',
    customer: customers[2],
    agent: agents[1],
    messages: generateMessages(2, customers[2], agents[1], subHours(new Date(), 3)),
    unreadCount: 1,
    status: 'pending',
    priority: 'high',
    tags: ['billing', 'refund'],
    createdAt: subHours(new Date(), 3).toISOString(),
    updatedAt: subHours(new Date(), 3).toISOString(),
    assignedAt: subHours(new Date(), 3).toISOString(),
  },
];

export const availableAgents = agents;
