'use client';

import { useEffect, useState } from 'react';
import type { Agent, Chat } from '@/types';
import { suggestAgentReassignment, SuggestAgentReassignmentOutput } from '@/lib/agent-suggestion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Lightbulb } from 'lucide-react';

interface ReassignAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat;
  agents: Agent[];
  onReassign: (newAgentId: string) => void;
}

const FormSchema = z.object({
  agentId: z.string().min(1, 'Please select an agent.'),
});

export function ReassignAgentDialog({ open, onOpenChange, chat, agents, onReassign }: ReassignAgentDialogProps) {
  const [suggestion, setSuggestion] = useState<SuggestAgentReassignmentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      agentId: chat.agent.id,
    }
  });

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setError(null);
      setSuggestion(null);
      form.reset({ agentId: chat.agent.id });

      const chatHistory = chat.messages
        .map(msg => `${msg.sender === 'agent' ? chat.agent.name : chat.customer.name}: ${msg.text}`)
        .join('\n');
      
      const availableAgents = agents.map(a => a.name);

      suggestAgentReassignment({ chatHistory, availableAgents })
        .then((res) => {
          setSuggestion(res);
          const suggestedAgent = agents.find(a => a.name === res.suggestedAgent);
          if (suggestedAgent) {
            form.setValue('agentId', suggestedAgent.id);
          }
        })
        .catch(() => setError('Failed to get AI suggestion. Please select an agent manually.'))
        .finally(() => setIsLoading(false));
    }
  }, [open, chat, agents, form]);
  
  function onSubmit(data: z.infer<typeof FormSchema>) {
    onReassign(data.agentId);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reassign Agent</DialogTitle>
          <DialogDescription>
            Assign this conversation to a different agent. Current agent: {chat.agent.name}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && (
          <div className="space-y-4 my-4">
            <p className="text-sm text-muted-foreground">Getting AI suggestion...</p>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        {!isLoading && suggestion && (
            <Alert className="my-4">
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>AI Suggestion</AlertTitle>
                <AlertDescription>
                    <p>Reassign to <strong>{suggestion.suggestedAgent}</strong>. {suggestion.reason}</p>
                </AlertDescription>
            </Alert>
        )}

        {!isLoading && error && (
            <Alert variant="destructive" className="my-4">
                <AlertTitle>Suggestion Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {!isLoading && (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                control={form.control}
                name="agentId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Available Agents</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an agent to assign" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit">Reassign</Button>
                </DialogFooter>
            </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
