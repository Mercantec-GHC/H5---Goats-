import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import {
  R2_BUCKET_NAME,
  r2Client,
} from "@/lib/storage/r2";

export async function GET() {
  try {
    const result = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        MaxKeys: 1,
      }),
    );

    return NextResponse.json({
      ok: true,
      objectCount: result.KeyCount ?? 0,
    });
  } catch (error) {
    console.error("R2 connection test failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Could not connect to R2",
      },
      {
        status: 500,
      },
    );
  }
}