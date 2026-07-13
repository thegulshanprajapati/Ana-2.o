import type { UserData } from "@/lib/local-data";

export type PublicConnectProfile = {
  handle: string;
  bio: string;
  isPublic: boolean;
  followingUserIds: string[];
};

const normalize = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
};

export const toConnectHandle = (source: string, fallback = "ana_user"): string => {
  const handle = normalize(source || "");
  return handle.length ? handle.slice(0, 24) : fallback;
};

export const getPublicConnectProfile = (user: UserData): PublicConnectProfile => {
  const fallbackSource = user.displayName || user.email || user.id;
  const handle = toConnectHandle(
    user.connectProfile?.handle || fallbackSource || "ana_user",
    `ana_${user.id.slice(0, 6)}`
  );

  return {
    handle,
    bio:
      user.connectProfile?.bio ||
      `Hi, I am ${user.displayName || "an Ana user"} on My Ana AI.`,
    isPublic: user.connectProfile?.isPublic ?? true,
    followingUserIds: user.connectProfile?.followingUserIds || [],
  };
};

export const findUserByAuthorHandle = (
  author: string,
  users: UserData[]
): UserData | undefined => {
  const cleanedAuthor = author.replace(/^@/, "");
  const normalizedAuthor = normalize(cleanedAuthor);
  return users.find((user) => {
    const profile = getPublicConnectProfile(user);
    return normalize(profile.handle) === normalizedAuthor;
  });
};
