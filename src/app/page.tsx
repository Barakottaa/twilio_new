import { ChatLayout } from "@/components/chat/chat-layout";
import { availableAgents as mockAgents } from "@/lib/mock-data";
import { getTwilioConversations } from "@/lib/twilio-service";
import type { Agent } from "@/types";

export default async function Home() {
  // We'll keep mockAgents for the agent list, but fetch conversations from Twilio.
  const loggedInAgent: Agent = mockAgents[0];

  const chats = await getTwilioConversations(loggedInAgent.id);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-4">
      <ChatLayout
        chats={chats}
        agents={mockAgents}
        loggedInAgent={loggedInAgent}
      />
    </div>
  );
}
