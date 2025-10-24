'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  agent_name: string;
  created_at: string;
  updated_at: string;
}

interface CommentSectionProps {
  conversationId: string;
  onOpenModal: () => void;
  refreshTrigger?: number; // Add refresh trigger
}

export function CommentSection({ conversationId, onOpenModal, refreshTrigger }: CommentSectionProps) {
  const [latestComment, setLatestComment] = useState<Comment | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLatestComment();
  }, [conversationId, refreshTrigger]);

  const loadLatestComment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/comments`);
      if (response.ok) {
        const data = await response.json();
        const comments = data.comments || [];
        setCommentCount(comments.length);
        setLatestComment(comments.length > 0 ? comments[0] : null);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span>Loading comments...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-muted-foreground">Comments</span>
      
      {latestComment ? (
        <div className="flex items-center gap-2 max-w-xs">
          <div className="flex-1 min-w-0 border border-border rounded px-2 py-1 bg-muted/30">
            <p className="text-xs text-foreground truncate">
              {truncateText(latestComment.content)}
            </p>
          </div>
          {commentCount > 1 && (
            <Badge variant="outline" className="text-xs">
              +{commentCount - 1}
            </Badge>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">No comments</span>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenModal}
        className="h-6 w-6 p-0 hover:bg-muted"
      >
        <Edit className="h-3 w-3" />
      </Button>
    </div>
  );
}
