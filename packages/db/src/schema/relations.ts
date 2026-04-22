import { relations } from "drizzle-orm";
import { users } from "./users";
import { subjects } from "./subjects";
import { topics } from "./topics";
import { notes } from "./notes";
import { noteCollaborators } from "./noteCollaborators";
import { notePlacements } from "./notePlacements";

export const usersRelations = relations(users, ({ many }) => ({
  subjects: many(subjects),
  ownedNotes: many(notes),
  noteCollaborations: many(noteCollaborators),
  notePlacements: many(notePlacements),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  owner: one(users, {
    fields: [subjects.ownerId],
    references: [users.id],
  }),
  topics: many(topics),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [topics.subjectId],
    references: [subjects.id],
  }),
  notePlacements: many(notePlacements),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  owner: one(users, {
    fields: [notes.ownerId],
    references: [users.id],
  }),
  collaborators: many(noteCollaborators),
  placements: many(notePlacements),
}));

export const noteCollaboratorsRelations = relations(noteCollaborators, ({ one }) => ({
  note: one(notes, {
    fields: [noteCollaborators.noteId],
    references: [notes.id],
  }),
  user: one(users, {
    fields: [noteCollaborators.userId],
    references: [users.id],
  }),
}));

export const notePlacementsRelations = relations(notePlacements, ({ one }) => ({
  note: one(notes, {
    fields: [notePlacements.noteId],
    references: [notes.id],
  }),
  user: one(users, {
    fields: [notePlacements.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [notePlacements.topicId],
    references: [topics.id],
  }),
}));