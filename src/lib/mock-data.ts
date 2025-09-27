import type { Agent, Chat, Customer, Message } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { subMinutes, subHours, subDays } from 'date-fns';

const agents: Agent[] = [
  { id: 'agent-1', name: 'Alice', avatar: PlaceHolderImages[0].imageUrl },
  { id: 'agent-2', name: 'Bob', avatar: PlaceHolderImages[1].imageUrl },
  { id: 'agent-3', name: 'Charlie', avatar: PlaceHolderImages[2].imageUrl },
  { id: 'agent-4', name: 'Diana', avatar: PlaceHolderImages[3].imageUrl },
];

const customers: Customer[] = [
  { 
    id: 'customer-1', 
    name: 'John Doe', 
    avatar: PlaceHolderImages[4].imageUrl,
    phoneNumber: '+1 (555) 123-4567',
    email: 'john.doe@email.com',
    lastSeen: new Date().toISOString()
  },
  { 
    id: 'customer-2', 
    name: 'Jane Smith', 
    avatar: PlaceHolderImages[5].imageUrl,
    phoneNumber: '+1 (555) 987-6543',
    email: 'jane.smith@email.com',
    lastSeen: subHours(new Date(), 2).toISOString()
  },
  { 
    id: 'customer-3', 
    name: 'Peter Jones', 
    avatar: PlaceHolderImages[6].imageUrl,
    phoneNumber: '+1 (555) 456-7890',
    lastSeen: subHours(new Date(), 5).toISOString()
  },
  { 
    id: 'customer-4', 
    name: 'Mary Johnson', 
    avatar: PlaceHolderImages[7].imageUrl,
    email: 'mary.johnson@email.com',
    lastSeen: subDays(new Date(), 1).toISOString()
  },
  { 
    id: 'customer-5', 
    name: 'David Williams', 
    avatar: PlaceHolderImages[8].imageUrl,
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

  for (let i = 0; i < count; i++) {
    const sender = i % 2 === 0 ? 'customer' : 'agent';
    messages.push({
      id: `msg-${customer.id}-${i}`,
      text: messageContent[i % messageContent.length],
      timestamp: subMinutes(baseDate, (count - i) * 2).toISOString(),
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
    messages: generateMessages(8, customers[0], agents[0], new Date()),
    unreadCount: 2,
  },
  {
    id: 'chat-2',
    customer: customers[1],
    agent: agents[0],
    messages: generateMessages(5, customers[1], agents[0], subHours(new Date(), 1)),
    unreadCount: 0,
  },
  {
    id: 'chat-3',
    customer: customers[2],
    agent: agents[1],
    messages: generateMessages(3, customers[2], agents[1], subHours(new Date(), 3)),
    unreadCount: 1,
  },
  {
    id: 'chat-4',
    customer: customers[3],
    agent: agents[0],
    messages: generateMessages(6, customers[3], agents[0], subDays(new Date(), 1)),
    unreadCount: 0,
  },
  {
    id: 'chat-5',
    customer: customers[4],
    agent: agents[2],
    messages: generateMessages(2, customers[4], agents[2], subDays(new Date(), 2)),
    unreadCount: 0,
  },
];

export const availableAgents = agents;
