import { Server } from "@hocuspocus/server";
import * as Y from "yjs";
import { db, notes } from "@studyhub/db";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import path from "path";

/**
 * Load environment variables from root .env
 */
dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

/**
 * The document is saved 2 seconds after the latest change.
 * This prevents database writes on every single keystroke.
 */
const SAVE_DEBOUNCE_MS = 2000;

type PendingSave = {
  timer: NodeJS.Timeout | null;
  document: Y.Doc;
};

/**
 * Keeps track of documents waiting to be saved.
 * Each document room has its own debounce timer.
 */
const pendingSaves = new Map<string, PendingSave>();

/**
 * Saves the current Yjs document state to the database.
 */
async function saveDocument(documentName: string, document: Y.Doc) {
  const noteId = documentName.replace("note-", "");

  const update = Y.encodeStateAsUpdate(document);
  const base64State = Buffer.from(update).toString("base64");

  await db
    .update(notes)
    .set({
      ydocState: base64State,
      updatedAt: new Date(),
    })
    .where(eq(notes.id, noteId));

  console.log("💾 Saved document:", documentName);
}

/**
 * Schedules a debounced save.
 * If new changes happen before the timer finishes,
 * the old timer is cleared and restarted.
 */
function scheduleSave(documentName: string, document: Y.Doc) {
  const existing = pendingSaves.get(documentName);

  if (existing?.timer) {
    clearTimeout(existing.timer);
  }

  const timer = setTimeout(async () => {
    try {
      await saveDocument(documentName, document);
    } catch (error) {
      console.error("❌ Failed to save document:", documentName, error);
    } finally {
      pendingSaves.delete(documentName);
    }
  }, SAVE_DEBOUNCE_MS);

  pendingSaves.set(documentName, {
    timer,
    document,
  });
}

/**
 * Saves all pending documents immediately.
 * Used during graceful shutdown.
 */
async function flushPendingSaves() {
  const saves = Array.from(pendingSaves.entries());

  await Promise.all(
    saves.map(async ([documentName, pending]) => {
      if (pending.timer) {
        clearTimeout(pending.timer);
      }

      await saveDocument(documentName, pending.document);
    }),
  );

  pendingSaves.clear();
}

/**
 * Hocuspocus WebSocket server.
 * Each note is treated as its own collaborative document room.
 */
const server = new Server({
  port: 1234,

  /**
   * Loads persisted Yjs state when a note is opened.
   */
  async onLoadDocument({ documentName, document }) {
    const noteId = documentName.replace("note-", "");

    const note = await db.query.notes.findFirst({
      where: eq(notes.id, noteId),
    });

    if (!note?.ydocState) {
      return document;
    }

    try {
      const update = Buffer.from(note.ydocState, "base64");
      Y.applyUpdate(document, update);

      console.log("📥 Loaded document:", documentName);
    } catch (error) {
      console.error("⚠️ Invalid Yjs state:", documentName, error);
    }

    return document;
  },

  /**
   * Runs whenever the document changes.
   * The actual database write is debounced.
   */
  async onChange({ documentName, document }) {
    scheduleSave(documentName, document);
  },

  /**
   * Extra persistence hook from Hocuspocus.
   * Used as a fallback/final save.
   */
  async onStoreDocument({ documentName, document }) {
    await saveDocument(documentName, document);
  },

  async onConnect({ documentName }) {
    console.log("🟢 CONNECT:", documentName);
  },

  async onDisconnect({ documentName }) {
    console.log("🔴 DISCONNECT:", documentName);
  },
});

server.listen();

console.log("🚀 Hocuspocus server kører på ws://localhost:1234");

/**
 * Graceful shutdown.
 * Saves pending changes before the server closes.
 */
async function shutdown() {
  console.log("\n🛑 Shutting down...");

  try {
    await flushPendingSaves();
    await server.destroy();
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);