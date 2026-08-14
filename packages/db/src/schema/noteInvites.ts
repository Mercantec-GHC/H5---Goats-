import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { notes } from "./notes";
import { users } from "./users";

export const noteInvites = pgTable("note_invites", {
  id: uuid("id").defaultRandom().primaryKey(),

  noteId: uuid("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),

  token: text("token").notNull().unique(),

  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  expiresAt: timestamp("expires_at", { withTimezone: true }),
});