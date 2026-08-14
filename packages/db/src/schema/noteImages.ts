import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { notes } from "./notes";
import { users } from "./users";

export const noteImages = pgTable(
  "note_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, {
        onDelete: "cascade",
      }),

    /*
     * Nullable, så billedet ikke nødvendigvis slettes,
     * hvis brugerens konto senere slettes.
     */
    uploadedById: uuid("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),

    /*
     * Den permanente nøgle i R2.
     * Eksempel:
     * notes/<noteId>/<uuid>.png
     */
    storageKey: text("storage_key").notNull(),

    originalName: text("original_name").notNull(),

    mimeType: text("mime_type").notNull(),

    /*
     * Filstørrelse i bytes.
     */
    size: integer("size").notNull(),

    altText: text("alt_text").default("").notNull(),

    /*
     * Praktisk til rendering og layout.
     */
    width: integer("width"),

    height: integer("height"),

    deletedAt: timestamp("deleted_at", {
  withTimezone: true,
}), 

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("note_images_storage_key_unique").on(table.storageKey),
  ],
);