"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { useCommunityStore } from '@/store/communityStore';
import { Post } from '@/lib/validators/community';
import { timeAgo } from '@/lib/timeAgo';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, ThumbsUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const PostDrawer = () => {
  const { selectedPostId, posts, comments, selectPost, addComment } = useCommunityStore(state => ({
    selectedPostId: state.selectedPostId,
    posts: state.posts,
    comments: state.comments,
    selectPost: state.selectPost,
    addComment: state.addComment,
  }));

  const [newComment, setNewComment] = useState('');
  const post = posts.find(p => p.id === selectedPostId);
  const postComments = post ? comments[post.id] || [] : [];

  const handleCommentSubmit = () => {
    if (newComment.trim() && post) {
      addComment(post.id, newComment, 'current_user'); // Replace 'current_user' with actual user
      setNewComment('');
    }
  };

  if (!post) return null;

  return (
    <Sheet open={!!selectedPostId} onOpenChange={(open) => !open && selectPost(null)}>
      <SheetContent className="w-full sm:w-[540px] flex flex-col p-0" side="right">
        <ScrollArea className="flex-1">
          <SheetHeader className="p-6 pb-2 text-left">
            <SheetTitle className="text-2xl">{post.title}</SheetTitle>
            <SheetDescription className="flex items-center gap-2 text-sm">
              Posted by {post.author} <span>&bull;</span> {timeAgo(post.createdAt)}
            </SheetDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
          </SheetHeader>
          <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
            <p>{post.content}</p>
            {post.stepsToReproduce && (
              <>
                <h4 className="font-semibold mt-4">Steps to Reproduce:</h4>
                <pre className="bg-muted p-3 rounded-md whitespace-pre-wrap font-sans text-sm">{post.stepsToReproduce}</pre>
              </>
            )}
          </div>
          <div className="p-6 border-t border-border">
            <h4 className="font-semibold mb-4">{postComments.length} Comments</h4>
            <div className="space-y-4">
              {postComments.map(comment => (
                <div key={comment.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{comment.author}</span>
                    <span>&bull;</span>
                    <span>{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="p-4 border-t border-border bg-card">
          <div className="flex items-start gap-2 w-full">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="flex-1"
              rows={1}
            />
            <Button size="icon" onClick={handleCommentSubmit} disabled={!newComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default PostDrawer;
