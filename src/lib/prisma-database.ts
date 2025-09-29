import { PrismaClient } from '@prisma/client';
import type { Agent, Contact } from '@/types';

// Prisma client instance
const prisma = new PrismaClient();

export class PrismaDatabaseService {
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
  }): Promise<Agent> {
    const agent = await prisma.agent.create({
      data: {
        username: data.username,
        password: data.password,
        role: data.role,
        permissions_dashboard: data.permissions_dashboard || 0,
        permissions_agents: data.permissions_agents || 0,
        permissions_contacts: data.permissions_contacts || 0,
        permissions_analytics: data.permissions_analytics || 0,
        permissions_settings: data.permissions_settings || 0,
      }
    });

    return this.mapAgentToType(agent);
  }

  async getAgent(id: string): Promise<Agent | null> {
    const agent = await prisma.agent.findUnique({
      where: { id }
    });

    return agent ? this.mapAgentToType(agent) : null;
  }

  async getAllAgents(): Promise<Agent[]> {
    const agents = await prisma.agent.findMany({
      where: { is_active: 1 }
    });

    return agents.map(agent => this.mapAgentToType(agent));
  }

  async updateAgent(id: string, data: Partial<{
    username: string;
    password: string;
    role: 'admin' | 'agent';
    permissions_dashboard: number;
    permissions_agents: number;
    permissions_contacts: number;
    permissions_analytics: number;
    permissions_settings: number;
    is_active: number;
  }>): Promise<Agent | null> {
    const agent = await prisma.agent.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date()
      }
    });

    return this.mapAgentToType(agent);
  }

  async deleteAgent(id: string): Promise<boolean> {
    const result = await prisma.agent.update({
      where: { id },
      data: { 
        is_active: 0,
        updated_at: new Date()
      }
    });

    return result.is_active === 0;
  }

  async findAgentByUsername(username: string): Promise<Agent | null> {
    const agent = await prisma.agent.findUnique({
      where: { username }
    });

    return agent ? this.mapAgentToType(agent) : null;
  }

  async authenticateAgent(username: string, password: string): Promise<Agent | null> {
    const agent = await prisma.agent.findFirst({
      where: {
        username,
        password,
        is_active: 1
      }
    });

    return agent ? this.mapAgentToType(agent) : null;
  }

  // Contact operations
  async createContact(data: {
    name: string;
    phone_number?: string;
    email?: string;
    avatar?: string;
    last_seen?: Date;
    notes?: string;
    tags?: string;
  }): Promise<Contact> {
    const contact = await prisma.contact.create({
      data: {
        name: data.name,
        phone_number: data.phone_number,
        email: data.email,
        avatar: data.avatar,
        last_seen: data.last_seen,
        notes: data.notes,
        tags: data.tags,
      }
    });

    return this.mapContactToType(contact);
  }

  async getContact(id: string): Promise<Contact | null> {
    const contact = await prisma.contact.findUnique({
      where: { id }
    });

    return contact ? this.mapContactToType(contact) : null;
  }

  async getAllContacts(): Promise<Contact[]> {
    const contacts = await prisma.contact.findMany({
      where: { is_active: 1 }
    });

    return contacts.map(contact => this.mapContactToType(contact));
  }

  async updateContact(id: string, data: Partial<{
    name: string;
    phone_number: string;
    email: string;
    avatar: string;
    last_seen: Date;
    notes: string;
    tags: string;
    is_active: number;
  }>): Promise<Contact | null> {
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date()
      }
    });

    return this.mapContactToType(contact);
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await prisma.contact.update({
      where: { id },
      data: { 
        is_active: 0,
        updated_at: new Date()
      }
    });

    return result.is_active === 0;
  }

  async findContactByPhone(phoneNumber: string): Promise<Contact | null> {
    const contact = await prisma.contact.findFirst({
      where: { 
        phone_number: phoneNumber,
        is_active: 1
      }
    });

    return contact ? this.mapContactToType(contact) : null;
  }

  async findContactByEmail(email: string): Promise<Contact | null> {
    const contact = await prisma.contact.findFirst({
      where: { 
        email,
        is_active: 1
      }
    });

    return contact ? this.mapContactToType(contact) : null;
  }

  // Helper methods to map Prisma models to your types
  private mapAgentToType(agent: any): Agent {
    return {
      id: agent.id,
      username: agent.username,
      role: agent.role,
      permissions: {
        dashboard: agent.permissions_dashboard === 1,
        agents: agent.permissions_agents === 1,
        contacts: agent.permissions_contacts === 1,
        analytics: agent.permissions_analytics === 1,
        settings: agent.permissions_settings === 1
      }
    };
  }

  private mapContactToType(contact: any): Contact {
    return {
      id: contact.id,
      name: contact.name,
      phoneNumber: contact.phone_number,
      email: contact.email,
      avatar: contact.avatar,
      lastSeen: contact.last_seen,
      notes: contact.notes,
      tags: contact.tags ? contact.tags.split(',') : []
    };
  }

  // Initialize database (create tables if they don't exist)
  async initialize(): Promise<void> {
    // Prisma handles table creation automatically
    // Just ensure the client is connected
    await prisma.$connect();
  }

  // Close database connection
  async close(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Export singleton instance
export const prismaDb = new PrismaDatabaseService();
