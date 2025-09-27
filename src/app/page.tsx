import { ChatLayout } from "@/components/chat/chat-layout";
import { availableAgents as mockAgents } from "@/lib/mock-data";
import { getTwilioConversations } from "@/lib/twilio-service";
import type { Agent } from "@/types";

// Simple debug helper
function typeInfo(x: any) {
  if (x == null) return String(x);
  return { type: typeof x, ctor: x?.constructor?.name };
}

export default async function Home() {
  // Ensure agents are serializable
  const serializedAgents = JSON.parse(JSON.stringify(mockAgents.map(agent => ({
    id: String(agent.id),
    name: String(agent.name),
    avatar: String(agent.avatar),
  }))));
  
  const loggedInAgent: Agent = serializedAgents[0];
  let chats = [];
  let error: string | null = null;
  
  try {
    console.log("Attempting to fetch Twilio conversations...");
    chats = await getTwilioConversations(loggedInAgent.id);
    console.log("Successfully fetched chats:", chats.length);
    // Double-check serialization
    chats = JSON.parse(JSON.stringify(chats));
  } catch (e: any) {
    console.error("Twilio fetch failed:", e);
    // Fallback to empty chats array instead of showing error
    chats = [];
    console.log("Using empty chats array as fallback");
  }

  // Simple debug: Check what we're passing to the client component
  console.log('Props being passed to ChatLayout:', {
    chats: typeInfo(chats),
    agents: typeInfo(serializedAgents),
    loggedInAgent: typeInfo(loggedInAgent)
  });

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
