// Simple in-memory database for development
// In production, replace with a real database like PostgreSQL, MongoDB, etc.

interface DatabaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactRecord extends DatabaseRecord {
  name: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
  lastSeen?: string;
  notes?: string;
  tags?: string[];
  isActive: boolean;
}

interface AgentRecord extends DatabaseRecord {
  username: string;
  password: string; // In production, this should be hashed
  role: 'admin' | 'agent';
  permissions: {
    dashboard: boolean;
    agents: boolean;
    contacts: boolean;
    analytics: boolean;
    settings: boolean;
  };
  isActive: boolean;
}

class Database {
  private contacts: Map<string, ContactRecord> = new Map();
  private agents: Map<string, AgentRecord> = new Map();

  // Contact operations
  async createContact(data: Omit<ContactRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContactRecord> {
    const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const contact: ContactRecord = {
      id,
      createdAt: now,
      updatedAt: now,
      ...data,
      isActive: true
    };
    
    this.contacts.set(id, contact);
    return contact;
  }

  async getContact(id: string): Promise<ContactRecord | null> {
    return this.contacts.get(id) || null;
  }

  async getAllContacts(): Promise<ContactRecord[]> {
    return Array.from(this.contacts.values()).filter(contact => contact.isActive);
  }

  async updateContact(id: string, data: Partial<Omit<ContactRecord, 'id' | 'createdAt'>>): Promise<ContactRecord | null> {
    const contact = this.contacts.get(id);
    if (!contact) return null;

    const updatedContact: ContactRecord = {
      ...contact,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: string): Promise<boolean> {
    const contact = this.contacts.get(id);
    if (!contact) return false;

    // Soft delete
    contact.isActive = false;
    contact.updatedAt = new Date().toISOString();
    this.contacts.set(id, contact);
    return true;
  }

  async findContactByPhone(phoneNumber: string): Promise<ContactRecord | null> {
    for (const contact of this.contacts.values()) {
      if (contact.phoneNumber === phoneNumber && contact.isActive) {
        return contact;
      }
    }
    return null;
  }

  async findContactByName(name: string): Promise<ContactRecord | null> {
    for (const contact of this.contacts.values()) {
      if (contact.name === name && contact.isActive) {
        return contact;
      }
    }
    return null;
  }

  async findContactByEmail(email: string): Promise<ContactRecord | null> {
    for (const contact of this.contacts.values()) {
      if (contact.email === email && contact.isActive) {
        return contact;
      }
    }
    return null;
  }

  // Agent operations
  async createAgent(data: Omit<AgentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentRecord> {
    const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const agent: AgentRecord = {
      id,
      createdAt: now,
      updatedAt: now,
      ...data,
      isActive: true
    };
    
    this.agents.set(id, agent);
    return agent;
  }

  async getAgent(id: string): Promise<AgentRecord | null> {
    return this.agents.get(id) || null;
  }

  async getAllAgents(): Promise<AgentRecord[]> {
    return Array.from(this.agents.values()).filter(agent => agent.isActive);
  }

  async updateAgent(id: string, data: Partial<Omit<AgentRecord, 'id' | 'createdAt'>>): Promise<AgentRecord | null> {
    const agent = this.agents.get(id);
    if (!agent) return null;

    const updatedAgent: AgentRecord = {
      ...agent,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: string): Promise<boolean> {
    const agent = this.agents.get(id);
    if (!agent) return false;

    // Soft delete
    agent.isActive = false;
    agent.updatedAt = new Date().toISOString();
    this.agents.set(id, agent);
    return true;
  }

  async findAgentByUsername(username: string): Promise<AgentRecord | null> {
    for (const agent of this.agents.values()) {
      if (agent.username === username && agent.isActive) {
        return agent;
      }
    }
    return null;
  }

  async authenticateAgent(username: string, password: string): Promise<AgentRecord | null> {
    const agent = await this.findAgentByUsername(username);
    if (!agent) return null;

    // In production, use proper password hashing (bcrypt, etc.)
    if (agent.password === password) {
      return agent;
    }

    return null;
  }

  // Initialize with sample data
  async initialize(): Promise<void> {
    // Create admin user only if it doesn't exist
    const existingAdmin = await this.findAgentByUsername('admin');
    if (!existingAdmin) {
      await this.createAgent({
        username: 'admin',
        password: 'admin', // In production, this should be hashed
        role: 'admin',
        permissions: {
          dashboard: true,
          agents: true,
          contacts: true,
          analytics: true,
          settings: true
        }
      });
    }

    // Create sample contacts only if they don't exist
    const existingContact1 = await this.findContactByName('Dr Abdelrahman Baraka');
    if (!existingContact1) {
      await this.createContact({
        name: 'Dr Abdelrahman Baraka',
        phoneNumber: '+201557000970',
        email: 'abdelrahman@example.com',
        avatar: 'https://ui-avatars.com/api/?name=Dr+Abdelrahman+Baraka&background=10b981&color=ffffff&size=150',
        lastSeen: new Date().toISOString(),
        tags: ['vip', 'medical']
      });
    }

    const existingContact2 = await this.findContactByName('Abdelrahman Baraka');
    if (!existingContact2) {
      await this.createContact({
        name: 'Abdelrahman Baraka',
        phoneNumber: '+201016666348',
        avatar: 'https://ui-avatars.com/api/?name=Abdelrahman+Baraka&background=10b981&color=ffffff&size=150',
        lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        tags: ['regular']
      });
    }

    const existingContact3 = await this.findContactByName('WhatsApp +201120035300');
    if (!existingContact3) {
      await this.createContact({
        name: 'WhatsApp +201120035300',
        phoneNumber: '+201120035300',
        avatar: 'https://ui-avatars.com/api/?name=WhatsApp+201120035300&background=10b981&color=ffffff&size=150',
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        tags: ['new']
      });
    }
  }

  // Conversation operations (for compatibility with SQLite)
  async createConversation(data: {
    id: string;
    contact_id?: string;
    agent_id?: string;
    status?: string;
    priority?: string;
    twilio_conversation_sid: string;
  }): Promise<any> {
    // For in-memory database, we'll just return a mock object
    return {
      id: data.id,
      contact_id: data.contact_id,
      agent_id: data.agent_id,
      status: data.status || 'active',
      priority: data.priority || 'normal',
      twilio_conversation_sid: data.twilio_conversation_sid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async getConversation(id: string): Promise<any> {
    // For in-memory database, return null (no persistence)
    return null;
  }

  async updateConversation(id: string, data: {
    contact_id?: string;
    agent_id?: string;
    status?: string;
    priority?: string;
  }): Promise<any> {
    // For in-memory database, return a mock object
    return {
      id,
      ...data,
      updated_at: new Date().toISOString()
    };
  }

  async assignConversationToAgent(conversationId: string, agentId: string | null): Promise<any> {
    return await this.updateConversation(conversationId, { agent_id: agentId });
  }

  async getAllConversations(): Promise<any[]> {
    // For in-memory database, return empty array
    return [];
  }
}

// Export singleton instance
export const db = new Database();

// Initialize database on startup
db.initialize().catch(console.error);
