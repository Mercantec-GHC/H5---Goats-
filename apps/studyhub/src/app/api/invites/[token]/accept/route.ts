import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

import {
  db,
  notes,
  noteCollaborators,
  noteInvites,
  notePlacements,
} from "@studyhub/db";

import { and, eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ token: string }>;
};
// Funktion til at acceptere en invite til en note, og dermed blive samarbejdspartner på noten
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

  const { token } = await params;

  const invite = await db.query.noteInvites.findFirst({
    where: eq(noteInvites.token, token),
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Invite not found" },
      { status: 404 },
    );
  }

  const note = await db.query.notes.findFirst({
    where: eq(notes.id, invite.noteId),
  });

  if (!note) {
    return NextResponse.json(
      { error: "Note not found" },
      { status: 404 },
    );
  }

  const userId = session.user.id;

  if (note.ownerId === userId) {
    return NextResponse.json({
      noteId: note.id,
      message: "You already own this note",
    });
  }

  const existingCollaborator =
    await db.query.noteCollaborators.findFirst({
      where: and(
        eq(noteCollaborators.noteId, note.id),
        eq(noteCollaborators.userId, userId),
      ),
    });

  if (!existingCollaborator) {
    await db.insert(noteCollaborators).values({
      noteId: note.id,
      userId,
      role: "editor",
    });
  }

  const existingPlacement =
    await db.query.notePlacements.findFirst({
      where: and(
        eq(notePlacements.noteId, note.id),
        eq(notePlacements.userId, userId),
      ),
    });

  if (!existingPlacement) {
    await db.insert(notePlacements).values({
      noteId: note.id,
      userId,
      topicId: null,
    });
  }

  return NextResponse.json({
    noteId: note.id,
    success: true,
  });
}