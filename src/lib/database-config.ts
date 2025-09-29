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
export async function getDatabase() {
  if (DATABASE_CONFIG.type === 'sqlite') {
    const { sqliteDb } = await import('./sqlite-database');
    return sqliteDb;
  } else {
    const { db } = await import('./database');
    return db;
  }
}
