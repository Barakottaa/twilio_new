import { ChatLayout } from "@/components/chat/chat-layout";
import { MainLayout } from "@/components/layout/main-layout";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { availableAgents as mockAgents, chats as mockChats } from "@/lib/mock-data";
import { getTwilioConversations } from "@/lib/twilio-service";
import { initializeConversations } from "@/lib/conversation-service";
import { assertSerializable } from "@/lib/assertSerializable";
import { toPlain } from "@/lib/toPlain";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Agent } from "@/types";

export default async function Home() {
  // Check authentication
  const session = await getSession();
  if (!session || !session.isAuthenticated) {
    redirect('/login');
  }
  const loggedInAgent = session.agent;
  
  // Initialize conversation service with mock data
  await initializeConversations(mockChats);
  
  // For now, use mock agents for the chat interface
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
    <MainLayout loggedInAgent={loggedInAgent}>
      <div className="h-full">
        <ChatLayout
          chats={chats}
          agents={serializedAgents as Agent[]}
          loggedInAgent={loggedInAgent}
        />
        <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
      </div>
    </MainLayout>
  );
}
