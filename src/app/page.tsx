import { ChatLayout } from "@/components/chat/chat-layout";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { availableAgents as mockAgents, chats as mockChats } from "@/lib/mock-data";
import { getTwilioConversations } from "@/lib/twilio-service";
import { initializeConversations } from "@/lib/conversation-service";
import { assertSerializable } from "@/lib/assertSerializable";
import { toPlain } from "@/lib/toPlain";
import type { Agent } from "@/types";

export default async function Home() {
  // Initialize conversation service with mock data
  await initializeConversations(mockChats);
  
  // Ensure agents are serializable
  const serializedAgents = toPlain(mockAgents.map(agent => ({
    id: String(agent.id),
    name: String(agent.name),
    avatar: String(agent.avatar),
    email: agent.email ? String(agent.email) : undefined,
    status: String(agent.status),
    maxConcurrentChats: Number(agent.maxConcurrentChats),
    currentChats: Number(agent.currentChats),
    skills: agent.skills ? agent.skills.map(String) : undefined,
    department: agent.department ? String(agent.department) : undefined,
    lastActive: agent.lastActive ? String(agent.lastActive) : undefined,
  })));
  
  const loggedInAgent: Agent = serializedAgents[0];
  let chats = [];
  
  try {
    console.log("Attempting to fetch Twilio conversations...");
    chats = await getTwilioConversations(loggedInAgent.id);
    console.log("Successfully fetched chats:", chats.length);
    // Ensure all data is plain objects
    chats = toPlain(chats);
  } catch (e: any) {
    console.error("Twilio fetch failed:", e);
    // Fallback to mock chats instead of empty array
    chats = toPlain(mockChats);
    console.log("Using mock chats as fallback");
  }

  // Prepare props for client component
  const props = {
    chats,
    agents: serializedAgents,
    loggedInAgent
  };

  // Development-only serialization guard
  if (process.env.NODE_ENV !== 'production') {
    try {
      assertSerializable(props, 'ChatLayout.props');
      console.log('✅ All props are serializable');
    } catch (error) {
      console.error('❌ Serialization error:', error);
      throw error;
    }
  }

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center p-4">
      <ChatLayout
        chats={chats}
        agents={serializedAgents}
        loggedInAgent={loggedInAgent}
      />
      <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
    </main>
  );
}
