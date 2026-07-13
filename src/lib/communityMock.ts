
import { Room, Post, CommentData, PostType, RoomSlug } from "./validators/community";
import { MessageSquare, HelpCircle, Lightbulb, Trophy, Bug } from "lucide-react";

export const rooms: Room[] = [
  { 
    slug: 'general',
    name: 'General',
    description: 'Ask anything about Ana AI.',
    icon: MessageSquare,
  },
  { 
    slug: 'help-and-support',
    name: 'Help & Support',
    description: 'Issues, how-to, troubleshooting.',
    icon: HelpCircle
  },
  { 
    slug: 'feature-requests',
    name: 'Feature Requests',
    description: 'Suggest and vote on ideas.',
    icon: Lightbulb
  },
  { 
    slug: 'showcase',
    name: 'Showcase',
    description: 'Share projects and results.',
    icon: Trophy
  },
  { 
    slug: 'bug-reports',
    name: 'Bug Reports',
    description: 'Report problems with steps.',
    icon: Bug
  }
];

// Data is now managed by the store, starting fresh.
// This is kept as an empty object for type consistency.
export const comments: Record<string, CommentData[]> = {};

// Data is now managed by the store, starting fresh.
export const initialPosts: Post[] = [];
