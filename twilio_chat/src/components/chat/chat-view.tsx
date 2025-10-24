import type { Agent, Chat } from '@/types';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { ChatPlaceholder } from './chat-placeholder';

interface ChatViewProps {
  chat: Chat | null;
  agents: Agent[];
  loggedInAgent: Agent;
  onSendMessage: (chatId: string, text: string) => void;
  onReassignAgent: (chatId: string, newAgentId: string) => void;
  onUpdateChat: (updatedChat: Chat) => void;
}

export function ChatView({ chat, agents, loggedInAgent, onSendMessage, onReassignAgent, onUpdateChat }: ChatViewProps) {
  if (!chat) {
    return <ChatPlaceholder />;
  }

  const handleSendMessage = (text: string) => {
    onSendMessage(chat.id, text);
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/30">
      <ChatHeader 
        chat={chat} 
        agents={agents} 
        onReassignAgent={(newAgentId) => onReassignAgent(chat.id, newAgentId)}
        onUpdateChat={onUpdateChat}
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <MessageList messages={chat.messages} agentAvatar={chat.agent.avatar} customerAvatar={chat.customer.avatar} />
      </div>
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}
