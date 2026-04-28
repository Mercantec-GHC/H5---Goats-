import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, notes, noteCollaborators, notePlacements } from "@studyhub/db";
import { and, eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getAccessibleNote(noteId: string, userId: string) {
  const note = await db.query.notes.findFirst({
    where: eq(notes.id, noteId),
  });

  if (!note) return null;

  if (note.ownerId === userId) {
    return note;
  }

  const collaborator = await db.query.noteCollaborators.findFirst({
    where: and(
      eq(noteCollaborators.noteId, noteId),
      eq(noteCollaborators.userId, userId)
    ),
  });

  if (!collaborator) return null;

  return note;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: noteId } = await params;

  const note = await getAccessibleNote(noteId, session.user.id);

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const placement = await db.query.notePlacements.findFirst({
    where: and(
      eq(notePlacements.noteId, noteId),
      eq(notePlacements.userId, session.user.id)
    ),
  });

  return NextResponse.json({
    ...note,
    topicId: placement?.topicId ?? null,
  });
}


export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: noteId } = await params;
  const body = await req.json();

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const ydocState =
    typeof body.ydocState === "string" ? body.ydocState : undefined;

  if (title === "" && ydocState === undefined) {
    return NextResponse.json(
      { error: "Nothing to update" },
      { status: 400 }
    );
  }

  const note = await getAccessibleNote(noteId, session.user.id);

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const updateData: Partial<typeof notes.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (title !== undefined) {
    updateData.title = title;
  }

  if (ydocState !== undefined) {
    updateData.ydocState = ydocState;
  }

  const [updatedNote] = await db
    .update(notes)
    .set(updateData)
    .where(eq(notes.id, noteId))
    .returning();

  return NextResponse.json(updatedNote);
}