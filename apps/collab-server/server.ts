
import { Server } from "@hocuspocus/server";
import * as Y from "yjs";
import { db, notes } from "@studyhub/db";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

const SAVE_DEBOUNCE_MS = 2000;

type PendingSave = {
  timer: NodeJS.Timeout | null;
  document: Y.Doc;
};

const pendingSaves = new Map<string, PendingSave>();

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

const server = new Server({
  port: 1234,

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

  async onChange({ documentName, document }) {
    scheduleSave(documentName, document);
  },

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