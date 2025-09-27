'use client';
import { useState } from 'react';
import type { Agent, Chat } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical, Users } from 'lucide-react';
import { ReassignAgentDialog } from './reassign-agent-dialog';
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
  const customerName = chat.customer?.name || "Anonymous";

  return (
    <>
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={chat.customer?.avatar} alt={customerName} data-ai-hint="person face"/>
            <AvatarFallback>{customerName.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{customerName}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Assigned to: {chat.agent.name}</p>
              <ConnectionStatus />
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
              <DropdownMenuItem>View contact</DropdownMenuItem>
              <DropdownMenuItem>Clear chat</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">Block contact</DropdownMenuItem>
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
    </>
  );
}
