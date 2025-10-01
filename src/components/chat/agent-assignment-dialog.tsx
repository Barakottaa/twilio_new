'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/store/chat-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AgentAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentAgentId?: string;
  onAgentAssigned?: (conversationId: string, agentId: string) => void;
}

interface Agent {
  id: string;
  username: string;
  role: string;
  permissions: any;
}

export function AgentAssignmentDialog({
  open,
  onOpenChange,
  conversationId,
  currentAgentId,
  onAgentAssigned
}: AgentAssignmentDialogProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const { toast } = useToast();
  const { setAssignment } = useChatStore();

  // Fetch agents from database when dialog opens
  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAvailableAgents(data.agents || []);
      } else {
        throw new Error('Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive"
      });
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgentId) {
      toast({
        title: "Error",
        description: "Please select an agent",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update the store optimistically
      const selectedAgent = availableAgents.find(a => a.id === selectedAgentId);
      if (selectedAgent) {
        console.log('🔍 Assigning agent:', { 
          conversationId, 
          selectedAgent, 
          assignment: { id: selectedAgent.id, name: selectedAgent.username } 
        });
        setAssignment(conversationId, { id: selectedAgent.id, name: selectedAgent.username });
      }

      // Call the API to assign the agent
      const response = await fetch(`/api/twilio/conversations/${conversationId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: selectedAgentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to assign agent');
      }

      toast({
        title: "Success",
        description: `Agent assigned successfully`,
      });

      onAgentAssigned?.(conversationId, selectedAgentId);
      onOpenChange(false);
      setSelectedAgentId('');

    } catch (error) {
      console.error('Error assigning agent:', error);
      toast({
        title: "Error",
        description: "Failed to assign agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async () => {
    setIsLoading(true);
    try {
      // Update the store optimistically
      setAssignment(conversationId, null);

      // Call the API to unassign the agent
      const response = await fetch(`/api/twilio/conversations/${conversationId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to unassign agent');
      }

      toast({
        title: "Success",
        description: `Agent unassigned successfully`,
      });

      onAgentAssigned?.(conversationId, '');
      onOpenChange(false);
      setSelectedAgentId('');

    } catch (error) {
      console.error('Error unassigning agent:', error);
      toast({
        title: "Error",
        description: "Failed to unassign agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Agent</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Agent</label>
            {loadingAgents ? (
              <div className="flex items-center justify-center p-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-gray-600">Loading agents...</span>
              </div>
            ) : (
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an agent..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.username} ({agent.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleUnassign}
            disabled={isLoading || !currentAgentId}
          >
            Unassign
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isLoading || !selectedAgentId}
            >
              {isLoading ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
