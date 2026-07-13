import { NextResponse } from "next/server";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface MediaPayload {
  id: string;
  url: string;
  mimeType: string;
  filename: string;
}

interface CreatePostPayload {
  caption: string;
  postType: "photo" | "text" | "story" | "reel" | "poll";
  audience: "public" | "followers" | "private";
  location?: string;
  scheduleEnabled?: boolean;
  scheduledAt?: string;
  media?: MediaPayload[];
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreatePostPayload;

    const caption = payload.caption?.trim() ?? "";
    const media = payload.media ?? [];

    if (!caption && media.length === 0) {
      return NextResponse.json(
        { error: "Either caption or media is required." },
        { status: 400 }
      );
    }

    if (payload.scheduleEnabled) {
      if (!payload.scheduledAt) {
        return NextResponse.json(
          { error: "Scheduled datetime is required when scheduling is enabled." },
          { status: 400 }
        );
      }

      const scheduledDate = new Date(payload.scheduledAt);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "Scheduled datetime must be in the future." },
          { status: 400 }
        );
      }
    }

    await sleep(650);

    return NextResponse.json(
      {
        id: `post_${Date.now()}`,
        status: payload.scheduleEnabled ? "scheduled" : "published",
        publishedAt: payload.scheduleEnabled ? null : new Date().toISOString(),
        scheduledAt: payload.scheduleEnabled ? payload.scheduledAt : null,
        summary: {
          captionLength: caption.length,
          mediaCount: media.length,
          audience: payload.audience,
          postType: payload.postType,
          location: payload.location || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected publish error",
      },
      { status: 500 }
    );
  }
}
