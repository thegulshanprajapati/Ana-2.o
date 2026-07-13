"use client";

import { useEffect, useMemo, useState } from 'react';
import { useCommunityStore } from '@/store/communityStore';
import PostItem from './PostItem';
import { PostSkeleton } from './skeletons';
import { MessagesSquare } from 'lucide-react';
import { getAllUsers, type UserData } from '@/lib/local-data';
import { findUserByAuthorHandle } from '@/lib/connect-profile';

const FeedSection = () => {
  const [users, setUsers] = useState<UserData[]>([]);

  const { posts, filter, searchQuery, isLoading } = useCommunityStore(state => ({
    posts: state.posts,
    filter: state.filter,
    searchQuery: state.searchQuery,
    isLoading: state.isLoading
  }));

  useEffect(() => {
    getAllUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  const usersById = useMemo(() => {
    return users.reduce<Record<string, UserData>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }, [users]);

  const filteredPosts = useMemo(() => {
    return posts
      .filter(post => filter === 'all' || post.roomSlug === filter)
      .filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [posts, filter, searchQuery]);

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Recent Discussions</h2>
      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <PostItem
              key={post.id}
              post={post}
              authorUser={
                (post.authorId && usersById[post.authorId]) ||
                findUserByAuthorHandle(post.author, users)
              }
            />
          ))
        ) : (
          <div className="text-center py-16 rounded-lg border border-[var(--community-card-border)] bg-[var(--community-card-bg)]">
            <MessagesSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No discussions yet.</h3>
            <p className="mt-2 text-sm text-[color:var(--community-muted)]">Be the first to start a conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedSection;
