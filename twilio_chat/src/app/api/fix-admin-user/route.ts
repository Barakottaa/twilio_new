import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function POST() {
  try {
    const db = await getDatabase();
    await db.initialize();
    
    // Find the existing admin user
    const adminUser = await db.findAgentByUsername('admin');
    
    if (!adminUser) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found'
      }, { status: 404 });
    }
    
    // Update the admin user with correct password and permissions
    const updatedAdmin = await db.updateAgent(adminUser.id, {
      password: 'admin', // Reset password to 'admin'
      permissions_dashboard: 1,
      permissions_agents: 1,
      permissions_contacts: 1,
      permissions_analytics: 1,
      permissions_settings: 1
    });
    
    if (!updatedAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update admin user'
      }, { status: 500 });
    }
    
    // Test authentication
    const authTest = await db.authenticateAgent('admin', 'admin');
    
    return NextResponse.json({
      success: true,
      message: 'Admin user fixed successfully',
      adminUser: {
        id: updatedAdmin.id,
        username: updatedAdmin.username,
        role: updatedAdmin.role,
        permissions: {
          dashboard: updatedAdmin.permissions_dashboard === 1,
          agents: updatedAdmin.permissions_agents === 1,
          contacts: updatedAdmin.permissions_contacts === 1,
          analytics: updatedAdmin.permissions_analytics === 1,
          settings: updatedAdmin.permissions_settings === 1
        }
      },
      authTest: !!authTest
    });
  } catch (error) {
    console.error('Fix admin user error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
