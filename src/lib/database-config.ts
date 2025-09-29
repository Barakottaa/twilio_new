// Database configuration
export const DATABASE_CONFIG = {
  // Set to 'sqlite' for SQLite database, 'oracle' for Oracle database, 'memory' for in-memory database
  type: process.env.DATABASE_TYPE || 'sqlite',
  
  // SQLite configuration
  sqlite: {
    dbPath: process.env.SQLITE_DB_PATH || './database.sqlite'
  },
  
  // Oracle configuration
  oracle: {
    user: process.env.ORACLE_USER || 'crm',
    password: process.env.ORACLE_PASSWORD || 'crm',
    connectString: process.env.ORACLE_CONNECT_STRING || 'localhost:1521/ldm',
    poolMin: parseInt(process.env.ORACLE_POOL_MIN || '2'),
    poolMax: parseInt(process.env.ORACLE_POOL_MAX || '10'),
    poolIncrement: parseInt(process.env.ORACLE_POOL_INCREMENT || '1'),
    poolTimeout: parseInt(process.env.ORACLE_POOL_TIMEOUT || '60'),
    stmtCacheSize: parseInt(process.env.ORACLE_STMT_CACHE_SIZE || '30')
  }
};

// Database factory function
export async function getDatabase() {
  if (DATABASE_CONFIG.type === 'sqlite') {
    const { sqliteDb } = await import('./sqlite-database');
    return sqliteDb;
  } else if (DATABASE_CONFIG.type === 'oracle') {
    const { oracleDb } = await import('./oracle-db-service');
    return oracleDb;
  } else {
    const { db } = await import('./database');
    return db;
  }
}
