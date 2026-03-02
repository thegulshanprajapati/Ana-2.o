"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, ThumbsUp, GitMerge } from 'lucide-react';
import { Post } from '@/lib/validators/community';
import { rooms } from '@/lib/communityMock';
import { Badge } from '@/components/ui/badge';
import { timeAgo } from '@/lib/timeAgo';
import { useCommunityStore } from '@/store/communityStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { UserData } from '@/lib/local-data';

const PostItem = ({ post, authorUser }: { post: Post; authorUser?: UserData }) => {
  const { selectPost, toggleVote, votedPosts } = useCommunityStore(state => ({
    selectPost: state.selectPost,
    toggleVote: state.toggleVote,
    votedPosts: state.votedPosts
  }));
  const room = rooms.find(r => r.slug === post.roomSlug);
  const isVoted = votedPosts.has(post.id);

  return (
    <motion.div
      onClick={() => selectPost(post.id)}
      className="bg-[var(--community-card-bg)] border border-[var(--community-card-border)] rounded-lg p-4 cursor-pointer transition-colors hover:bg-[var(--community-card-hover)] backdrop-blur-sm"
      whileHover={{ y: -2 }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-grow">
          {room && <Badge variant="secondary" className="mb-2">{room.name}</Badge>}
          <h3 className="font-semibold text-lg text-foreground">{post.title}</h3>
          <p className="text-sm text-[color:var(--community-muted)] mt-1 line-clamp-2">{post.content}</p>
          <div className="flex items-center gap-4 text-xs text-[color:var(--community-muted)] mt-3">
            {authorUser ? (
              <Link
                href={`/connect/${authorUser.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-foreground hover:underline"
              >
                {authorUser.displayName || post.author}
              </Link>
            ) : (
              <span>{post.author}</span>
            )}
            <span>&bull;</span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {post.type === 'Feature' && (
            <Button
              variant={isVoted ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleVote(post.id);
              }}
              className={cn(
                "flex items-center gap-2 w-[80px]",
                isVoted && "bg-primary/80 border-primary text-primary-foreground"
              )}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{post.votes}</span>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PostItem;
