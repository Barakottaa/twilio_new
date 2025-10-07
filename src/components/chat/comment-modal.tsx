'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Edit, Trash2, Save, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  agent_name: string;
  created_at: string;
  updated_at: string;
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  agentId: string;
  agentName: string;
  onCommentUpdate?: () => void; // Callback when comments are updated
}

export function CommentModal({ isOpen, onClose, conversationId, agentId, agentName, onCommentUpdate }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load comments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, conversationId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim(), agentId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment('');
        // Trigger refresh of comment section
        onCommentUpdate?.();
      }
    } catch (error) {
      console.error('Error saving comment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(comments.map(c => c.id === commentId ? data.comment : c));
        setEditingComment(null);
        setEditContent('');
        // Trigger refresh of comment section
        onCommentUpdate?.();
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId));
        // Trigger refresh of comment section
        onCommentUpdate?.();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      action();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments for {agentName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* New Comment Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Comment</label>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleSaveComment)}
              placeholder="Type your comment here... (Ctrl+Enter to save)"
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveComment}
                disabled={!newComment.trim() || isSaving}
                size="sm"
              >
                {isSaving ? 'Saving...' : 'Save Comment'}
              </Button>
            </div>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No comments yet</p>
                <p className="text-sm">Add the first comment above</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {comment.agent_name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditComment(comment)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(comment.id))}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingComment(null);
                            setEditContent('');
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={!editContent.trim() || isSaving}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
