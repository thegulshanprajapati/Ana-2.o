import { NextResponse } from "next/server";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface UploadInput {
  id: string;
  filename: string;
  mimeType: string;
  size?: number;
  preview?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { files?: UploadInput[] };
    const files = body.files ?? [];

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    await sleep(450);

    const uploaded = files.map((file) => ({
      id: file.id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size ?? 0,
      url: `https://cdn.mock.anaconnect.local/uploads/${Date.now()}-${encodeURIComponent(file.filename)}`,
      preview: file.preview,
    }));

    return NextResponse.json({ files: uploaded }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected upload error",
      },
      { status: 500 }
    );
  }
}
