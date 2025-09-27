'use client';
import { useState } from 'react';
import type { Agent, Chat } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical, Users, Phone, Mail, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ReassignAgentDialog } from './reassign-agent-dialog';
import { ContactDialog } from './contact-dialog';
import { ConnectionStatus } from '@/components/connection-status';
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
}

export function ChatHeader({ chat, agents, onReassignAgent }: ChatHeaderProps) {
  const [isReassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [isContactDialogOpen, setContactDialogOpen] = useState(false);
  const customerName = chat.customer?.name || "Anonymous";

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

  return (
    <>
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={chat.customer?.avatar} alt={customerName} data-ai-hint="person face"/>
            <AvatarFallback>{customerName.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{customerName}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Assigned to: {chat.agent.name}</span>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewContact}>View contact</DropdownMenuItem>
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
    </>
  );
}
