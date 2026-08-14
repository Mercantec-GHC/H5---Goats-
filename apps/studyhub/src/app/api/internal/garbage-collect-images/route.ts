import { NextResponse } from "next/server";

import { garbageCollectNoteImages } from "@/lib/images/garbageCollectionNoteImages";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");

  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error("CRON_SECRET is not configured");

    return NextResponse.json(
      {
        error: "Server configuration error",
      },
      {
        status: 500,
      },
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const result = await garbageCollectNoteImages(0);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Image garbage collection failed:", error);

    return NextResponse.json(
      {
        error: "Garbage collection failed",
      },
      {
        status: 500,
      },
    );
  }
}