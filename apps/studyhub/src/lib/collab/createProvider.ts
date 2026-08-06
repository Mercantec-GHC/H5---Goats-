import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

const COLLAB_SERVER_URL =
  process.env.NEXT_PUBLIC_HOCUSPOCUS_URL ?? "ws://localhost:1234";

export function createProvider(noteId: string, doc: Y.Doc) {
  return new HocuspocusProvider({
    url: COLLAB_SERVER_URL,
    name: `note-${noteId}`,
    document: doc,
  });
}