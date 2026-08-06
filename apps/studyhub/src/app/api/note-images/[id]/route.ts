import { GetObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { db } from "@studyhub/db";
import { noteImages } from "@studyhub/db";
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

  const { id: imageId } = await context.params;

  const [image] = await db
    .select({
      id: noteImages.id,
      storageKey: noteImages.storageKey,
      mimeType: noteImages.mimeType,
      originalName: noteImages.originalName,
      noteOwnerId: notes.ownerId,
    })
    .from(noteImages)
    .innerJoin(notes, eq(noteImages.noteId, notes.id))
    .where(eq(noteImages.id, imageId))
    .limit(1);

  if (!image) {
    return NextResponse.json(
      {
        error: "Billedet blev ikke fundet",
      },
      {
        status: 404,
      },
    );
  }

  /*
   * Første version: kun notens ejer har adgang.
   * Udvid senere med jeres collaborator-/sharing-logik.
   */
  if (image.noteOwnerId !== session.user.id) {
    return NextResponse.json(
      {
        error: "Du har ikke adgang til billedet",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const result = await r2Client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: image.storageKey,
      }),
    );

    if (!result.Body) {
      return NextResponse.json(
        {
          error: "Billedfilen blev ikke fundet i storage",
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
    "Content-Type": result.ContentType ?? image.mimeType,
    "Content-Length": String(bytes.byteLength),
    "Cache-Control": "private, max-age=3600",
    "Content-Disposition": `inline; filename="${encodeURIComponent(
      image.originalName,
    )}"`,
    "X-Content-Type-Options": "nosniff",
  },
});
  } catch (error) {
    console.error("Image fetch failed:", error);

    return NextResponse.json(
      {
        error: "Billedet kunne ikke hentes",
      },
      {
        status: 500,
      },
    );
  }
}