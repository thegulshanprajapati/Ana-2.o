"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllUsers,
  getCommunityPosts,
  getUserById,
  type CommunityPost,
  type UserData,
} from "@/lib/local-data";
import { getPublicConnectProfile } from "@/lib/connect-profile";
import {
  ArrowLeft,
  BadgeCheck,
  Crown,
  ImageIcon,
  LayoutGrid,
  Loader2,
  User2,
  Video,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

type StatDialogType = "followers" | "following" | null;

const videoMediaPattern = /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i;

const getPostMediaUrl = (post: CommunityPost): string | null => {
  const mediaUrl = post.imageUrl?.trim();
  return mediaUrl?.length ? mediaUrl : null;
};

const isVideoMediaUrl = (mediaUrl: string): boolean => {
  const normalizedUrl = mediaUrl.toLowerCase();
  return (
    normalizedUrl.startsWith("data:video/") ||
    normalizedUrl.includes("/video/upload/") ||
    videoMediaPattern.test(normalizedUrl) ||
    /[?&](?:format|fm)=?(?:mp4|webm|ogg|mov|m4v)\b/i.test(normalizedUrl)
  );
};

const PlanBadge = ({ plan }: { plan?: UserData["plan"] }) => {
  if (plan === "Enterprise") {
    return (
      <Badge className="gap-1 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 hover:from-amber-400 hover:to-yellow-300">
        <Crown className="h-3.5 w-3.5" />
        Enterprise
      </Badge>
    );
  }

  if (plan === "Business") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-blue-500/60 bg-blue-500/10 text-blue-700 dark:text-blue-300"
      >
        <BadgeCheck className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
        Business
      </Badge>
    );
  }

  return <Badge variant="secondary">Free</Badge>;
};

