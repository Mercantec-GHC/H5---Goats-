import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, notes, noteCollaborators, notePlacements } from "@studyhub/db";
import { and, eq } from "drizzle-orm";
// Routecontext er et objekt, der indeholder parametre for rutehåndtering
type RouteContext = {
  params: Promise<{ id: string }>;
};
// Funktion til at hente en note, hvis brugeren enten er ejer eller samarbejdspartner
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
// Håndterer hentning, opdatering og sletning af en specifik note
// Først og fremmest tjekker den om brugeren er logget ind, og om det emne de prøver at tilgå rent faktisk tilhører dem eller de er samarbejdspartner på noten
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
// Funktion til opdatering af en note
export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: noteId } = await params;
  const body = await req.json();

  const title = typeof body.title === "string" ? body.title.trim() : undefined;

  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  const note = await getAccessibleNote(noteId, session.user.id);

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const [updatedNote] = await db
    .update(notes)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(eq(notes.id, noteId))
    .returning();

  return NextResponse.json(updatedNote);
}
// Funktion til sletning af en note, tjekker også om det er ejeren der prøver at slette den, da kun ejeren skal kunne slette en note
export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: noteId } = await params;

  const note = await getAccessibleNote(noteId, session.user.id);

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (note.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the owner can delete this note" },
      { status: 403 }
    );
  }

  await db.delete(notes).where(eq(notes.id, noteId));

  return NextResponse.json({ success: true });
}