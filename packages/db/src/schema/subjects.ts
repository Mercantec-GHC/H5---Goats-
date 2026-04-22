import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users";

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("subjects_owner_title_unique").on(table.ownerId, table.title),
  ]
);