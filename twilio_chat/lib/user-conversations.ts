/**
 * User Conversations Service
 * Fetches conversations for a specific User by identity
 * Based on: https://www.twilio.com/docs/conversations/api/user-conversation-resource
 */

import { getTwilioClient } from './twilio-service';

/**
 * Get all conversations for a specific User (by identity)
 * @param userIdentity - The User identity string (e.g., "admin_001", "agent-123")
 * @param limit - Maximum number of conversations to return
 * @returns Array of conversation SIDs
 */
export async function getUserConversations(userIdentity: string, limit: number = 50): Promise<string[]> {
  try {
    console.log('📋 Fetching conversations for user:', userIdentity);
    
    const twilioClient = await getTwilioClient();
    
    // Fetch conversations for this user
    // Note: This requires the user to exist in Twilio Conversations
    // Format: GET /v1/Users/{Identity}/Conversations
    const userConversations = await twilioClient.conversations.v1
      .users(userIdentity)
      .userConversations
      .list({ limit });
    
    const conversationSids = userConversations.map(uc => uc.conversationSid);
    
    console.log(`✅ Found ${conversationSids.length} conversations for user ${userIdentity}`);
    
    return conversationSids;
    
  } catch (error) {
    console.error('❌ Error fetching user conversations:', error);
    
    // If user doesn't exist, return empty array
    if (error instanceof Error && error.message.includes('User not found')) {
      console.warn(`⚠️ User ${userIdentity} not found in Twilio Conversations`);
      return [];
    }
    
    throw error;
  }
}

/**
 * Check if a User exists in Twilio Conversations
 * @param userIdentity - The User identity string
 * @returns User object if exists, null otherwise
 */
export async function getUser(userIdentity: string) {
  try {
    const twilioClient = await getTwilioClient();
    
    // Fetch user by identity
    // Format: GET /v1/Users/{Identity}
    const user = await twilioClient.conversations.v1.users(userIdentity).fetch();
    
    return user;
  } catch (error) {
    if (error instanceof Error && error.message.includes('User not found')) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a User in Twilio Conversations
 * @param userIdentity - Unique identity string for the user
 * @param friendlyName - Display name for the user
 * @param attributes - Optional JSON attributes
 * @param roleSid - Optional role SID
 * @returns Created User object
 */
export async function createUser(
  userIdentity: string, 
  friendlyName?: string, 
  attributes?: Record<string, any>,
  roleSid?: string
) {
  try {
    const twilioClient = await getTwilioClient();
    
    const user = await twilioClient.conversations.v1.users.create({
      identity: userIdentity,
      friendlyName,
      attributes: attributes ? JSON.stringify(attributes) : undefined,
      roleSid
    });
    
    console.log(`✅ Created user: ${userIdentity}`);
    return user;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
}

/**
 * Get or create a User (useful for ensuring users exist)
 * @param userIdentity - The User identity string
 * @param friendlyName - Display name for the user
 * @returns User object
 */
export async function getOrCreateUser(userIdentity: string, friendlyName?: string) {
  let user = await getUser(userIdentity);
  
  if (!user) {
    console.log(`📝 User ${userIdentity} doesn't exist, creating...`);
    user = await createUser(userIdentity, friendlyName);
  }
  
  return user;
}

