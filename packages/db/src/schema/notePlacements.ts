import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { notes } from "./notes";
import { users } from "./users";
import { topics } from "./topics";

export const notePlacements = pgTable(
  "note_placements",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topicId: uuid("topic_id")
      .references(() => topics.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.noteId, table.userId] }),
  ]
);