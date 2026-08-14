import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, notes, noteCollaborators, notePlacements } from "@studyhub/db";
import { and, eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{
    id: string;
    userId: string;
  }>;
};
// Funktion til at slette en samarbejdspartner fra en note
export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: noteId, userId } = await params;

  const note = await db.query.notes.findFirst({
    where: eq(notes.id, noteId),
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (note.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the owner can remove collaborators" },
      { status: 403 },
    );
  }

  if (userId === note.ownerId) {
    return NextResponse.json(
      { error: "Owner cannot be removed" },
      { status: 400 },
    );
  }

  await db
    .delete(noteCollaborators)
    .where(
      and(
        eq(noteCollaborators.noteId, noteId),
        eq(noteCollaborators.userId, userId),
      ),
    );

  await db
    .delete(notePlacements)
    .where(
      and(
        eq(notePlacements.noteId, noteId),
        eq(notePlacements.userId, userId),
      ),
    );

  return NextResponse.json({ success: true });
}