'use client';

import { useState, useEffect, memo } from 'react';
import type { Agent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentStatus } from '@/components/ui/agent-status';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Edit, Trash2, Users, Clock, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    email: '',
    department: '',
    maxConcurrentChats: 5,
    skills: [] as string[],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async () => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent),
      });

      if (response.ok) {
        const createdAgent = await response.json();
        setAgents([...agents, createdAgent]);
        setNewAgent({ name: '', email: '', department: '', maxConcurrentChats: 5, skills: [] });
        setIsCreating(false);
        toast({
          title: "Agent Created",
          description: `${createdAgent.name} has been added to the team.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create agent.",
        variant: "destructive",
      });
    }
  };

  const updateAgentStatus = async (agentId: string, status: Agent['status']) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedAgent = await response.json();
        setAgents(agents.map(agent => agent.id === agentId ? updatedAgent : agent));
        toast({
          title: "Status Updated",
          description: `${updatedAgent.name}'s status has been updated.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update agent status.",
        variant: "destructive",
      });
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAgents(agents.filter(agent => agent.id !== agentId));
        toast({
          title: "Agent Deleted",
          description: "Agent has been removed from the team.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agent.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading agents...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Agent Management</h1>
          <p className="text-muted-foreground">Manage your support team and agent assignments</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Agent
        </Button>
      </div>

      {/* Create Agent Form */}
      {isCreating && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="Agent name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                  placeholder="agent@company.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={newAgent.department} onValueChange={(value) => setNewAgent({ ...newAgent, department: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer Success">Customer Success</SelectItem>
                    <SelectItem value="Technical Support">Technical Support</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maxChats">Max Concurrent Chats</Label>
                <Input
                  id="maxChats"
                  type="number"
                  min="1"
                  max="10"
                  value={newAgent.maxConcurrentChats}
                  onChange={(e) => setNewAgent({ ...newAgent, maxConcurrentChats: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createAgent}>Create Agent</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={agent.avatar} alt={agent.name} />
                    <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{agent.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateAgentStatus(agent.id, agent.status === 'online' ? 'offline' : 'online')}
                  >
                    <AgentStatus status={agent.status} showLabel />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{agent.currentChats}/{agent.maxConcurrentChats} chats</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last active: {new Date(agent.lastActive || '').toLocaleDateString()}</span>
              </div>

              {agent.skills && agent.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {agent.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateAgentStatus(agent.id, 'busy')}
                  disabled={agent.status === 'busy'}
                >
                  <Activity className="h-3 w-3 mr-1" />
                  Set Busy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteAgent(agent.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No agents found</h3>
          <p className="text-muted-foreground mb-4">Get started by adding your first agent to the team.</p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Agent
          </Button>
        </div>
      )}
    </div>
  );
}
