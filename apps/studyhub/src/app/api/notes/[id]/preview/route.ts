import {
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { db } from "@studyhub/db";
import { notes } from "@studyhub/db";
import {
  R2_BUCKET_NAME,
  r2Client,
} from "@/lib/storage/r2";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_PREVIEW_SIZE = 2 * 1024 * 1024;

const ALLOWED_PREVIEW_TYPES = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
]);

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: "Du skal være logget ind",
      },
      {
        status: 401,
      },
    );
  }

  const { id: noteId } = await context.params;

  const [note] = await db
    .select({
      id: notes.id,
      ownerId: notes.ownerId,
    })
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!note) {
    return NextResponse.json(
      {
        error: "Noten blev ikke fundet",
      },
      {
        status: 404,
      },
    );
  }

  if (note.ownerId !== session.user.id) {
    return NextResponse.json(
      {
        error: "Du har ikke adgang til noten",
      },
      {
        status: 403,
      },
    );
  }

  const formData = await request.formData();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        error: "Preview-fil mangler",
      },
      {
        status: 400,
      },
    );
  }

  if (!ALLOWED_PREVIEW_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: "Preview skal være WebP, PNG eller JPEG",
      },
      {
        status: 400,
      },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      {
        error: "Preview-filen er tom",
      },
      {
        status: 400,
      },
    );
  }

  if (file.size > MAX_PREVIEW_SIZE) {
    return NextResponse.json(
      {
        error: "Preview må højst fylde 2 MB",
      },
      {
        status: 400,
      },
    );
  }

  const storageKey = `note-previews/${noteId}.webp`;

  const bytes = new Uint8Array(await file.arrayBuffer());

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
      Body: bytes,
      ContentType: file.type,
      CacheControl: "private, no-store, max-age=0",
    }),
  );

  const previewImageUrl = `/api/notes/${noteId}/preview`;

  await db
    .update(notes)
    .set({
      previewImageUrl,
      updatedAt: new Date(),
    })
    .where(eq(notes.id, noteId));

  return NextResponse.json({
    ok: true,
    previewImageUrl,
  });
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: "Du skal være logget ind",
      },
      {
        status: 401,
      },
    );
  }

  const { id: noteId } = await context.params;

  const [note] = await db
    .select({
      id: notes.id,
      ownerId: notes.ownerId,
      previewImageUrl: notes.previewImageUrl,
    })
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!note) {
    return NextResponse.json(
      {
        error: "Noten blev ikke fundet",
      },
      {
        status: 404,
      },
    );
  }

  if (note.ownerId !== session.user.id) {
    return NextResponse.json(
      {
        error: "Du har ikke adgang til noten",
      },
      {
        status: 403,
      },
    );
  }

  if (!note.previewImageUrl) {
    return NextResponse.json(
      {
        error: "Noten har ikke noget preview endnu",
      },
      {
        status: 404,
      },
    );
  }

  const storageKey = `note-previews/${noteId}.webp`;

  try {
    const result = await r2Client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: storageKey,
      }),
    );

    if (!result.Body) {
      return NextResponse.json(
        {
          error: "Preview-filen blev ikke fundet",
        },
        {
          status: 404,
        },
      );
    }

    const bytes = await result.Body.transformToByteArray();

    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;

return new NextResponse(arrayBuffer, {
  status: 200,
  headers: {
    "Content-Type": result.ContentType ?? "image/webp",
    "Content-Length": String(bytes.byteLength),

    /*
     * Previewet overskrives på samme URL,
     * så browseren må ikke bruge en gammel cached version.
     */
    "Cache-Control": "private, no-store, max-age=0",

    "X-Content-Type-Options": "nosniff",
  },
});
  } catch (error) {
    console.error("Preview fetch failed:", error);

    return NextResponse.json(
      {
        error: "Preview kunne ikke hentes",
      },
      {
        status: 500,
      },
    );
  }
}