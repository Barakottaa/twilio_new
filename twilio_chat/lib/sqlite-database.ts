import Database from 'better-sqlite3';
import path from 'path';
import type { Agent, Contact } from '@/types';

interface DatabaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

interface ContactRecord extends DatabaseRecord {
  name: string;
  phone_number?: string;
  email?: string;
  avatar?: string;
  last_seen?: string;
  notes?: string;
  tags?: string;
  is_active: number;
}

interface AgentRecord extends DatabaseRecord {
  username: string;
  password: string;
  role: 'admin' | 'agent';
  permissions_dashboard: number;
  permissions_agents: number;
  permissions_contacts: number;
  permissions_analytics: number;
  permissions_settings: number;
  is_active: number;
}

class SQLiteDatabaseService {
  private db: Database.Database | null = null;
  private isInitialized = false;
  private static instance: SQLiteDatabaseService | null = null;

  // Singleton pattern for better performance
  static getInstance(): SQLiteDatabaseService {
    if (!SQLiteDatabaseService.instance) {
      SQLiteDatabaseService.instance = new SQLiteDatabaseService();
    }
    return SQLiteDatabaseService.instance;
  }

  async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
      this.isInitialized = true;
    }
  }

  private async initialize(): Promise<void> {
    try {
      // Use absolute path to ensure database is found regardless of working directory
      const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'database.sqlite');
      console.log('🔍 Database path:', dbPath);
      this.db = new Database(dbPath);
      console.log('✅ SQLite database connected successfully');
      await this.createTables();
    } catch (err) {
      console.error('Error opening SQLite database:', err);
      throw err;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      `CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK (role IN ('admin', 'agent')) NOT NULL,
        permissions_dashboard INTEGER DEFAULT 0,
        permissions_agents INTEGER DEFAULT 0,
        permissions_contacts INTEGER DEFAULT 0,
        permissions_analytics INTEGER DEFAULT 0,
        permissions_settings INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone_number TEXT,
        email TEXT,
        avatar TEXT,
        last_seen DATETIME,
        notes TEXT,
        tags TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        contact_id TEXT REFERENCES contacts(id),
        agent_id TEXT REFERENCES agents(id),
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'normal',
        is_pinned INTEGER DEFAULT 0,
        is_new INTEGER DEFAULT 1,
        twilio_conversation_sid TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT REFERENCES conversations(id),
        sender_id TEXT,
        sender_type TEXT CHECK (sender_type IN ('agent', 'contact')),
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        twilio_message_sid TEXT UNIQUE,
        delivery_status TEXT CHECK (delivery_status IN ('sending', 'sent', 'delivered', 'read', 'failed', 'undelivered')),
        media_url TEXT,
        media_content_type TEXT,
        media_filename TEXT,
        media_data TEXT,
        chat_service_sid TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        conversation_id TEXT REFERENCES conversations(id),
        agent_id TEXT REFERENCES agents(id),
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      try {
        this.db.exec(sql);
        console.log('✅ Table created/verified successfully');
      } catch (error) {
        console.error('Error creating table:', error);
        throw error;
      }
    }

    // Add migration for is_pinned column if it doesn't exist
    try {
      // Check if column exists first
      const pinnedCheck = this.db.prepare(`PRAGMA table_info(conversations)`).all();
      const hasPinnedColumn = pinnedCheck.some((col: any) => col.name === 'is_pinned');
      
      if (!hasPinnedColumn) {
        this.db.exec(`ALTER TABLE conversations ADD COLUMN is_pinned INTEGER DEFAULT 0`);
        console.log('✅ Added is_pinned column to conversations table');
      } else {
        console.log('✅ is_pinned column already exists');
      }
    } catch (error) {
      console.log('is_pinned column migration failed:', error);
    }

    // Add migration for is_new column if it doesn't exist
    try {
      // Check if column exists first
      const newCheck = this.db.prepare(`PRAGMA table_info(conversations)`).all();
      const hasNewColumn = newCheck.some((col: any) => col.name === 'is_new');
      
      if (!hasNewColumn) {
        this.db.exec(`ALTER TABLE conversations ADD COLUMN is_new INTEGER DEFAULT 1`);
        console.log('✅ Added is_new column to conversations table');
      } else {
        console.log('✅ is_new column already exists');
      }
    } catch (error) {
      console.log('is_new column migration failed:', error);
    }

    // Add migrations for media columns in messages table
    const mediaColumns = [
      { name: 'media_url', sql: 'ALTER TABLE messages ADD COLUMN media_url TEXT' },
      { name: 'media_content_type', sql: 'ALTER TABLE messages ADD COLUMN media_content_type TEXT' },
      { name: 'media_filename', sql: 'ALTER TABLE messages ADD COLUMN media_filename TEXT' },
      { name: 'media_data', sql: 'ALTER TABLE messages ADD COLUMN media_data TEXT' },
      { name: 'chat_service_sid', sql: 'ALTER TABLE messages ADD COLUMN chat_service_sid TEXT' },
      { name: 'delivery_status', sql: 'ALTER TABLE messages ADD COLUMN delivery_status TEXT CHECK (delivery_status IN (\'sending\', \'sent\', \'delivered\', \'read\', \'failed\', \'undelivered\'))' }
    ];

    // Check existing columns first
    const messagesCheck = this.db.prepare(`PRAGMA table_info(messages)`).all();
    const existingColumns = messagesCheck.map((col: any) => col.name);

    for (const col of mediaColumns) {
      try {
        if (!existingColumns.includes(col.name)) {
          this.db.exec(col.sql);
          console.log(`✅ Added ${col.name} column to messages table`);
        } else {
          console.log(`✅ ${col.name} column already exists`);
        }
      } catch (error) {
        console.log(`${col.name} column migration failed:`, error);
      }
    }

    // Insert default admin user if not exists
    try {
      this.db.exec(`
        INSERT OR IGNORE INTO agents (id, username, password, role, permissions_dashboard, permissions_agents, permissions_contacts, permissions_analytics, permissions_settings)
        VALUES ('admin_001', 'admin', 'admin', 'admin', 1, 1, 1, 1, 1)
      `);
      console.log('✅ Default admin user created/verified');
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
  }

  // Contact operations
  async createContact(data: Omit<ContactRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ContactRecord> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    // Using better-sqlite3 synchronous API

    const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO contacts (id, name, phone_number, email, avatar, last_seen, notes, tags, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.phoneNumber || null,
      data.email || null,
      data.avatar || null,
      data.lastSeen || null,
      data.notes || null,
      data.tags || null,
      data.isActive !== false ? 1 : 0,
      now,
      now
    );

    const result = this.db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    
    // Map snake_case database fields to camelCase interface fields
    return {
      id: result.id,
      name: result.name,
      phoneNumber: result.phone_number,
      email: result.email,
      avatar: result.avatar,
      lastSeen: result.last_seen,
      notes: result.notes,
      tags: result.tags && result.tags !== '[object Object]' ? JSON.parse(result.tags) : [],
      isActive: result.is_active === 1,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    } as ContactRecord;
  }

  async getContact(id: string): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    const result = this.db.prepare('SELECT * FROM contacts WHERE id = ? AND is_active = 1').get(id);
    
    if (!result) return null;
    
    // Map snake_case database fields to camelCase interface fields
    return {
      id: result.id,
      name: result.name,
      phoneNumber: result.phone_number,
      email: result.email,
      avatar: result.avatar,
      lastSeen: result.last_seen,
      notes: result.notes,
      tags: result.tags && result.tags !== '[object Object]' ? JSON.parse(result.tags) : [],
      isActive: result.is_active === 1,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    } as ContactRecord;
  }

  async getAllContacts(): Promise<ContactRecord[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    const result = this.db.prepare('SELECT * FROM contacts WHERE is_active = 1 ORDER BY created_at DESC').all();
    
    // Map snake_case database fields to camelCase interface fields
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      phoneNumber: row.phone_number,
      email: row.email,
      avatar: row.avatar,
      lastSeen: row.last_seen,
      notes: row.notes,
      tags: row.tags && row.tags !== '[object Object]' ? JSON.parse(row.tags) : [],
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) as ContactRecord[];
  }

  async updateContact(id: string, data: Partial<Omit<ContactRecord, 'id' | 'created_at'>>): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    // Using better-sqlite3 synchronous API

    const updateFields = [];
    const values = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      values.push(data.name);
    }
    if (data.phoneNumber !== undefined) {
      updateFields.push('phone_number = ?');
      values.push(data.phoneNumber);
    }
    if (data.email !== undefined) {
      updateFields.push('email = ?');
      values.push(data.email);
    }
    if (data.avatar !== undefined) {
      updateFields.push('avatar = ?');
      values.push(data.avatar);
    }
    if (data.lastSeen !== undefined) {
      updateFields.push('last_seen = ?');
      values.push(data.lastSeen);
    }
    if (data.notes !== undefined) {
      updateFields.push('notes = ?');
      values.push(data.notes);
    }
    if (data.tags !== undefined) {
      updateFields.push('tags = ?');
      values.push(data.tags);
    }
    if (data.isActive !== undefined) {
      updateFields.push('is_active = ?');
      values.push(data.isActive ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return await this.getContact(id);
    }

    updateFields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const result = this.db.prepare(`
      UPDATE contacts SET ${updateFields.join(', ')}
      WHERE id = ?
    `).run(...values);

    if (result.changes > 0) {
      return await this.getContact(id);
    }
    return null;
  }

  async deleteContact(id: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    const result = this.db.prepare('UPDATE contacts SET is_active = 0, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    return result.changes > 0;
  }

  async findContactByPhone(phoneNumber: string): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    const result = this.db.prepare('SELECT * FROM contacts WHERE phone_number = ? AND is_active = 1').get(phoneNumber);
    return result as ContactRecord || null;
  }

  async findContactByEmail(email: string): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    const result = this.db.prepare('SELECT * FROM contacts WHERE email = ? AND is_active = 1').get(email);
    return result as ContactRecord || null;
  }

  // Agent operations
  async createAgent(data: Omit<AgentRecord, 'id' | 'created_at' | 'updated_at'>): Promise<AgentRecord> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    // Using better-sqlite3 synchronous API

    const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO agents (id, username, password, role, permissions_dashboard, permissions_agents, permissions_contacts, permissions_analytics, permissions_settings, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.username,
      data.password,
      data.role,
      data.permissions_dashboard || 0,
      data.permissions_agents || 0,
      data.permissions_contacts || 0,
      data.permissions_analytics || 0,
      data.permissions_settings || 0,
      data.is_active || 1,
      now,
      now
    );

    const result = this.db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
    return result as AgentRecord;
  }

  async getAgent(id: string): Promise<AgentRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM agents WHERE id = ? AND is_active = 1');
    const result = stmt.get(id);
    return result as AgentRecord || null;
  }

  async getAllAgents(): Promise<AgentRecord[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    const result = this.db.prepare('SELECT * FROM agents WHERE is_active = 1 ORDER BY created_at DESC').all();
    return result as AgentRecord[];
  }

  async updateAgent(id: string, data: Partial<Omit<AgentRecord, 'id' | 'created_at'>>): Promise<AgentRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    // Using better-sqlite3 synchronous API

    const updateFields = [];
    const values = [];

    if (data.username !== undefined) {
      updateFields.push('username = ?');
      values.push(data.username);
    }
    if (data.password !== undefined) {
      updateFields.push('password = ?');
      values.push(data.password);
    }
    if (data.role !== undefined) {
      updateFields.push('role = ?');
      values.push(data.role);
    }
    if (data.permissions_dashboard !== undefined) {
      updateFields.push('permissions_dashboard = ?');
      values.push(data.permissions_dashboard);
    }
    if (data.permissions_agents !== undefined) {
      updateFields.push('permissions_agents = ?');
      values.push(data.permissions_agents);
    }
    if (data.permissions_contacts !== undefined) {
      updateFields.push('permissions_contacts = ?');
      values.push(data.permissions_contacts);
    }
    if (data.permissions_analytics !== undefined) {
      updateFields.push('permissions_analytics = ?');
      values.push(data.permissions_analytics);
    }
    if (data.permissions_settings !== undefined) {
      updateFields.push('permissions_settings = ?');
      values.push(data.permissions_settings);
    }
    if (data.is_active !== undefined) {
      updateFields.push('is_active = ?');
      values.push(data.is_active);
    }

    if (updateFields.length === 0) {
      return await this.getAgent(id);
    }

    updateFields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const result = this.db.prepare(`
      UPDATE agents SET ${updateFields.join(', ')}
      WHERE id = ?
    `).run(...values);

    if (result.changes > 0) {
      return await this.getAgent(id);
    }
    return null;
  }

  async deleteAgent(id: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.run('UPDATE agents SET is_active = 0, updated_at = ? WHERE id = ?', [new Date().toISOString(), id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async findAgentByUsername(username: string): Promise<AgentRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM agents WHERE username = ? AND is_active = 1');
    const result = stmt.get(username);
    return result as AgentRecord || null;
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

  // Initialize with sample data (optional)
  async initializeSampleData(): Promise<void> {
    await this.ensureInitialized();
    
    // Check if we already have data
    const existingAgents = await this.getAllAgents();
    if (existingAgents.length > 0) {
      console.log('SQLite database already initialized with data');
      return;
    }

    console.log('SQLite database initialized successfully');
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve) => {
        this.db!.close((err) => {
          if (err) {
            console.error('Error closing SQLite database:', err);
          } else {
            console.log('SQLite database connection closed');
          }
          resolve();
        });
      });
    }
  }

  // Conversation operations
  async createConversation(data: {
    id: string;
    contact_id?: string;
    agent_id?: string;
    status?: string;
    priority?: string;
    is_pinned?: number;
    twilio_conversation_sid: string;
  }): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO conversations (id, contact_id, agent_id, status, priority, is_pinned, twilio_conversation_sid, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.contact_id || null,
      data.agent_id || null,
      data.status || 'open',
      data.priority || 'normal',
      data.is_pinned || 0,
      data.twilio_conversation_sid,
      now,
      now
    );

    return await this.getConversation(data.id);
  }

  async getConversation(id: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    return this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
  }

  async updateConversation(id: string, data: {
    contact_id?: string;
    agent_id?: string;
    status?: string;
    priority?: string;
    is_pinned?: number;
  }): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    // Using better-sqlite3 synchronous API
    const now = new Date().toISOString();

    const updates = [];
    const values = [];

    if (data.contact_id !== undefined) {
      updates.push('contact_id = ?');
      values.push(data.contact_id);
    }
    if (data.agent_id !== undefined) {
      updates.push('agent_id = ?');
      values.push(data.agent_id);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.priority !== undefined) {
      updates.push('priority = ?');
      values.push(data.priority);
    }
    if (data.is_pinned !== undefined) {
      updates.push('is_pinned = ?');
      values.push(data.is_pinned);
    }

    if (updates.length === 0) {
      return await this.getConversation(id);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.prepare(`
      UPDATE conversations 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `).run(...values);

    return await this.getConversation(id);
  }

  async assignConversationToAgent(conversationId: string, agentId: string | null): Promise<any> {
    return await this.updateConversation(conversationId, { agent_id: agentId });
  }

  async updateConversationStatus(conversationId: string, status: string): Promise<any> {
    return await this.updateConversation(conversationId, { status: status });
  }

  async updateConversationPinStatus(conversationId: string, isPinned: boolean): Promise<any> {
    return await this.updateConversation(conversationId, { is_pinned: isPinned ? 1 : 0 });
  }

  async markConversationAsRead(conversationId: string): Promise<any> {
    return await this.updateConversation(conversationId, { is_new: 0 });
  }

  async hasAgentReplies(conversationId: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM messages 
      WHERE conversation_id = ? AND sender_type = 'agent'
    `);
    const result = stmt.get(conversationId);
    return (result as any).count > 0;
  }

  async getAllConversations(): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM conversations ORDER BY CASE WHEN status = "open" THEN 0 ELSE 1 END, updated_at DESC');
    return stmt.all();
  }

  // Message operations
  async createMessage(data: {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_type: 'agent' | 'contact';
    content: string;
    message_type?: string;
    twilio_message_sid?: string;
    delivery_status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
    media_url?: string;
    media_content_type?: string;
    media_filename?: string;
    media_data?: string;
    chat_service_sid?: string;
    created_at?: string;
  }): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();

    // Check if message already exists by twilio_message_sid
    if (data.twilio_message_sid) {
      const existing = this.db.prepare(`
        SELECT id FROM messages WHERE twilio_message_sid = ?
      `).get(data.twilio_message_sid);
      
      if (existing) {
        console.log(`⚠️ Message with twilio_message_sid ${data.twilio_message_sid} already exists, skipping insert`);
        return existing;
      }
    }

    this.db.prepare(`
      INSERT INTO messages (
        id, conversation_id, sender_id, sender_type, content, message_type,
        twilio_message_sid, delivery_status, media_url, media_content_type, media_filename,
        media_data, chat_service_sid, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.conversation_id,
      data.sender_id,
      data.sender_type,
      data.content,
      data.message_type || 'text',
      data.twilio_message_sid || null,
      data.delivery_status || null,
      data.media_url || null,
      data.media_content_type || null,
      data.media_filename || null,
      data.media_data || null,
      data.chat_service_sid || null,
      data.created_at || now
    );

    return await this.getMessage(data.id);
  }

  async getMessage(id: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return this.db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  }

  async getMessageByTwilioSid(twilioMessageSid: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return this.db.prepare('SELECT * FROM messages WHERE twilio_message_sid = ?').get(twilioMessageSid);
  }

  async updateMessageDeliveryStatus(twilioMessageSid: string, deliveryStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered'): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('UPDATE messages SET delivery_status = ? WHERE twilio_message_sid = ?');
    const result = stmt.run(deliveryStatus, twilioMessageSid);
    
    if (result.changes === 0) {
      throw new Error(`No message found with Twilio SID: ${twilioMessageSid}`);
    }
    
    return await this.getMessageByTwilioSid(twilioMessageSid);
  }

  // Comment operations
  async createComment(data: {
    id: string;
    conversation_id: string;
    agent_id: string;
    content: string;
  }): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO comments (id, conversation_id, agent_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(data.id, data.conversation_id, data.agent_id, data.content);
    return result;
  }

  async getComment(id: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM comments WHERE id = ?');
    const result = stmt.get(id);
    return result;
  }

  async getCommentsByConversation(conversationId: string): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT c.*, a.username as agent_name 
      FROM comments c 
      LEFT JOIN agents a ON c.agent_id = a.id 
      WHERE c.conversation_id = ? 
      ORDER BY c.created_at DESC
    `);
    const results = stmt.all(conversationId);
    return results;
  }

  async updateComment(id: string, content: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(content, id);
    return result;
  }

  async deleteComment(id: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('DELETE FROM comments WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

// Export singleton instance
export const sqliteDb = SQLiteDatabaseService.getInstance();
