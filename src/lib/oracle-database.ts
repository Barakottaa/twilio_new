import oracledb from 'oracledb';

// Initialize Oracle client in thick mode for older database versions
try {
  oracledb.initOracleClient();
  console.log('✅ Oracle client initialized in thick mode');
} catch (error) {
  console.log('⚠️  Thick mode not available, using thin mode');
}

// Oracle Database configuration
const dbConfig = {
  user: 'crm',
  password: 'crm',
  connectString: 'localhost:1521/ldm', // Updated to use correct SID
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60,
  stmtCacheSize: 30
};

// Initialize Oracle connection pool
let pool: oracledb.Pool | null = null;

export async function initializeOraclePool(): Promise<void> {
  try {
    if (!pool) {
      pool = await oracledb.createPool(dbConfig);
      console.log('Oracle connection pool created successfully');
    }
  } catch (error) {
    console.error('Error creating Oracle connection pool:', error);
    throw error;
  }
}

export async function getOracleConnection(): Promise<oracledb.Connection> {
  if (!pool) {
    await initializeOraclePool();
  }
  return await pool!.getConnection();
}

export async function closeOraclePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Oracle connection pool closed');
  }
}

// Database table schemas
export const TABLES = {
  AGENTS: `
    CREATE TABLE agents (
      id VARCHAR2(50) PRIMARY KEY,
      username VARCHAR2(100) UNIQUE NOT NULL,
      password VARCHAR2(255) NOT NULL,
      role VARCHAR2(20) CHECK (role IN ('admin', 'agent')) NOT NULL,
      permissions_dashboard NUMBER(1) DEFAULT 0,
      permissions_agents NUMBER(1) DEFAULT 0,
      permissions_contacts NUMBER(1) DEFAULT 0,
      permissions_analytics NUMBER(1) DEFAULT 0,
      permissions_settings NUMBER(1) DEFAULT 0,
      is_active NUMBER(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  CONTACTS: `
    CREATE TABLE contacts (
      id VARCHAR2(50) PRIMARY KEY,
      name VARCHAR2(255) NOT NULL,
      phone_number VARCHAR2(20),
      email VARCHAR2(255),
      avatar VARCHAR2(500),
      last_seen TIMESTAMP,
      notes CLOB,
      tags VARCHAR2(500),
      is_active NUMBER(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  CONVERSATIONS: `
    CREATE TABLE conversations (
      id VARCHAR2(50) PRIMARY KEY,
      contact_id VARCHAR2(50) REFERENCES contacts(id),
      agent_id VARCHAR2(50) REFERENCES agents(id),
      status VARCHAR2(20) DEFAULT 'active',
      priority VARCHAR2(20) DEFAULT 'normal',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  MESSAGES: `
    CREATE TABLE messages (
      id VARCHAR2(50) PRIMARY KEY,
      conversation_id VARCHAR2(50) REFERENCES conversations(id),
      sender_id VARCHAR2(50),
      sender_type VARCHAR2(20) CHECK (sender_type IN ('agent', 'contact')),
      content CLOB NOT NULL,
      message_type VARCHAR2(20) DEFAULT 'text',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
};

// Initialize database tables
export async function initializeOracleTables(): Promise<void> {
  const connection = await getOracleConnection();
  
  try {
    // Create tables if they don't exist
    for (const [tableName, createSQL] of Object.entries(TABLES)) {
      try {
        await connection.execute(createSQL);
        console.log(`Table ${tableName} created successfully`);
      } catch (error: any) {
        if (error.errorNum === 955) { // Table already exists
          console.log(`Table ${tableName} already exists`);
        } else {
          console.error(`Error creating table ${tableName}:`, error);
        }
      }
    }

    // Insert default admin user
    try {
      await connection.execute(`
        INSERT INTO agents (id, username, password, role, permissions_dashboard, permissions_agents, permissions_contacts, permissions_analytics, permissions_settings)
        VALUES ('admin_001', 'admin', 'admin', 'admin', 1, 1, 1, 1, 1)
      `);
      await connection.commit();
      console.log('Default admin user created');
    } catch (error: any) {
      if (error.errorNum === 1) { // Unique constraint violation
        console.log('Default admin user already exists');
      } else {
        console.error('Error creating default admin user:', error);
      }
    }

  } finally {
    await connection.close();
  }
}

// Helper function to convert Oracle results to plain objects
export function oracleResultToPlain(result: any): any {
  if (Array.isArray(result)) {
    return result.map(row => oracleResultToPlain(row));
  }
  
  if (result && typeof result === 'object') {
    const plain: any = {};
    for (const [key, value] of Object.entries(result)) {
      if (value && typeof value === 'object' && 'getTime' in value) {
        // Oracle Date/Timestamp objects
        plain[key] = (value as Date).toISOString();
      } else {
        plain[key] = value;
      }
    }
    return plain;
  }
  
  return result;
}
