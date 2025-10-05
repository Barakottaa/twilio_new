/**
 * Database helper for better-sqlite3
 * This provides a simple API that works with better-sqlite3 (ARM-compatible)
 * while maintaining async/await interface for compatibility
 */

import Database from 'better-sqlite3';

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database('./database.sqlite');
  }
  return dbInstance;
}

export async function run(sql: string, params: any[] = []): Promise<Database.RunResult> {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

export async function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

export async function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

