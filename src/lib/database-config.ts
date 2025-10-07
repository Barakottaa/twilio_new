// Database interface
export interface DatabaseInterface {
  // Agent methods
  getAgent(id: string): Promise<any>;
  getAllAgents(): Promise<any[]>;
  createAgent(data: any): Promise<any>;
  updateAgent(id: string, data: any): Promise<any>;
  deleteAgent(id: string): Promise<boolean>;
  
  // Contact methods
  getContact(id: string): Promise<any>;
  getAllContacts(): Promise<any[]>;
  createContact(data: any): Promise<any>;
  updateContact(id: string, data: any): Promise<any>;
  deleteContact(id: string): Promise<boolean>;
  findContactByPhone(phone: string): Promise<any>;
  
  // Conversation methods
  getConversation(id: string): Promise<any>;
  getAllConversations(): Promise<any[]>;
  createConversation(data: any): Promise<any>;
  updateConversation(id: string, data: any): Promise<any>;
  assignConversationToAgent(conversationId: string, agentId: string | null): Promise<any>;
  updateConversationStatus(conversationId: string, status: string): Promise<any>;
  updateConversationPinStatus(conversationId: string, isPinned: boolean): Promise<any>;
  markConversationAsRead(conversationId: string): Promise<any>;
  hasAgentReplies(conversationId: string): Promise<boolean>;
  
  // Message methods
  createMessage(data: any): Promise<any>;
  getMessage(id: string): Promise<any>;
  getMessageByTwilioSid(twilioMessageSid: string): Promise<any>;
  updateMessageDeliveryStatus(twilioMessageSid: string, deliveryStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered'): Promise<any>;
  
  // Comment methods
  createComment(data: any): Promise<any>;
  getComment(id: string): Promise<any>;
  getCommentsByConversation(conversationId: string): Promise<any[]>;
  updateComment(id: string, content: string): Promise<any>;
  deleteComment(id: string): Promise<boolean>;
}

// Database configuration
export const DATABASE_CONFIG = {
  // Set to 'sqlite' for SQLite database, 'memory' for in-memory database
  type: process.env.DATABASE_TYPE || 'sqlite',
  
  // SQLite configuration
  sqlite: {
    dbPath: process.env.SQLITE_DB_PATH || './database.sqlite'
  }
};

// Database factory function
export async function getDatabase(): Promise<DatabaseInterface> {
  if (DATABASE_CONFIG.type === 'sqlite') {
    const { sqliteDb } = await import('./sqlite-database');
    return sqliteDb;
  } else {
    const { db } = await import('./database');
    return db;
  }
}
