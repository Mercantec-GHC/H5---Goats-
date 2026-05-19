import { NextResponse } from "next/server";
import crypto from "crypto";

import { auth } from "@/lib/auth";

import {
  db,
  notes,
  noteCollaborators,
  noteInvites,
} from "@studyhub/db";

import { and, eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function hasAccess(noteId: string, userId: string) {
  const note = await db.query.notes.findFirst({
    where: eq(notes.id, noteId),
  });

  if (!note) return false;

  if (note.ownerId === userId) {
    return true;
  }

  const collaborator = await db.query.noteCollaborators.findFirst({
    where: and(
      eq(noteCollaborators.noteId, noteId),
      eq(noteCollaborators.userId, userId),
    ),
  });

  return !!collaborator;
}

export async function POST(
  _req: Request,
  { params }: RouteContext,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id: noteId } = await params;

  const allowed = await hasAccess(noteId, session.user.id);

  if (!allowed) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 },
    );
  }

  const token = crypto.randomBytes(32).toString("hex");

  await db.insert(noteInvites).values({
    noteId,
    token,
    createdByUserId: session.user.id,
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

  return NextResponse.json({
    inviteUrl,
  });
}