"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import ComposerModal from "@/components/community/ComposerModal";
import PostDrawer from "@/components/community/PostDrawer";
import PostItem from "@/components/community/PostItem";
import { PostSkeleton } from "@/components/community/skeletons";
import { useCommunityStore } from "@/store/communityStore";
import { roomSlugs, type RoomSlug } from "@/lib/validators/community";
import { rooms } from "@/lib/communityMock";
import { findUserByAuthorHandle } from "@/lib/connect-profile";
import { getAllUsers, type UserData } from "@/lib/local-data";
import { AppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  MessageSquarePlus,
  Send,
  Search,
  MessagesSquare,
} from "lucide-react";

const isValidRoomSlug = (value: string): value is RoomSlug => {
  return roomSlugs.includes(value as RoomSlug);
};

const buildTitleFromMessage = (message: string, roomName: string): string => {
  const firstLine = message.split("\n")[0].trim().replace(/\s+/g, " ");
  const candidate = firstLine.slice(0, 80);
  if (candidate.length >= 5) {
    return candidate;
  }
  return `${roomName} discussion`;
};

export default function CommunityRoomPage() {
  const params = useParams<{ id: string }>();
  const slug = params?.id || "";
  const roomSlug = isValidRoomSlug(slug) ? slug : null;
  const room = roomSlug ? rooms.find((r) => r.slug === roomSlug) : null;

  const {
    fetchInitialData,
    posts,
    isLoading,
    error,
    setError,
    openComposer,
    addPost,
  } = useCommunityStore((state) => ({
    fetchInitialData: state.fetchInitialData,
    posts: state.posts,
    isLoading: state.isLoading,
    error: state.error,
    setError: state.setError,
    openComposer: state.openComposer,
    addPost: state.addPost,
  }));

  const { isLoggedIn, userName, user } = useContext(AppContext);
  const { toast } = useToast();
  const [firstMessage, setFirstMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    getAllUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  const usersById = useMemo(() => {
    return users.reduce<Record<string, UserData>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [users]);

  const filteredPosts = useMemo(() => {
    if (!roomSlug) return [];
    const query = searchQuery.trim().toLowerCase();
    return posts
      .filter((post) => post.roomSlug === roomSlug)
      .filter((post) => {
        if (!query) return true;
        return (
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.author.toLowerCase().includes(query)
        );
      });
  }, [posts, roomSlug, searchQuery]);

  const handleDropFirstMessage = () => {
    if (!roomSlug || !room) return;
    if (!isLoggedIn) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Room me message drop karne ke liye login karo.",
      });
      return;
    }

    const content = firstMessage.trim();
    if (!content) {
      toast({
        variant: "destructive",
        title: "Message empty hai",
        description: "Pehla message type karo, phir drop karo.",
      });
      return;
    }

    addPost(
      {
        type: "Discussion",
        roomSlug,
        title: buildTitleFromMessage(content, room.name),
        content,
        stepsToReproduce: "",
      },
      userName || "anonymous",
      user?.id
    );

    setFirstMessage("");
    toast({
      title: "Posted",
      description: "Tumhara first message room me publish ho gaya.",
    });
  };

  if (!roomSlug || !room) {
    return (
      <div className="community-background-noise flex min-h-screen flex-col">
        <AppHeader />
        <main className="container mx-auto flex-1 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-xl border border-[var(--community-card-border)] bg-[var(--community-card-bg)] p-8 text-center">
            <h1 className="text-3xl font-bold text-foreground">Room Not Found</h1>
            <p className="mt-3 text-[color:var(--community-muted)]">
              Yeh room available nahi hai.
            </p>
            <Button asChild className="mt-6">
              <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Community
              </Link>
            </Button>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  const Icon = room.icon;

  return (
    <div className="community-background-noise flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 md:py-12">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <Button
              asChild
              variant="ghost"
              className="text-foreground hover:bg-[var(--community-card-hover)]"
            >
              <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Community
              </Link>
            </Button>
            <Button
              onClick={() => openComposer("Discussion", room.slug)}
              className="border border-primary/40 bg-primary/15 text-primary hover:bg-primary/25"
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Create Full Post
            </Button>
          </div>

          <section className="mb-8 rounded-2xl border border-[var(--community-card-border)] bg-[var(--community-card-bg)] p-6 backdrop-blur-sm md:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-primary/30 bg-primary/15 p-3 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {room.name}
                </h1>
                <p className="mt-1 text-[color:var(--community-muted)]">
                  {room.description}
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8 rounded-2xl border border-[var(--community-card-border)] bg-[var(--community-card-bg)] p-5 backdrop-blur-sm md:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Drop your first message
              </h2>
              <span className="text-xs text-[color:var(--community-muted)]">
                Room: {room.name}
              </span>
            </div>
            <Textarea
              rows={4}
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              placeholder="Yahan apna pehla message likho..."
              className="border-[var(--community-card-border)] bg-[var(--community-surface)] text-foreground placeholder:text-[color:var(--community-muted)]"
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={handleDropFirstMessage}>
                <Send className="mr-2 h-4 w-4" />
                Drop Message
              </Button>
            </div>
          </section>

          {error && (
            <div className="my-8 flex items-center justify-between rounded-lg border border-destructive bg-destructive/20 p-4">
              <p className="text-destructive-foreground">An error occurred: {error}</p>
              <Button variant="destructive" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          )}

          <section className="mb-6">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${room.name}...`}
                className="pl-9 border-[var(--community-card-border)] bg-[var(--community-surface)] text-foreground placeholder:text-[color:var(--community-muted)]"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Room Discussions</h2>
            {isLoading ? (
              <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <PostItem
                    key={post.id}
                    post={post}
                    authorUser={
                      (post.authorId && usersById[post.authorId]) ||
                      findUserByAuthorHandle(post.author, users)
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--community-card-border)] bg-[var(--community-card-bg)] py-16 text-center">
                <MessagesSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No messages in this room yet.
                </h3>
                <p className="mt-2 text-sm text-[color:var(--community-muted)]">
                  Pehla message drop karke conversation start karo.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
      <ComposerModal />
      <PostDrawer />
      <AppFooter />
    </div>
  );
}
