import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, notes, noteCollaborators, users } from "@studyhub/db";
import { and, eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: noteId } = await params;

  const note = await db.query.notes.findFirst({
    where: eq(notes.id, noteId),
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const isOwner = note.ownerId === session.user.id;

  const currentUserCollaborator = await db.query.noteCollaborators.findFirst({
    where: and(
      eq(noteCollaborators.noteId, noteId),
      eq(noteCollaborators.userId, session.user.id),
    ),
  });

  if (!isOwner && !currentUserCollaborator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const owner = await db.query.users.findFirst({
    where: eq(users.id, note.ownerId),
  });

  const collaborators = await db.query.noteCollaborators.findMany({
    where: eq(noteCollaborators.noteId, noteId),
    with: {
      user: true,
    },
  });

  return NextResponse.json({
    owner: owner
      ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          role: "owner",
        }
      : null,

    collaborators: collaborators.map((collab) => ({
      id: collab.user.id,
      name: collab.user.name,
      email: collab.user.email,
      role: collab.role,
    })),
  });
}