export default function ConnectProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id || "";

  const [profileUser, setProfileUser] = useState<UserData | null>(null);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [openStatDialog, setOpenStatDialog] = useState<StatDialogType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const postsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [user, allUsers, allPosts] = await Promise.all([
          getUserById(userId),
          getAllUsers(),
          getCommunityPosts(),
        ]);

        if (!user) {
          setProfileUser(null);
          setAllUsers([]);
          setPosts([]);
          return;
        }

        setProfileUser(user);
        setAllUsers(allUsers);
        setPosts(allPosts.filter((post) => post.userId === user.id));
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      load();
    }
  }, [userId]);

  const profile = useMemo(
    () => (profileUser ? getPublicConnectProfile(profileUser) : null),
    [profileUser]
  );

  const followersUsers = useMemo(() => {
    if (!profileUser) {
      return [];
    }

    return allUsers.filter((candidate) =>
      (candidate.connectProfile?.followingUserIds || []).includes(profileUser.id)
    );
  }, [allUsers, profileUser]);

  const followingUsers = useMemo(() => {
    if (!profileUser?.connectProfile?.followingUserIds?.length) {
      return [];
    }

    const followingSet = new Set(profileUser.connectProfile.followingUserIds);
    return allUsers.filter((candidate) => followingSet.has(candidate.id));
  }, [allUsers, profileUser]);

  const photoPosts = useMemo(() => {
    return posts.filter((post) => {
      const mediaUrl = getPostMediaUrl(post);
      return Boolean(mediaUrl && !isVideoMediaUrl(mediaUrl));
    });
  }, [posts]);

  const videoPosts = useMemo(() => {
    return posts.filter((post) => {
      const mediaUrl = getPostMediaUrl(post);
      return Boolean(mediaUrl && isVideoMediaUrl(mediaUrl));
    });
  }, [posts]);

  const dialogUsers = openStatDialog === "followers" ? followersUsers : followingUsers;

  const scrollToPosts = () => {
    postsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="community-background-noise relative flex min-h-screen flex-col overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-15%] top-[-8%] h-72 w-72 rounded-full bg-rose-500/15 blur-3xl" />
        <div className="absolute right-[-12%] top-[16%] h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[22%] h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
      </div>
      <AppHeader />
      <main className="container mx-auto flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Button
            asChild
            variant="ghost"
            className="mb-6 text-foreground hover:bg-[var(--community-card-hover)]"
          >
            <Link href="/anaconnect">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to AnaConnect
            </Link>
          </Button>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !profileUser || !profile ? (
            <Card className="border-[var(--community-card-border)] bg-[var(--community-card-bg)]">
              <CardContent className="py-16 text-center">
                <h2 className="text-2xl font-bold">Public profile not found</h2>
                <p className="mt-2 text-[color:var(--community-muted)]">
                  This connect profile does not exist.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="relative overflow-hidden border-[var(--community-card-border)] bg-[var(--community-card-bg)] shadow-xl backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-violet-500/12 via-fuchsia-500/8 to-blue-500/12" />
                <CardHeader className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Avatar className="h-20 w-20 border border-white/10 shadow-lg">
                      <AvatarImage src={profileUser.photoURL || undefined} />
                      <AvatarFallback>
                        <User2 className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-3xl font-bold text-foreground">
                          {profileUser.displayName || "Anonymous"}
                        </h1>
                        <PlanBadge plan={profileUser.plan} />
                      </div>
                      <p className="mt-1 text-sm text-[color:var(--community-muted)]">
                        @{profile.handle}
                      </p>
                      <p className="mt-3 text-sm text-foreground">{profile.bio}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <button
                          type="button"
                          onClick={scrollToPosts}
                          className="rounded-full border border-[var(--community-card-border)] bg-[var(--community-card-bg)] px-3 py-1.5 text-[color:var(--community-muted)] transition hover:border-slate-500/50 hover:text-foreground"
                          aria-label="View posts"
                          title="View posts"
                        >
                          <span className="font-semibold text-foreground">{posts.length}</span> posts
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenStatDialog("followers")}
                          className="rounded-full border border-[var(--community-card-border)] bg-[var(--community-card-bg)] px-3 py-1.5 text-[color:var(--community-muted)] transition hover:border-slate-500/50 hover:text-foreground"
                          aria-label="Open followers list"
                          title="Open followers list"
                        >
                          <span className="font-semibold text-foreground">{followersUsers.length}</span> followers
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenStatDialog("following")}
                          className="rounded-full border border-[var(--community-card-border)] bg-[var(--community-card-bg)] px-3 py-1.5 text-[color:var(--community-muted)] transition hover:border-slate-500/50 hover:text-foreground"
                          aria-label="Open following list"
                          title="Open following list"
                        >
                          <span className="font-semibold text-foreground">{followingUsers.length}</span> following
                        </button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <div ref={postsSectionRef} className="mt-6">
                <Tabs defaultValue="posts" className="space-y-4">
                  <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-base font-semibold text-foreground">Profile content</h2>
                    <TabsList className="h-auto gap-1 rounded-xl bg-[var(--community-card-hover)] p-1">
                      <TabsTrigger
                        value="posts"
                        className="h-8 gap-1.5 rounded-lg px-3 text-xs data-[state=active]:bg-[var(--community-card-bg)]"
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Posts
                        <span className="text-[10px] text-[color:var(--community-muted)]">
                          {posts.length}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="photos"
                        className="h-8 gap-1.5 rounded-lg px-3 text-xs data-[state=active]:bg-[var(--community-card-bg)]"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        Photos
                        <span className="text-[10px] text-[color:var(--community-muted)]">
                          {photoPosts.length}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="videos"
                        className="h-8 gap-1.5 rounded-lg px-3 text-xs data-[state=active]:bg-[var(--community-card-bg)]"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Videos
                        <span className="text-[10px] text-[color:var(--community-muted)]">
                          {videoPosts.length}
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="posts" className="mt-0">
                    {posts.length === 0 ? (
                      <Card className="border-[var(--community-card-border)] bg-[var(--community-card-bg)]">
                        <CardContent className="py-10 text-center">
                          <p className="text-sm text-[color:var(--community-muted)]">
                            No public posts yet.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {posts.map((post) => {
                          const mediaUrl = getPostMediaUrl(post);
                          const isVideoPost = mediaUrl ? isVideoMediaUrl(mediaUrl) : false;

                          return (
                            <Card
                              key={post.id}
                              className="border-[var(--community-card-border)] bg-[var(--community-card-bg)]"
                            >
                              <CardContent className="space-y-3 p-3.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[11px] text-[color:var(--community-muted)]">
                                    {formatDistanceToNow(new Date(post.createdAt), {
                                      addSuffix: true,
                                    })}
                                  </p>
                                  <Badge variant="secondary" className="text-[10px]">
                                    {isVideoPost ? "Video" : mediaUrl ? "Photo" : "Post"}
                                  </Badge>
                                </div>

                                {post.text ? (
                                  <p className="whitespace-pre-wrap text-sm leading-5 text-foreground">
                                    {post.text}
                                  </p>
                                ) : null}

                                {mediaUrl ? (
                                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[var(--community-card-border)]">
                                    {isVideoPost ? (
                                      <video
                                        src={mediaUrl}
                                        controls
                                        preload="metadata"
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <Image
                                        src={mediaUrl}
                                        alt="Post media"
                                        fill
                                        unoptimized
                                        className="object-cover"
                                      />
                                    )}
                                  </div>
                                ) : null}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="photos" className="mt-0">
                    {photoPosts.length === 0 ? (
                      <Card className="border-[var(--community-card-border)] bg-[var(--community-card-bg)]">
                        <CardContent className="py-10 text-center">
                          <p className="text-sm text-[color:var(--community-muted)]">
                            No photo posts yet.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {photoPosts.map((post) => {
                          const mediaUrl = getPostMediaUrl(post);
                          if (!mediaUrl) {
                            return null;
                          }

                          return (
                            <article
                              key={post.id}
                              className="group relative overflow-hidden rounded-xl border border-[var(--community-card-border)] bg-[var(--community-card-bg)]"
                            >
                              <div className="relative aspect-square">
                                <Image
                                  src={mediaUrl}
                                  alt="Photo post"
                                  fill
                                  unoptimized
                                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                />
                              </div>
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-2">
                                <p className="truncate text-[11px] text-white/90">
                                  {post.text || "Photo"}
                                </p>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="videos" className="mt-0">
                    {videoPosts.length === 0 ? (
                      <Card className="border-[var(--community-card-border)] bg-[var(--community-card-bg)]">
                        <CardContent className="py-10 text-center">
                          <p className="text-sm text-[color:var(--community-muted)]">
                            No video posts yet.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {videoPosts.map((post) => {
                          const mediaUrl = getPostMediaUrl(post);
                          if (!mediaUrl) {
                            return null;
                          }

                          return (
                            <article
                              key={post.id}
                              className="overflow-hidden rounded-xl border border-[var(--community-card-border)] bg-[var(--community-card-bg)]"
                            >
                              <div className="relative aspect-video w-full overflow-hidden border-b border-[var(--community-card-border)]">
                                <video
                                  src={mediaUrl}
                                  controls
                                  preload="metadata"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="space-y-1 p-3">
                                <p className="text-[11px] text-[color:var(--community-muted)]">
                                  {formatDistanceToNow(new Date(post.createdAt), {
                                    addSuffix: true,
                                  })}
                                </p>
                                {post.text ? (
                                  <p className="whitespace-pre-wrap text-sm leading-5 text-foreground">
                                    {post.text}
                                  </p>
                                ) : (
                                  <p className="text-sm text-[color:var(--community-muted)]">
                                    Video post
                                  </p>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <Dialog
                open={openStatDialog !== null}
                onOpenChange={(open) => {
                  if (!open) {
                    setOpenStatDialog(null);
                  }
                }}
              >
                <DialogContent className="border-[var(--community-card-border)] bg-[var(--community-card-bg)] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {openStatDialog === "followers" ? "Followers" : "Following"}
                    </DialogTitle>
                    <DialogDescription>
                      {openStatDialog === "followers"
                        ? "People who follow this profile."
                        : "People this profile follows."}
                    </DialogDescription>
                  </DialogHeader>

                  {dialogUsers.length === 0 ? (
                    <p className="py-4 text-sm text-[color:var(--community-muted)]">
                      No users to show yet.
                    </p>
                  ) : (
                    <ScrollArea className="max-h-80 pr-3">
                      <div className="space-y-2">
                        {dialogUsers.map((member) => {
                          const memberProfile = getPublicConnectProfile(member);
                          return (
                            <Link
                              key={member.id}
                              href={`/connect/${member.id}`}
                              onClick={() => setOpenStatDialog(null)}
                              className="flex items-center gap-3 rounded-lg border border-[var(--community-card-border)] bg-[var(--community-card-bg)] p-2 transition hover:bg-[var(--community-card-hover)]"
                            >
                              <Avatar className="h-9 w-9 border border-white/10">
                                <AvatarImage src={member.photoURL || undefined} />
                                <AvatarFallback>
                                  {(member.displayName || "A").slice(0, 1).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {member.displayName || "Anonymous"}
                                </p>
                                <p className="truncate text-xs text-[color:var(--community-muted)]">
                                  @{memberProfile.handle}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </main>
      <div className="mt-auto">
        <AppFooter />
      </div>
    </div>
  );
}
