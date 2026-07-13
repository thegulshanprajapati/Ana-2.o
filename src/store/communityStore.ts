
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Post, CommentData, CreatePostInput, PostType, RoomSlug } from '@/lib/validators/community';

export type FilterType = RoomSlug | 'all';

type CommunityState = {
  posts: Post[];
  comments: Record<string, CommentData[]>;
  votedPosts: Set<string>;
  filter: FilterType;
  searchQuery: string;
  selectedPostId: string | null;
  composerOpen: boolean;
  composerDefaultType: PostType;
  composerDefaultRoom: RoomSlug;
  error: string | null;
  isLoading: boolean;
  isInitialized: boolean;
};

type CommunityActions = {
  fetchInitialData: () => void;
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
  selectPost: (postId: string | null) => void;
  toggleVote: (postId: string) => void;
  openComposer: (defaultType?: PostType, defaultRoom?: RoomSlug) => void;
  closeComposer: () => void;
  addPost: (post: CreatePostInput, author: string, authorId?: string) => void;
  addComment: (postId: string, content: string, author: string) => void;
  setError: (error: string | null) => void;
};

export const useCommunityStore = create<CommunityState & CommunityActions>((set, get) => ({
  posts: [],
  comments: {},
  votedPosts: new Set(),
  filter: 'all',
  searchQuery: '',
  selectedPostId: null,
  composerOpen: false,
  composerDefaultType: 'Discussion',
  composerDefaultRoom: 'general',
  error: null,
  isLoading: true,
  isInitialized: false,

  fetchInitialData: () => {
    set(state => {
      if (state.isInitialized) {
        return state;
      }
      // In a real app, you would fetch data from an API here.
      // For now, initialize once and keep local state while app is running.
      return { ...state, isLoading: false, isInitialized: true };
    });
  },
  
  setFilter: (filter) => set({ filter }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  selectPost: (postId) => set({ selectedPostId: postId }),
  
  toggleVote: (postId) => {
    set(state => {
      const newVotedPosts = new Set(state.votedPosts);
      const post = state.posts.find(p => p.id === postId);
      if (!post) return state;

      let newVoteCount = post.votes;
      if (newVotedPosts.has(postId)) {
        newVotedPosts.delete(postId);
        newVoteCount--;
      } else {
        newVotedPosts.add(postId);
        newVoteCount++;
      }

      return {
        votedPosts: newVotedPosts,
        posts: state.posts.map(p => p.id === postId ? { ...p, votes: newVoteCount } : p),
      };
    });
  },
  
  openComposer: (defaultType = 'Discussion', defaultRoom = 'general') =>
    set({
      composerOpen: true,
      composerDefaultType: defaultType,
      composerDefaultRoom: defaultRoom,
    }),
  
  closeComposer: () => set({ composerOpen: false }),

  addPost: (postData, author, authorId) => {
    const newPost: Post = {
      ...postData,
      id: uuidv4(),
      author: `@${author.toLowerCase().replace(' ', '_')}`,
      authorId,
      tags: [],
      votes: 0,
      createdAt: new Date().toISOString(),
    };
    set(state => ({
      posts: [newPost, ...state.posts],
      comments: { ...state.comments, [newPost.id]: [] },
      composerOpen: false,
    }));
  },

  addComment: (postId, content, author) => {
    const newComment: CommentData = {
      id: uuidv4(),
      author: `@${author.toLowerCase().replace(' ', '_')}`,
      content,
      createdAt: new Date().toISOString(),
    };
    set(state => ({
      comments: {
        ...state.comments,
        [postId]: [
          ...(state.comments[postId] || []),
          newComment
        ]
      }
    }));
  },
  
  setError: (error) => set({ error }),
}));
