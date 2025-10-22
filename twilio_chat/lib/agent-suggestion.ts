// Simple agent suggestion service without AI dependencies

export interface SuggestAgentReassignmentInput {
  chatHistory: string;
  availableAgents: string[];
}

export interface SuggestAgentReassignmentOutput {
  suggestedAgent: string;
  reason: string;
}

export async function suggestAgentReassignment(
  input: SuggestAgentReassignmentInput
): Promise<SuggestAgentReassignmentOutput> {
  // Simple fallback implementation without AI
  // Just return the first available agent
  const suggestedAgent = input.availableAgents[0] || 'No agents available';
  
  return {
    suggestedAgent,
    reason: `Selected ${suggestedAgent} as the first available agent. AI functionality is temporarily disabled.`
  };
}
