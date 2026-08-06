import { randomUUID } from "crypto";

import {
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { db } from "@studyhub/db";
import { notes } from "@studyhub/db";
import { noteImages } from "@studyhub/db";
import {
  R2_BUCKET_NAME,
  r2Client,
} from "@/lib/storage/r2";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

  /*
   * Denne første version tillader kun ejeren at uploade.
   * Når endpointet virker, kan kontrollen udvides med jeres
   * collaborator-/sharing-tabel.
   */
  const [note] = await db
    .select({
      id: notes.id,
    })
    .from(notes)
    .where(
      and(
        eq(notes.id, noteId),
        eq(notes.ownerId, session.user.id),
      ),
    )
    .limit(1);

  if (!note) {
    return NextResponse.json(
      {
        error: "Noten blev ikke fundet, eller du har ikke adgang",
      },
      {
        status: 404,
      },
    );
  }

  const formData = await request.formData();
  const fileValue = formData.get("file");
  const altTextValue = formData.get("altText");

  if (!(fileValue instanceof File)) {
    return NextResponse.json(
      {
        error: "Der mangler en billedfil",
      },
      {
        status: 400,
      },
    );
  }

  if (!ALLOWED_IMAGE_TYPES.has(fileValue.type)) {
    return NextResponse.json(
      {
        error: "Kun JPEG, PNG, WebP og GIF er tilladt",
      },
      {
        status: 415,
      },
    );
  }

  if (fileValue.size === 0) {
    return NextResponse.json(
      {
        error: "Filen er tom",
      },
      {
        status: 400,
      },
    );
  }

  if (fileValue.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: "Billedet må højst fylde 8 MB",
      },
      {
        status: 413,
      },
    );
  }

  const extension = EXTENSION_BY_MIME_TYPE[fileValue.type];
  const imageId = randomUUID();

  const storageKey =
    `notes/${noteId}/${imageId}.${extension}`;

  const altText =
    typeof altTextValue === "string"
      ? altTextValue.trim().slice(0, 500)
      : "";

  const body = Buffer.from(
    await fileValue.arrayBuffer(),
  );

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: storageKey,
        Body: body,
        ContentType: fileValue.type,
        ContentLength: fileValue.size,

        Metadata: {
          noteId,
          uploadedById: session.user.id,
        },
      }),
    );

    try {
      const [createdImage] = await db
        .insert(noteImages)
        .values({
          id: imageId,
          noteId,
          uploadedById: session.user.id,
          storageKey,
          originalName: fileValue.name || `image.${extension}`,
          mimeType: fileValue.type,
          size: fileValue.size,
          altText,
          width: null,
          height: null,
        })
        .returning({
          id: noteImages.id,
          noteId: noteImages.noteId,
          originalName: noteImages.originalName,
          mimeType: noteImages.mimeType,
          size: noteImages.size,
          altText: noteImages.altText,
          width: noteImages.width,
          height: noteImages.height,
          createdAt: noteImages.createdAt,
        });

      return NextResponse.json(
        {
          image: {
            ...createdImage,

            /*
             * Stabil intern URL. Vi bygger GET-routen i næste trin.
             */
            url: `/api/note-images/${createdImage.id}`,
          },
        },
        {
          status: 201,
        },
      );
    } catch (databaseError) {
      /*
       * Uploaden lykkedes, men DB-insert fejlede.
       * Fjern derfor objektet igen, så vi ikke efterlader
       * en forældreløs fil i R2.
       */
      await r2Client
        .send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: storageKey,
          }),
        )
        .catch((cleanupError) => {
          console.error(
            "Kunne ikke rydde R2-objekt op:",
            cleanupError,
          );
        });

      throw databaseError;
    }
  } catch (error) {
    console.error("Image upload failed:", error);

    return NextResponse.json(
      {
        error: "Billedet kunne ikke uploades",
      },
      {
        status: 500,
      },
    );
  }
}