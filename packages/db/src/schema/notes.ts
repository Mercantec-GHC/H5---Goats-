import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: text("title").notNull(),

  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});