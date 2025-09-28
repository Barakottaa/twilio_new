'use client';
import { useState } from 'react';
import type { Agent, Chat } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical, Users, Phone, Mail, Clock, Settings, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ReassignAgentDialog } from './reassign-agent-dialog';
import { ContactDialog } from './contact-dialog';
import { ConversationManagementDialog } from './conversation-management-dialog';
import { ConnectionStatus } from '@/components/connection-status';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { AgentStatus } from '@/components/ui/agent-status';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatHeaderProps {
      chat: Chat;
      agents: Agent[];
      onReassignAgent: (newAgentId: string) => void;
      onUpdateChat: (updatedChat: Chat) => void;
    }

// Helper function to get initials from any name format
function getInitials(name: string): string {
  console.log('🔤 Getting initials for name:', name);
  
  if (!name || name === "Anonymous") {
    console.log('🔤 Returning AN for anonymous/empty name');
    return "AN";
  }
  
  // If it's a phone number format like "+20 15 5700 0970", extract numbers
  if (name.match(/^\+\d/)) {
    const numbers = name.replace(/\D/g, ''); // Remove all non-digits
    const result = numbers.slice(-2); // Take last 2 digits
    console.log('🔤 Phone number detected, returning:', result);
    return result;
  }
  
  // For regular names, take first 2 characters
  const result = name.substring(0, 2).toUpperCase();
  console.log('🔤 Regular name detected, returning:', result);
  return result;
}

    export function ChatHeader({ chat, agents, onReassignAgent, onUpdateChat }: ChatHeaderProps) {
      const [isReassignDialogOpen, setReassignDialogOpen] = useState(false);
      const [isContactDialogOpen, setContactDialogOpen] = useState(false);
      const [isManagementDialogOpen, setManagementDialogOpen] = useState(false);
      const customerName = chat.customer?.name || "Anonymous";
  
  console.log('👤 ChatHeader - customerName:', customerName);
  console.log('👤 ChatHeader - chat.customer:', chat.customer);

  const handleViewContact = () => {
    setContactDialogOpen(true);
  };

  const handleClearChat = () => {
    // TODO: Implement clear chat functionality
    console.log('Clear chat for:', chat.id);
  };

      const handleBlockContact = () => {
        // TODO: Implement block contact functionality
        console.log('Block contact:', chat.customer.id);
      };

      const handleManageConversation = () => {
        setManagementDialogOpen(true);
      };

  return (
    <>
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {/* Temporarily disabled avatar image to force fallback */}
              {/* <AvatarImage src={chat.customer?.avatar} alt={customerName} data-ai-hint="person face"/> */}
              <AvatarFallback>{getInitials(customerName)}</AvatarFallback>
            </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold">{customerName}</p>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={chat.status} />
                    <PriorityBadge priority={chat.priority} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Assigned to: {chat.agent.name}</span>
                  <AgentStatus status={chat.agent.status} />
                  <ConnectionStatus />
                </div>
            {/* Contact Information */}
            <div className="flex items-center gap-3 mt-1">
              {chat.customer.phoneNumber && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span className="text-xs">{chat.customer.phoneNumber}</span>
                </div>
              )}
              {chat.customer.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="text-xs">{chat.customer.email}</span>
                </div>
              )}
              {chat.customer.lastSeen && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">Last seen: {formatDistanceToNow(new Date(chat.customer.lastSeen), { addSuffix: true })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setReassignDialogOpen(true)}>
                 <Users className="h-5 w-5" />
                 <span className="sr-only">Reassign Agent</span>
               </Button>
               <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={handleManageConversation}>
                 <Settings className="h-5 w-5" />
                 <span className="sr-only">Manage Conversation</span>
               </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleViewContact}>View contact</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleManageConversation}>
                    <Settings className="mr-2 h-4 w-4" />
                    Manage conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleClearChat}>Clear chat</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBlockContact} className="text-destructive focus:text-destructive">Block contact</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
      </div>
      <ReassignAgentDialog
        open={isReassignDialogOpen}
        onOpenChange={setReassignDialogOpen}
        chat={chat}
        agents={agents}
        onReassign={onReassignAgent}
      />
          <ContactDialog
            open={isContactDialogOpen}
            onOpenChange={setContactDialogOpen}
            chat={chat}
          />
          <ConversationManagementDialog
            open={isManagementDialogOpen}
            onOpenChange={setManagementDialogOpen}
            chat={chat}
            agents={agents}
            onUpdate={onUpdateChat}
          />
        </>
      );
    }
