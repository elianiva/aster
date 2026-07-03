import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  mission: text("mission").notNull(),
  currentKnowledge: text("current_knowledge").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const threads = sqliteTable("threads", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull().default(""),
  teachingMode: integer("teaching_mode", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  title: text("title").notNull(),
  r2Key: text("r2_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const records = sqliteTable("records", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  title: text("title").notNull(),
  r2Key: text("r2_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const references = sqliteTable("references", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  title: text("title").notNull(),
  r2Key: text("r2_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  r2Key: text("r2_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const glossary = sqliteTable("glossary", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  avoid: text("avoid"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const resources = sqliteTable("resources", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
  type: text("type", { enum: ["knowledge", "wisdom"] }).notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  annotation: text("annotation").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
