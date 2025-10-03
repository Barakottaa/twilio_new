import Database from 'better-sqlite3';
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
      // Use environment variable for database path, fallback to current directory
      const dbPath = process.env.SQLITE_DB_PATH || './database.sqlite';
      
      // Ensure the directory exists
      const path = require('path');
      const fs = require('fs');
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.db = new Database(dbPath);
      console.log('✅ SQLite database connected successfully at:', dbPath);
      await this.createTables();
    } catch (error) {
      console.error('Error opening SQLite database:', error);
      throw error;
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      const tableInfo = this.db.prepare("PRAGMA table_info(conversations)").all();
      const hasIsPinned = tableInfo.some((col: any) => col.name === 'is_pinned');
      
      if (!hasIsPinned) {
        this.db.exec(`ALTER TABLE conversations ADD COLUMN is_pinned INTEGER DEFAULT 0`);
        console.log('✅ Added is_pinned column to conversations table');
      } else {
        console.log('✅ is_pinned column already exists');
      }
    } catch (error) {
      console.log('Migration check failed:', error);
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

    const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO contacts (id, name, phone_number, email, avatar, last_seen, notes, tags, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.phone_number || null,
      data.email || null,
      data.avatar || null,
      data.last_seen || null,
      data.notes || null,
      data.tags || null,
      data.is_active || 1,
      now,
      now
    );

    return await this.getContact(id) as ContactRecord;
  }

  async getContact(id: string): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM contacts WHERE id = ?');
    const result = stmt.get(id) as ContactRecord | undefined;
    return result || null;
  }

  async getAllContacts(): Promise<ContactRecord[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM contacts WHERE is_active = 1 ORDER BY created_at DESC');
    return stmt.all() as ContactRecord[];
  }

  async updateContact(id: string, data: Partial<ContactRecord>): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (data as any)[field]);

    if (fields.length === 0) return await this.getContact(id);

    const stmt = this.db.prepare(`
      UPDATE contacts 
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(...values, now, id);
    return await this.getContact(id);
  }

  async deleteContact(id: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('UPDATE contacts SET is_active = 0 WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async findContactByPhone(phone: string): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM contacts WHERE phone_number = ? AND is_active = 1');
    const result = stmt.get(phone) as ContactRecord | undefined;
    return result || null;
  }

  async findContactByName(name: string): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM contacts WHERE name = ? AND is_active = 1');
    const result = stmt.get(name) as ContactRecord | undefined;
    return result || null;
  }

  // Agent operations
  async createAgent(data: {
    username: string;
    password: string;
    role: 'admin' | 'agent';
    permissions_dashboard?: number;
    permissions_agents?: number;
    permissions_contacts?: number;
    permissions_analytics?: number;
    permissions_settings?: number;
  }): Promise<AgentRecord> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO agents (id, username, password, role, permissions_dashboard, permissions_agents, permissions_contacts, permissions_analytics, permissions_settings, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.username,
      data.password,
      data.role,
      data.permissions_dashboard || 0,
      data.permissions_agents || 0,
      data.permissions_contacts || 0,
      data.permissions_analytics || 0,
      data.permissions_settings || 0,
      1,
      now,
      now
    );

    return await this.getAgent(id) as AgentRecord;
  }

  async getAgent(id: string): Promise<AgentRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM agents WHERE id = ?');
    const result = stmt.get(id) as AgentRecord | undefined;
    return result || null;
  }

  async getAllAgents(): Promise<AgentRecord[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM agents WHERE is_active = 1 ORDER BY created_at DESC');
    return stmt.all() as AgentRecord[];
  }

  async updateAgent(id: string, data: Partial<AgentRecord>): Promise<AgentRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (data as any)[field]);

    if (fields.length === 0) return await this.getAgent(id);

    const stmt = this.db.prepare(`
      UPDATE agents 
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(...values, now, id);
    return await this.getAgent(id);
  }

  async deleteAgent(id: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('UPDATE agents SET is_active = 0 WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async findAgentByUsername(username: string): Promise<AgentRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM agents WHERE username = ? AND is_active = 1');
    const result = stmt.get(username) as AgentRecord | undefined;
    return result || null;
  }

  async authenticateAgent(username: string, password: string): Promise<AgentRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM agents WHERE username = ? AND password = ? AND is_active = 1');
    const result = stmt.get(username, password) as AgentRecord | undefined;
    return result || null;
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

    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO conversations (id, contact_id, agent_id, status, priority, is_pinned, twilio_conversation_sid, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
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

    const stmt = this.db.prepare('SELECT * FROM conversations WHERE id = ?');
    const result = stmt.get(id);
    return result || null;
  }

  async getAllConversations(): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM conversations ORDER BY created_at DESC');
    return stmt.all();
  }

  async updateConversation(id: string, data: any): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => data[field]);

    if (fields.length === 0) return await this.getConversation(id);

    const stmt = this.db.prepare(`
      UPDATE conversations 
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(...values, now, id);
    return await this.getConversation(id);
  }

  async assignConversationToAgent(conversationId: string, agentId: string | null): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE conversations SET agent_id = ?, updated_at = ? WHERE id = ?');
    stmt.run(agentId, now, conversationId);
    return await this.getConversation(conversationId);
  }

  async updateConversationStatus(conversationId: string, status: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE conversations SET status = ?, updated_at = ? WHERE id = ?');
    stmt.run(status, now, conversationId);
    return await this.getConversation(conversationId);
  }

  async updateConversationPinStatus(conversationId: string, isPinned: boolean): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE conversations SET is_pinned = ?, updated_at = ? WHERE id = ?');
    stmt.run(isPinned ? 1 : 0, now, conversationId);
    return await this.getConversation(conversationId);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const sqliteDb = SQLiteDatabaseService.getInstance();
