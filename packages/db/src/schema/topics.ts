import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { subjects } from "./subjects";

export const topics = pgTable(
  "topics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("topics_subject_title_unique").on(table.subjectId, table.title),
  ]
);