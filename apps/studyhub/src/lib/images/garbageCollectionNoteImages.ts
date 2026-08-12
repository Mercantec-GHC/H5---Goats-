import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { and, isNotNull, lt, eq } from "drizzle-orm";

import { db } from "@studyhub/db";
import { noteImages } from "@studyhub/db";
import {
  R2_BUCKET_NAME,
  r2Client,
} from "@/lib/storage/r2";

const DEFAULT_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

export async function garbageCollectNoteImages(
  gracePeriodMs = DEFAULT_GRACE_PERIOD_MS,
) {
  const cutoff = new Date(Date.now() - gracePeriodMs);

  const candidates = await db
    .select({
      id: noteImages.id,
      storageKey: noteImages.storageKey,
      deletedAt: noteImages.deletedAt,
    })
    .from(noteImages)
    .where(
      and(
        isNotNull(noteImages.deletedAt),
        lt(noteImages.deletedAt, cutoff),
      ),
    );

  let deleted = 0;
  let failed = 0;

  for (const image of candidates) {
    try {
      /*
       * Slet først fra R2.
       */
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: image.storageKey,
        }),
      );

      /*
       * Når R2-sletningen lykkes,
       * fjern metadata-rækken fra databasen.
       */
      await db
        .delete(noteImages)
        .where(eq(noteImages.id, image.id));

      deleted += 1;
    } catch (error) {
      failed += 1;

      console.error(
        `Garbage collection failed for image ${image.id}:`,
        error,
      );
    }
  }

  return {
    scanned: candidates.length,
    deleted,
    failed,
    cutoff,
  };
}