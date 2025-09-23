import { ChatLayout } from "@/components/chat/chat-layout";
import { availableAgents as mockAgents } from "@/lib/mock-data";
import { getTwilioConversations } from "@/lib/twilio-service";
import type { Agent } from "@/types";

export default async function Home() {
  const loggedInAgent: Agent = mockAgents[0];
  let chats = [];
  let error: string | null = null;
  
  try {
    chats = await getTwilioConversations(loggedInAgent.id);
  } catch (e: any) {
    console.error(e);
    error = e.message || "An unexpected error occurred while fetching conversations.";
  }

  if (error) {
    return (
       <div className="flex h-screen w-full flex-col items-center justify-center p-4 bg-background">
        <div className="text-center p-8 border-2 border-dashed rounded-xl border-destructive max-w-lg">
          <h1 className="text-2xl font-bold text-destructive mb-4">Connection Error</h1>
          <p className="text-destructive-foreground mb-4">There was a problem connecting to the Twilio service.</p>
          <pre className="bg-muted text-destructive-foreground/80 p-4 rounded-md text-left text-sm overflow-x-auto">
            <code>{error}</code>
          </pre>
          <p className="text-muted-foreground mt-4 text-sm">
            Please ensure your <code className="font-mono bg-muted p-1 rounded-sm">.env</code> file is correctly configured with your Twilio credentials and restart the application.
          </p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center p-4">
      <ChatLayout
        chats={chats}
        agents={mockAgents}
        loggedInAgent={loggedInAgent}
      />
    </main>
  );
}
