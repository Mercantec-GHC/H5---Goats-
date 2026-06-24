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

/**
 * Dynamic route parameter:
 * /api/invites/[token]/accept
 */
type RouteContext = {
  params: Promise<{ token: string }>;
};

/**
 * POST /api/invites/[token]/accept
 *
 * Accepts an invite link and gives the current user
 * persistent access to the shared note.
 */
export async function POST(
  _req: Request,
  { params }: RouteContext,
) {
  /**
   * Get authenticated session
   */
  const session = await auth();

  /**
   * Only logged-in users can accept invitations
   */
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  /**
   * Extract invite token from the URL
   */
  const { token } = await params;

  /**
   * Find invite by token
   */
  const invite = await db.query.noteInvites.findFirst({
    where: eq(noteInvites.token, token),
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Invite not found" },
      { status: 404 },
    );
  }

  /**
   * Find the note connected to the invite
   */
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

  /**
   * If the owner opens their own invite,
   * no collaborator relation is needed.
   */
  if (note.ownerId === userId) {
    return NextResponse.json({
      noteId: note.id,
      message: "You already own this note",
    });
  }

  /**
   * Check if the user is already a collaborator
   * to avoid duplicate relations.
   */
  const existingCollaborator =
    await db.query.noteCollaborators.findFirst({
      where: and(
        eq(noteCollaborators.noteId, note.id),
        eq(noteCollaborators.userId, userId),
      ),
    });

  /**
   * Add user as collaborator if relation does not exist.
   * This controls access to the note.
   */
  if (!existingCollaborator) {
    await db.insert(noteCollaborators).values({
      noteId: note.id,
      userId,
      role: "editor",
    });
  }

  /**
   * Check if the note is already visible
   * in the user's workspace.
   */
  const existingPlacement =
    await db.query.notePlacements.findFirst({
      where: and(
        eq(notePlacements.noteId, note.id),
        eq(notePlacements.userId, userId),
      ),
    });

  /**
   * Add note to the user's workspace as unsorted.
   * This controls where the note appears in the UI.
   */
  if (!existingPlacement) {
    await db.insert(notePlacements).values({
      noteId: note.id,
      userId,
      topicId: null,
    });
  }

  /**
   * Return note id so frontend can redirect
   * the user to the shared note.
   */
  return NextResponse.json({
    noteId: note.id,
    success: true,
  });
}