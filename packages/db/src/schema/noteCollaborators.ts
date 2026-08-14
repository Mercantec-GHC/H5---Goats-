import { pgTable, uuid, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { notes } from "./notes";
import { users } from "./users";

export const noteCollaborators = pgTable(
  "note_collaborators",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    role: text("role").default("editor").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.noteId, table.userId] }),
  ]
);