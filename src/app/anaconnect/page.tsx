"use client";

import Link from "next/link";
import Image from "next/image";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Crown,
  Hash,
  Loader2,
  PlusCircle,
  Sparkles,
  Users,
} from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { PostComposer } from "@/components/anaconnect/PostComposer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppContext } from "@/context/AppContext";
import { getPublicConnectProfile } from "@/lib/connect-profile";
import {
  getAllUsers,
  getCommunityPosts,
  type CommunityPost,
  type UserData,
} from "@/lib/local-data";
import { timeAgo } from "@/lib/timeAgo";

function PlanIcon({ plan }: { plan?: UserData["plan"] }) {
  if (plan === "Enterprise") {
    return (
      <span title="Enterprise" aria-label="Enterprise" className="inline-flex">
        <Crown className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
      </span>
    );
  }

  if (plan === "Business") {
    return (
      <span title="Business account" aria-label="Business account" className="inline-flex">
        <BadgeCheck className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
      </span>
    );
  }

  return null;
}

export default function AnaConnectPage() {
  const { user } = useContext(AppContext);
  const [composerOpen, setComposerOpen] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadFeed = async () => {
      setIsLoading(true);
      try {
        const [postList, userList] = await Promise.all([
          getCommunityPosts(),
          getAllUsers(),
        ]);

        if (!isMounted) {
          return;
        }

        setPosts(postList);
        setUsers(userList);
      } catch {
        if (!isMounted) {
          return;
        }
        setPosts([]);
        setUsers([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFeed();

    return () => {
      isMounted = false;
    };
  }, []);

  const usersById = useMemo(() => {
    return users.reduce<Record<string, UserData>>((acc, currentUser) => {
      acc[currentUser.id] = currentUser;
      return acc;
    }, {});
  }, [users]);

  const trendingTags = useMemo(() => {
    const tagMap = new Map<string, number>();

    posts.forEach((post) => {
      const tags = post.text.match(/#[a-z0-9_]+/gi) ?? [];
      tags.forEach((tag) => {
        const normalized = tag.toLowerCase();
        tagMap.set(normalized, (tagMap.get(normalized) ?? 0) + 1);
      });
    });

    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [posts]);

  const topCreators = useMemo(() => {
    const creatorMap = new Map<
      string,
      {
        userId: string;
        name: string;
        avatar: string | null;
        plan?: UserData["plan"];
        postCount: number;
      }
    >();

    posts.forEach((post) => {
      const linkedUser = usersById[post.userId];
      const key = linkedUser?.id || post.userId || post.userName;
      if (!key) {
        return;
      }

      const existing = creatorMap.get(key);
      if (existing) {
        existing.postCount += 1;
        return;
      }

      creatorMap.set(key, {
        userId: linkedUser?.id || post.userId,
        name: linkedUser?.displayName || post.userName || "Ana user",
        avatar: linkedUser?.photoURL || post.userAvatar || null,
        plan: linkedUser?.plan,
        postCount: 1,
      });
    });

    return Array.from(creatorMap.values())
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 5);
  }, [posts, usersById]);

  const userName = user?.displayName || "Guest Creator";
  const userInitial = userName.slice(0, 1).toUpperCase();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-10%] h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute right-[-12%] top-[16%] h-[28rem] w-[28rem] rounded-full bg-blue-500/12 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[22%] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <AppHeader />

      <main className="relative z-10 mx-auto w-full max-w-[1320px] px-3 py-6 md:px-6 md:py-8">
        <div className="mb-5 max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
            AnaConnect Composer
          </h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-400 md:text-base">
            Build premium posts with filters, carousel, overlays, scheduling, and draft workflows.
          </p>
        </div>

        {composerOpen ? (
          <PostComposer onClose={() => setComposerOpen(false)} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[270px_minmax(0,1fr)_300px]">
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/55">
                <div className="mb-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-300/70 dark:border-white/20">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {userName}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {user?.plan || "Free"} plan
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setComposerOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Post
                </Button>

                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                  Center feed scrollable hai, side panels fixed rahenge.
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/45">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Quick Stats
                </h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Total posts
                    </span>
                    <span className="font-semibold">{posts.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Creators
                    </span>
                    <span className="font-semibold">{topCreators.length}</span>
                  </div>
                </div>
              </section>
            </aside>

            <section className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/55">
              <div className="border-b border-slate-200/80 p-4 dark:border-white/10">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Posts Feed
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Latest updates from AnaConnect creators.
                </p>
              </div>

              <div className="space-y-4 p-4 lg:h-[calc(100vh-13rem)] lg:overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16 text-slate-600 dark:text-slate-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading posts...
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300/80 bg-slate-100/60 p-10 text-center dark:border-white/20 dark:bg-slate-950/40">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Abhi koi post nahi hai. First post create karein.
                    </p>
                  </div>
                ) : (
                  posts.map((post) => {
                    const linkedUser = usersById[post.userId];
                    const profile = linkedUser
                      ? getPublicConnectProfile(linkedUser)
                      : null;
                    const displayName =
                      linkedUser?.displayName || post.userName || "Ana user";
                    const displayAvatar =
                      linkedUser?.photoURL || post.userAvatar || null;

                    return (
                      <article
                        key={post.id}
                        className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-950/55"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 border border-slate-300/70 dark:border-white/20">
                            <AvatarImage src={displayAvatar || undefined} />
                            <AvatarFallback>
                              {displayName.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {linkedUser ? (
                                <Link
                                  href={`/connect/${linkedUser.id}`}
                                  className="text-sm font-semibold text-slate-900 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300"
                                >
                                  {displayName}
                                </Link>
                              ) : (
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {displayName}
                                </p>
                              )}
                              <PlanIcon plan={linkedUser?.plan} />
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {timeAgo(post.createdAt)}
                              </span>
                            </div>

                            {profile ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                @{profile.handle}
                              </p>
                            ) : null}

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800 dark:text-slate-200">
                              {post.text}
                            </p>

                            {post.imageUrl ? (
                              <div className="relative mt-3 aspect-video overflow-hidden rounded-xl border border-slate-200/70 dark:border-white/10">
                                <Image
                                  src={post.imageUrl}
                                  alt="Post media"
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/45">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <Hash className="h-4 w-4" />
                  Trending Tags
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trendingTags.length > 0 ? (
                    trendingTags.map(([tag, count]) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-slate-300/80 bg-white/70 text-slate-700 dark:border-white/20 dark:bg-slate-950/50 dark:text-slate-200"
                      >
                        {tag} ({count})
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Hashtags milte hi yahan show honge.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/45">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <Sparkles className="h-4 w-4" />
                  Active Creators
                </h3>
                <div className="mt-3 space-y-3">
                  {topCreators.length > 0 ? (
                    topCreators.map((creator) => (
                      <div
                        key={`${creator.userId}-${creator.name}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar className="h-8 w-8 border border-slate-300/70 dark:border-white/15">
                            <AvatarImage src={creator.avatar || undefined} />
                            <AvatarFallback>
                              {creator.name.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            {creator.userId ? (
                              <Link
                                href={`/connect/${creator.userId}`}
                                className="block truncate text-sm font-medium text-slate-900 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300"
                              >
                                {creator.name}
                              </Link>
                            ) : (
                              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                {creator.name}
                              </p>
                            )}
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {creator.postCount} posts
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Activity aate hi creators list update hogi.
                    </p>
                  )}
                </div>
              </section>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
