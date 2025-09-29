import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

export async function GET() {
  try {
    const db = await getDatabase();
    await db.initialize();
    
    // Test direct SQLite operations to see the result structure
    const directDb = new sqlite3.Database('./database.sqlite');
    const run = promisify(directDb.run.bind(directDb));
    const get = promisify(directDb.get.bind(directDb));
    
    // Test 1: Create a test user
    const createResult = await run(`
      INSERT INTO agents (id, username, password, role, permissions_dashboard, permissions_agents, permissions_contacts, permissions_analytics, permissions_settings, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'test_debug_user',
      'debug_user',
      'debug_password',
      'agent',
      1, 0, 1, 0, 0, 1,
      new Date().toISOString(),
      new Date().toISOString()
    ]);
    
    console.log('Create result:', createResult);
    console.log('Create result type:', typeof createResult);
    console.log('Create result keys:', Object.keys(createResult || {}));
    
    // Test 2: Update the user
    const updateResult = await run(`
      UPDATE agents SET permissions_analytics = 1, updated_at = ? WHERE id = ?
    `, [new Date().toISOString(), 'test_debug_user']);
    
    console.log('Update result:', updateResult);
    console.log('Update result type:', typeof updateResult);
    console.log('Update result keys:', Object.keys(updateResult || {}));
    
    // Test 3: Delete the user
    const deleteResult = await run(`
      UPDATE agents SET is_active = 0, updated_at = ? WHERE id = ?
    `, [new Date().toISOString(), 'test_debug_user']);
    
    console.log('Delete result:', deleteResult);
    console.log('Delete result type:', typeof deleteResult);
    console.log('Delete result keys:', Object.keys(deleteResult || {}));
    
    await new Promise<void>((resolve, reject) => {
      directDb.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    return NextResponse.json({
      success: true,
      results: {
        create: {
          result: createResult,
          type: typeof createResult,
          keys: Object.keys(createResult || {})
        },
        update: {
          result: updateResult,
          type: typeof updateResult,
          keys: Object.keys(updateResult || {})
        },
        delete: {
          result: deleteResult,
          type: typeof deleteResult,
          keys: Object.keys(deleteResult || {})
        }
      }
    });
  } catch (error) {
    console.error('Debug SQLite result error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
