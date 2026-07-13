import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';

export const roomSlugs = ['general', 'help-and-support', 'feature-requests', 'showcase', 'bug-reports'] as const;
export type RoomSlug = typeof roomSlugs[number];

export interface Room {
  slug: RoomSlug;
  name: string;
  description: string;
  icon: LucideIcon;
}

export const postTypes = ['Discussion', 'Feature', 'Bug'] as const;
export type PostType = typeof postTypes[number];

export interface CommentData {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  type: PostType;
  title: string;
  content: string;
  author: string;
  authorId?: string;
  roomSlug: RoomSlug;
  tags: string[];
  votes: number;
  createdAt: string;
  stepsToReproduce?: string;
}

export const createPostSchema = z.object({
  type: z.enum(postTypes, {
    required_error: 'Post type is required.',
  }),
  roomSlug: z.enum(roomSlugs, {
    required_error: 'Please select a room.',
  }),
  title: z.string().min(5, 'Title must be at least 5 characters.').max(80, 'Title cannot exceed 80 characters.'),
  content: z.string().min(20, 'Body must be at least 20 characters.').max(2000, 'Body cannot exceed 2000 characters.'),
  stepsToReproduce: z.string().max(1000, 'Steps cannot exceed 1000 characters.').optional(),
}).refine(data => data.type !== 'Bug' || (data.type === 'Bug' && data.stepsToReproduce && data.stepsToReproduce.length > 0), {
    message: "Steps to reproduce are required for bug reports.",
    path: ["stepsToReproduce"],
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
