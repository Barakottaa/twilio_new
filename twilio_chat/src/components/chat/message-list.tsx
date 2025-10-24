'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/types';
import { MessageBubble } from './message-bubble';

interface MessageListProps {
  messages: Message[];
  agentAvatar: string;
  customerAvatar: string;
}

export function MessageList({ messages, agentAvatar, customerAvatar }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          avatarUrl={message.sender === 'agent' ? agentAvatar : customerAvatar}
          showAvatar={
            index === 0 || messages[index - 1].sender !== message.sender
          }
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
