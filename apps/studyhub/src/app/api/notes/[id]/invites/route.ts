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

/**
 * Dynamic route parameter:
 * /api/notes/[id]/invites
 */
type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Checks whether the user has access to the note.
 * Access is granted if the user is:
 * - the note owner
 * - or an existing collaborator
 */
async function hasAccess(noteId: string, userId: string) {
  /**
   * Find note by id
   */
  const note = await db.query.notes.findFirst({
    where: eq(notes.id, noteId),
  });

  if (!note) return false;

  /**
   * Owner always has access
   */
  if (note.ownerId === userId) {
    return true;
  }

  /**
   * Check collaborator access
   */
  const collaborator = await db.query.noteCollaborators.findFirst({
    where: and(
      eq(noteCollaborators.noteId, noteId),
      eq(noteCollaborators.userId, userId),
    ),
  });

  return !!collaborator;
}

/**
 * POST /api/notes/[id]/invites
 *
 * Creates a share/invite link for a note.
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
   * Reject unauthenticated users
   */
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  /**
   * Extract note id from route params
   */
  const { id: noteId } = await params;

  /**
   * Verify that the user has access to the note
   */
  const allowed = await hasAccess(noteId, session.user.id);

  if (!allowed) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 },
    );
  }

  /**
   * Generate secure random invite token
   */
  const token = crypto.randomBytes(32).toString("hex");

  /**
   * Store invite token in database
   */
  await db.insert(noteInvites).values({
    noteId,
    token,
    createdByUserId: session.user.id,
  });

  /**
   * Create full share URL
   */
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

  /**
   * Return generated invite link
   */
  return NextResponse.json({
    inviteUrl,
  });
}