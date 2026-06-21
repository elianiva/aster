import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const threads = sqliteTable("threads", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  mission: text("mission").notNull(),
  currentKnowledge: text("current_knowledge").notNull(),
  threadCount: integer("thread_count").notNull().default(0),
  lessonCount: integer("lesson_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
