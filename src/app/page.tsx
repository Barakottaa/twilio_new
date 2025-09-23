import { ChatLayout } from "@/components/chat/chat-layout";
import { chats as mockChats, availableAgents as mockAgents } from "@/lib/mock-data";

export default function Home() {
  const loggedInAgent = mockAgents[0];

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-4">
      <ChatLayout
        chats={mockChats}
        agents={mockAgents}
        loggedInAgent={loggedInAgent}
      />
    </div>
  );
}
