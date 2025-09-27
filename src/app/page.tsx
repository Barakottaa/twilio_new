import { ChatLayout } from "@/components/chat/chat-layout";
import { availableAgents as mockAgents } from "@/lib/mock-data";
import { getTwilioConversations } from "@/lib/twilio-service";
import { assertSerializable } from "@/lib/assertSerializable";
import { toPlain } from "@/lib/toPlain";
import type { Agent } from "@/types";

export default async function Home() {
  // Ensure agents are serializable
  const serializedAgents = toPlain(mockAgents.map(agent => ({
    id: String(agent.id),
    name: String(agent.name),
    avatar: String(agent.avatar),
  })));
  
  const loggedInAgent: Agent = serializedAgents[0];
  let chats = [];
  let error: string | null = null;
  
  try {
    console.log("Attempting to fetch Twilio conversations...");
    chats = await getTwilioConversations(loggedInAgent.id);
    console.log("Successfully fetched chats:", chats.length);
    // Ensure all data is plain objects
    chats = toPlain(chats);
  } catch (e: any) {
    console.error("Twilio fetch failed:", e);
    // Fallback to empty chats array instead of showing error
    chats = [];
    console.log("Using empty chats array as fallback");
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
    </main>
  );
}
