import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { pgTable, serial, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

// Define the todos table schema
export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").default(false).notNull(),

  // AI-enhanced fields
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  priority: text("priority").$type<"high" | "medium" | "low">().default("medium").notNull(),
  dueDate: timestamp("due_date"),
  context: text("context"), // Original snippet from ramble
  aiGenerated: boolean("ai_generated").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Create the database instance
export const db = drizzle(sql);

// Export types for TypeScript
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
