"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCommunityStore } from '@/store/communityStore';
import { CreatePostInput, createPostSchema, postTypes } from '@/lib/validators/community';
import { rooms } from '@/lib/communityMock';
import { useToast } from '@/hooks/use-toast';
import { AppContext } from '@/context/AppContext';
import { useContext } from 'react';

const ComposerModal = () => {
  const { composerOpen, composerDefaultType, composerDefaultRoom, closeComposer, addPost } = useCommunityStore(state => ({
    composerOpen: state.composerOpen,
    composerDefaultType: state.composerDefaultType,
    composerDefaultRoom: state.composerDefaultRoom,
    closeComposer: state.closeComposer,
    addPost: state.addPost,
  }));

  const { userName, user } = useContext(AppContext);
  const { toast } = useToast();

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      type: composerDefaultType,
      title: '',
      content: '',
      roomSlug: composerDefaultRoom,
      stepsToReproduce: '',
    },
  });

  useEffect(() => {
    form.reset({
      type: composerDefaultType,
      title: '',
      content: '',
      roomSlug: composerDefaultRoom,
      stepsToReproduce: '',
    });
  }, [composerOpen, composerDefaultType, composerDefaultRoom, form]);

  const onSubmit = (data: CreatePostInput) => {
    addPost(data, userName || 'anonymous', user?.id);
    toast({
      title: 'Success!',
      description: 'Your post has been published.',
    });
  };

  const postType = form.watch('type');

  return (
    <Dialog open={composerOpen} onOpenChange={(open) => !open && closeComposer()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
          <DialogDescription>Share your thoughts, ideas, or issues with the community.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a post type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {postTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomSlug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map(room => <SelectItem key={room.slug} value={room.slug}>{room.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="A clear and concise title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Write your post content here..." {...field} rows={6} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {postType === 'Bug' && (
              <FormField
                control={form.control}
                name="stepsToReproduce"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Steps to Reproduce</FormLabel>
                    <FormControl>
                      <Textarea placeholder="1. Go to '...'\n2. Click on '....'\n3. See error" {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Attachment Stub */}
            <div>
              <Label>Attachments (Optional)</Label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
                <div className="text-center">
                  <p className="text-xs leading-5 text-muted-foreground">Drag and drop files here, or click to browse</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeComposer}>Cancel</Button>
              <Button type="submit">Publish Post</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ComposerModal;
