import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  db,
  notePlacements,
  subjects,
  topics,
} from "@studyhub/db";
import { and, eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type MoveNoteBody = {
  topicId?: string | null;
};

export async function PATCH(
  req: Request,
  { params }: RouteContext,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const { id: noteId } = await params;

  let body: MoveNoteBody;

  try {
    body = (await req.json()) as MoveNoteBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  /*
   * topicId må enten være:
   * - string UUID
   * - null -> Unsorted
   */
  if (
    body.topicId !== null &&
    typeof body.topicId !== "string"
  ) {
    return NextResponse.json(
      {
        error: "topicId must be a string or null",
      },
      {
        status: 400,
      },
    );
  }

  /*
   * Find placement for netop denne bruger.
   *
   * Fordi notePlacements har primary key:
   * (noteId, userId)
   *
   * kan hver bruger organisere samme note forskelligt.
   */
  const placement = await db.query.notePlacements.findFirst({
    where: and(
      eq(notePlacements.noteId, noteId),
      eq(notePlacements.userId, userId),
    ),
  });

  if (!placement) {
    return NextResponse.json(
      {
        error: "Note placement not found",
      },
      {
        status: 404,
      },
    );
  }

  /*
   * null betyder "Unsorted".
   *
   * Her behøver vi ikke verificere noget topic.
   */
  if (body.topicId === null) {
    const [updatedPlacement] = await db
      .update(notePlacements)
      .set({
        topicId: null,
      })
      .where(
        and(
          eq(notePlacements.noteId, noteId),
          eq(notePlacements.userId, userId),
        ),
      )
      .returning();

    return NextResponse.json({
      success: true,
      placement: updatedPlacement,
    });
  }

  /*
   * Hvis topicId er sat, skal vi kontrollere:
   *
   * topic
   *   ↓
   * subject
   *   ↓
   * subject.ownerId === current user
   *
   * Så en bruger ikke kan flytte en note
   * ind i en anden brugers topic ved manuelt
   * at sende et UUID.
   */
  const destination = await db
    .select({
      topicId: topics.id,
      subjectId: subjects.id,
      subjectOwnerId: subjects.ownerId,
    })
    .from(topics)
    .innerJoin(
      subjects,
      eq(topics.subjectId, subjects.id),
    )
    .where(eq(topics.id, body.topicId))
    .limit(1);

  const target = destination[0];

  if (!target) {
    return NextResponse.json(
      {
        error: "Topic not found",
      },
      {
        status: 404,
      },
    );
  }

  if (target.subjectOwnerId !== userId) {
    return NextResponse.json(
      {
        error: "You do not have access to this topic",
      },
      {
        status: 403,
      },
    );
  }

  /*
   * Hvis noten allerede ligger i topic'et,
   * kan vi bare returnere success.
   */
  if (placement.topicId === body.topicId) {
    return NextResponse.json({
      success: true,
      unchanged: true,
      placement,
    });
  }

  const [updatedPlacement] = await db
    .update(notePlacements)
    .set({
      topicId: body.topicId,
    })
    .where(
      and(
        eq(notePlacements.noteId, noteId),
        eq(notePlacements.userId, userId),
      ),
    )
    .returning();

  return NextResponse.json({
    success: true,
    placement: updatedPlacement,
  });
}