import sqlite3 from 'sqlite3';
import { promisify } from 'util';
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
  private db: sqlite3.Database | null = null;
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
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database('./database.sqlite', (err) => {
        if (err) {
          console.error('Error opening SQLite database:', err);
          reject(err);
        } else {
          console.log('✅ SQLite database connected successfully');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));

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
        await run(sql);
        console.log('✅ Table created/verified successfully');
      } catch (error) {
        console.error('Error creating table:', error);
        throw error;
      }
    }

    // Add migration for is_pinned column if it doesn't exist
    try {
      await run(`ALTER TABLE conversations ADD COLUMN is_pinned INTEGER DEFAULT 0`);
      console.log('✅ Added is_pinned column to conversations table');
    } catch (error) {
      // Column already exists, ignore error
      console.log('is_pinned column already exists or migration failed:', error);
    }

    // Insert default admin user if not exists
    try {
      await run(`
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

    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

    const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await run(`
      INSERT INTO contacts (id, name, phone_number, email, avatar, last_seen, notes, tags, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
    ]);

    const result = await get('SELECT * FROM contacts WHERE id = ?', [id]);
    
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

    const get = promisify(this.db.get.bind(this.db));
    const result = await get('SELECT * FROM contacts WHERE id = ? AND is_active = 1', [id]);
    
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

    const all = promisify(this.db.all.bind(this.db));
    const result = await all('SELECT * FROM contacts WHERE is_active = 1 ORDER BY created_at DESC');
    
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

    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

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

    const result = await run(`
      UPDATE contacts SET ${updateFields.join(', ')}
      WHERE id = ?
    `, values);

    if (result.changes > 0) {
      return await this.getContact(id);
    }
    return null;
  }

  async deleteContact(id: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    const result = await run('UPDATE contacts SET is_active = 0, updated_at = ? WHERE id = ?', [new Date().toISOString(), id]);
    return result.changes > 0;
  }

  async findContactByPhone(phoneNumber: string): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));
    const result = await get('SELECT * FROM contacts WHERE phone_number = ? AND is_active = 1', [phoneNumber]);
    return result as ContactRecord || null;
  }

  async findContactByEmail(email: string): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));
    const result = await get('SELECT * FROM contacts WHERE email = ? AND is_active = 1', [email]);
    return result as ContactRecord || null;
  }

  // Agent operations
  async createAgent(data: Omit<AgentRecord, 'id' | 'created_at' | 'updated_at'>): Promise<AgentRecord> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

    const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await run(`
      INSERT INTO agents (id, username, password, role, permissions_dashboard, permissions_agents, permissions_contacts, permissions_analytics, permissions_settings, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
    ]);

    const result = await get('SELECT * FROM agents WHERE id = ?', [id]);
    return result as AgentRecord;
  }

  async getAgent(id: string): Promise<AgentRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));
    const result = await get('SELECT * FROM agents WHERE id = ? AND is_active = 1', [id]);
    return result as AgentRecord || null;
  }

  async getAllAgents(): Promise<AgentRecord[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const all = promisify(this.db.all.bind(this.db));
    const result = await all('SELECT * FROM agents WHERE is_active = 1 ORDER BY created_at DESC');
    return result as AgentRecord[];
  }

  async updateAgent(id: string, data: Partial<Omit<AgentRecord, 'id' | 'created_at'>>): Promise<AgentRecord | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

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

    const result = await run(`
      UPDATE agents SET ${updateFields.join(', ')}
      WHERE id = ?
    `, values);

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

    const get = promisify(this.db.get.bind(this.db));
    const result = await get('SELECT * FROM agents WHERE username = ? AND is_active = 1', [username]);
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

    const run = promisify(this.db.run.bind(this.db));
    const now = new Date().toISOString();

    await run(`
      INSERT INTO conversations (id, contact_id, agent_id, status, priority, is_pinned, twilio_conversation_sid, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.id,
      data.contact_id || null,
      data.agent_id || null,
      data.status || 'open',
      data.priority || 'normal',
      data.is_pinned || 0,
      data.twilio_conversation_sid,
      now,
      now
    ]);

    return await this.getConversation(data.id);
  }

  async getConversation(id: string): Promise<any> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));
    return await get('SELECT * FROM conversations WHERE id = ?', [id]);
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

    const run = promisify(this.db.run.bind(this.db));
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

    await run(`
      UPDATE conversations 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `, values);

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

  async getAllConversations(): Promise<any[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    const all = promisify(this.db.all.bind(this.db));
    return await all('SELECT * FROM conversations ORDER BY updated_at DESC');
  }
}

// Export singleton instance
export const sqliteDb = SQLiteDatabaseService.getInstance();
