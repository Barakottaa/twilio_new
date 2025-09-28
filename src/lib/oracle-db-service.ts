import { getOracleConnection, oracleResultToPlain } from './oracle-database';
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

class OracleDatabaseService {
  private isInitialized = false;

  async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      const { initializeOraclePool, initializeOracleTables } = await import('./oracle-database');
      await initializeOraclePool();
      await initializeOracleTables();
      this.isInitialized = true;
    }
  }

  // Contact operations
  async createContact(data: Omit<ContactRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ContactRecord> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const result = await connection.execute(`
        INSERT INTO contacts (id, name, phone_number, email, avatar, last_seen, notes, tags, is_active, created_at, updated_at)
        VALUES (:id, :name, :phone_number, :email, :avatar, :last_seen, :notes, :tags, :is_active, :created_at, :updated_at)
        RETURNING id, name, phone_number, email, avatar, last_seen, notes, tags, is_active, created_at, updated_at INTO :result
      `, {
        id,
        name: data.name,
        phone_number: data.phone_number || null,
        email: data.email || null,
        avatar: data.avatar || null,
        last_seen: data.last_seen ? new Date(data.last_seen) : null,
        notes: data.notes || null,
        tags: data.tags || null,
        is_active: data.is_active || 1,
        created_at: new Date(now),
        updated_at: new Date(now),
        result: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
      });

      await connection.commit();
      return oracleResultToPlain(result.outBinds.result[0]);
    } finally {
      await connection.close();
    }
  }

  async getContact(id: string): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const result = await connection.execute(`
        SELECT id, name, phone_number, email, avatar, last_seen, notes, tags, is_active, created_at, updated_at
        FROM contacts WHERE id = :id AND is_active = 1
      `, { id });

      if (result.rows && result.rows.length > 0) {
        return oracleResultToPlain(result.rows[0]);
      }
      return null;
    } finally {
      await connection.close();
    }
  }

  async getAllContacts(): Promise<ContactRecord[]> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const result = await connection.execute(`
        SELECT id, name, phone_number, email, avatar, last_seen, notes, tags, is_active, created_at, updated_at
        FROM contacts WHERE is_active = 1 ORDER BY created_at DESC
      `);

      return oracleResultToPlain(result.rows || []);
    } finally {
      await connection.close();
    }
  }

  async updateContact(id: string, data: Partial<Omit<ContactRecord, 'id' | 'created_at'>>): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const updateFields = [];
      const bindVars: any = { id, updated_at: new Date() };

      if (data.name !== undefined) {
        updateFields.push('name = :name');
        bindVars.name = data.name;
      }
      if (data.phone_number !== undefined) {
        updateFields.push('phone_number = :phone_number');
        bindVars.phone_number = data.phone_number;
      }
      if (data.email !== undefined) {
        updateFields.push('email = :email');
        bindVars.email = data.email;
      }
      if (data.avatar !== undefined) {
        updateFields.push('avatar = :avatar');
        bindVars.avatar = data.avatar;
      }
      if (data.last_seen !== undefined) {
        updateFields.push('last_seen = :last_seen');
        bindVars.last_seen = data.last_seen ? new Date(data.last_seen) : null;
      }
      if (data.notes !== undefined) {
        updateFields.push('notes = :notes');
        bindVars.notes = data.notes;
      }
      if (data.tags !== undefined) {
        updateFields.push('tags = :tags');
        bindVars.tags = data.tags;
      }
      if (data.is_active !== undefined) {
        updateFields.push('is_active = :is_active');
        bindVars.is_active = data.is_active;
      }

      if (updateFields.length === 0) {
        return await this.getContact(id);
      }

      updateFields.push('updated_at = :updated_at');

      const result = await connection.execute(`
        UPDATE contacts SET ${updateFields.join(', ')}
        WHERE id = :id
        RETURNING id, name, phone_number, email, avatar, last_seen, notes, tags, is_active, created_at, updated_at INTO :result
      `, {
        ...bindVars,
        result: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
      });

      await connection.commit();
      
      if (result.rowsAffected && result.rowsAffected > 0) {
        return oracleResultToPlain(result.outBinds.result[0]);
      }
      return null;
    } finally {
      await connection.close();
    }
  }

  async deleteContact(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const result = await connection.execute(`
        UPDATE contacts SET is_active = 0, updated_at = :updated_at WHERE id = :id
      `, { id, updated_at: new Date() });

      await connection.commit();
      return (result.rowsAffected || 0) > 0;
    } finally {
      await connection.close();
    }
  }

  async findContactByPhone(phoneNumber: string): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const result = await connection.execute(`
        SELECT id, name, phone_number, email, avatar, last_seen, notes, tags, is_active, created_at, updated_at
        FROM contacts WHERE phone_number = :phone_number AND is_active = 1
      `, { phone_number: phoneNumber });

      if (result.rows && result.rows.length > 0) {
        return oracleResultToPlain(result.rows[0]);
      }
      return null;
    } finally {
      await connection.close();
    }
  }

  async findContactByEmail(email: string): Promise<ContactRecord | null> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const result = await connection.execute(`
        SELECT id, name, phone_number, email, avatar, last_seen, notes, tags, is_active, created_at, updated_at
        FROM contacts WHERE email = :email AND is_active = 1
      `, { email });

      if (result.rows && result.rows.length > 0) {
        return oracleResultToPlain(result.rows[0]);
      }
      return null;
    } finally {
      await connection.close();
    }
  }

  // Agent operations
  async createAgent(data: Omit<AgentRecord, 'id' | 'created_at' | 'updated_at'>): Promise<AgentRecord> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const result = await connection.execute(`
        INSERT INTO agents (id, username, password, role, permissions_dashboard, permissions_agents, permissions_contacts, permissions_analytics, permissions_settings, is_active, created_at, updated_at)
        VALUES (:id, :username, :password, :role, :permissions_dashboard, :permissions_agents, :permissions_contacts, :permissions_analytics, :permissions_settings, :is_active, :created_at, :updated_at)
        RETURNING id, username, password, role, permissions_dashboard, permissions_agents, permissions_contacts, permissions_analytics, permissions_settings, is_active, created_at, updated_at INTO :result
      `, {
        id,
        username: data.username,
        password: data.password,
        role: data.role,
        permissions_dashboard: data.permissions_dashboard || 0,
        permissions_agents: data.permissions_agents || 0,
        permissions_contacts: data.permissions_contacts || 0,
        permissions_analytics: data.permissions_analytics || 0,
        permissions_settings: data.permissions_settings || 0,
        is_active: data.is_active || 1,
        created_at: new Date(now),
        updated_at: new Date(now),
        result: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
      });

      await connection.commit();
      return oracleResultToPlain(result.outBinds.result[0]);
    } finally {
      await connection.close();
    }
  }

  async getAgent(id: string): Promise<AgentRecord | null> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const result = await connection.execute(`
        SELECT id, username, password, role, permissions_dashboard, permissions_agents, permissions_contacts, permissions_analytics, permissions_settings, is_active, created_at, updated_at
        FROM agents WHERE id = :id AND is_active = 1
      `, { id });

      if (result.rows && result.rows.length > 0) {
        return oracleResultToPlain(result.rows[0]);
      }
      return null;
    } finally {
      await connection.close();
    }
  }

  async getAllAgents(): Promise<AgentRecord[]> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const result = await connection.execute(`
        SELECT id, username, password, role, permissions_dashboard, permissions_agents, permissions_contacts, permissions_analytics, permissions_settings, is_active, created_at, updated_at
        FROM agents WHERE is_active = 1 ORDER BY created_at DESC
      `);

      return oracleResultToPlain(result.rows || []);
    } finally {
      await connection.close();
    }
  }

  async updateAgent(id: string, data: Partial<Omit<AgentRecord, 'id' | 'created_at'>>): Promise<AgentRecord | null> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const updateFields = [];
      const bindVars: any = { id, updated_at: new Date() };

      if (data.username !== undefined) {
        updateFields.push('username = :username');
        bindVars.username = data.username;
      }
      if (data.password !== undefined) {
        updateFields.push('password = :password');
        bindVars.password = data.password;
      }
      if (data.role !== undefined) {
        updateFields.push('role = :role');
        bindVars.role = data.role;
      }
      if (data.permissions_dashboard !== undefined) {
        updateFields.push('permissions_dashboard = :permissions_dashboard');
        bindVars.permissions_dashboard = data.permissions_dashboard;
      }
      if (data.permissions_agents !== undefined) {
        updateFields.push('permissions_agents = :permissions_agents');
        bindVars.permissions_agents = data.permissions_agents;
      }
      if (data.permissions_contacts !== undefined) {
        updateFields.push('permissions_contacts = :permissions_contacts');
        bindVars.permissions_contacts = data.permissions_contacts;
      }
      if (data.permissions_analytics !== undefined) {
        updateFields.push('permissions_analytics = :permissions_analytics');
        bindVars.permissions_analytics = data.permissions_analytics;
      }
      if (data.permissions_settings !== undefined) {
        updateFields.push('permissions_settings = :permissions_settings');
        bindVars.permissions_settings = data.permissions_settings;
      }
      if (data.is_active !== undefined) {
        updateFields.push('is_active = :is_active');
        bindVars.is_active = data.is_active;
      }

      if (updateFields.length === 0) {
        return await this.getAgent(id);
      }

      updateFields.push('updated_at = :updated_at');

      const result = await connection.execute(`
        UPDATE agents SET ${updateFields.join(', ')}
        WHERE id = :id
        RETURNING id, username, password, role, permissions_dashboard, permissions_agents, permissions_contacts, permissions_analytics, permissions_settings, is_active, created_at, updated_at INTO :result
      `, {
        ...bindVars,
        result: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
      });

      await connection.commit();
      
      if (result.rowsAffected && result.rowsAffected > 0) {
        return oracleResultToPlain(result.outBinds.result[0]);
      }
      return null;
    } finally {
      await connection.close();
    }
  }

  async deleteAgent(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const result = await connection.execute(`
        UPDATE agents SET is_active = 0, updated_at = :updated_at WHERE id = :id
      `, { id, updated_at: new Date() });

      await connection.commit();
      return (result.rowsAffected || 0) > 0;
    } finally {
      await connection.close();
    }
  }

  async findAgentByUsername(username: string): Promise<AgentRecord | null> {
    await this.ensureInitialized();
    const connection = await getOracleConnection();
    
    try {
      const result = await connection.execute(`
        SELECT id, username, password, role, permissions_dashboard, permissions_agents, permissions_contacts, permissions_analytics, permissions_settings, is_active, created_at, updated_at
        FROM agents WHERE username = :username AND is_active = 1
      `, { username });

      if (result.rows && result.rows.length > 0) {
        return oracleResultToPlain(result.rows[0]);
      }
      return null;
    } finally {
      await connection.close();
    }
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
    await this.ensureInitialized();
    
    // Check if we already have data
    const existingAgents = await this.getAllAgents();
    if (existingAgents.length > 0) {
      console.log('Oracle database already initialized with data');
      return;
    }

    // Create sample contacts
    await this.createContact({
      name: 'Dr Abdelrahman Baraka',
      phone_number: '+201557000970',
      email: 'abdelrahman@example.com',
      avatar: 'https://ui-avatars.com/api/?name=Dr+Abdelrahman+Baraka&background=10b981&color=ffffff&size=150',
      last_seen: new Date().toISOString(),
      tags: 'vip,medical'
    });

    await this.createContact({
      name: 'Abdelrahman Baraka',
      phone_number: '+201016666348',
      avatar: 'https://ui-avatars.com/api/?name=Abdelrahman+Baraka&background=10b981&color=ffffff&size=150',
      last_seen: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      tags: 'regular'
    });

    await this.createContact({
      name: 'WhatsApp +201120035300',
      phone_number: '+201120035300',
      avatar: 'https://ui-avatars.com/api/?name=WhatsApp+201120035300&background=10b981&color=ffffff&size=150',
      last_seen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      tags: 'new'
    });

    console.log('Oracle database initialized with sample data');
  }
}

// Export singleton instance
export const oracleDb = new OracleDatabaseService();
