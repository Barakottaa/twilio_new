'use client';

import { useState } from 'react';
import type { Chat, Agent, ConversationStatus } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Save, User, Tag, MessageSquare } from 'lucide-react';

interface ConversationManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat;
  agents: Agent[];
  onUpdate: (updatedChat: Chat) => void;
}

export function ConversationManagementDialog({
  open,
  onOpenChange,
  chat,
  agents,
  onUpdate,
}: ConversationManagementDialogProps) {
  const [status, setStatus] = useState<ConversationStatus>(chat.status);
  const [priority, setPriority] = useState<Chat['priority']>(chat.priority);
  const [assignedAgent, setAssignedAgent] = useState(chat.agent.id);
  const [notes, setNotes] = useState(chat.notes || '');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(chat.tags || []);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      // Update conversation status
      if (status !== chat.status) {
        const response = await fetch(`/api/conversations/${chat.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, closedBy: status === 'closed' ? 'current-user' : undefined }),
        });
        
        if (!response.ok) throw new Error('Failed to update status');
      }

      // Update priority
      if (priority !== chat.priority) {
        const response = await fetch(`/api/conversations/${chat.id}/priority`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority }),
        });
        
        if (!response.ok) throw new Error('Failed to update priority');
      }

      // Update assignment
      if (assignedAgent !== chat.agent.id) {
        const response = await fetch(`/api/conversations/${chat.id}/assign`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId: assignedAgent }),
        });
        
        if (!response.ok) throw new Error('Failed to assign conversation');
      }

      // Update notes
      if (notes !== (chat.notes || '')) {
        const response = await fetch(`/api/conversations/${chat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        });
        
        if (!response.ok) throw new Error('Failed to update notes');
      }

      // Update tags
      const currentTags = chat.tags || [];
      const tagsToAdd = tags.filter(tag => !currentTags.includes(tag));
      const tagsToRemove = currentTags.filter(tag => !tags.includes(tag));

      if (tagsToAdd.length > 0) {
        const response = await fetch(`/api/conversations/${chat.id}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: tagsToAdd }),
        });
        
        if (!response.ok) throw new Error('Failed to add tags');
      }

      if (tagsToRemove.length > 0) {
        const response = await fetch(`/api/conversations/${chat.id}/tags`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: tagsToRemove }),
        });
        
        if (!response.ok) throw new Error('Failed to remove tags');
      }

      // Update local state
      const updatedChat: Chat = {
        ...chat,
        status,
        priority,
        agent: agents.find(a => a.id === assignedAgent) || chat.agent,
        notes,
        tags,
        updatedAt: new Date().toISOString(),
      };

      onUpdate(updatedChat);
      onOpenChange(false);

      toast({
        title: "Conversation Updated",
        description: "Conversation details have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update conversation.",
        variant: "destructive",
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const selectedAgent = agents.find(a => a.id === assignedAgent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Manage Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Customer</Label>
            <div className="p-3 border rounded-md bg-muted/50">
              <p className="font-medium">{chat.customer.name}</p>
              {chat.customer.phoneNumber && (
                <p className="text-sm text-muted-foreground">{chat.customer.phoneNumber}</p>
              )}
              {chat.customer.email && (
                <p className="text-sm text-muted-foreground">{chat.customer.email}</p>
              )}
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: ConversationStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: Chat['priority']) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Agent Assignment */}
          <div className="space-y-2">
            <Label htmlFor="agent">Assigned Agent</Label>
            <Select value={assignedAgent} onValueChange={setAssignedAgent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <span>{agent.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({agent.status}) - {agent.currentChats}/{agent.maxConcurrentChats}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAgent && (
              <div className="text-sm text-muted-foreground">
                {selectedAgent.department} • {selectedAgent.skills?.join(', ')}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button onClick={handleAddTag} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add internal notes about this conversation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Current Status Display */}
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div className="flex items-center gap-2">
              <StatusBadge status={chat.status} />
              <PriorityBadge priority={chat.priority} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
