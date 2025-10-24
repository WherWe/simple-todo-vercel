import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { pgTable, serial, text, boolean, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

// Define the todos table schema
export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Clerk user ID
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

// Define the usage tracking table schema
export const usage = pgTable("usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // Clerk user ID

  totalRequests: integer("total_requests").default(0).notNull(),
  extractRequests: integer("extract_requests").default(0).notNull(),
  queryRequests: integer("query_requests").default(0).notNull(),
  anthropicRequests: integer("anthropic_requests").default(0).notNull(),
  openaiRequests: integer("openai_requests").default(0).notNull(),

  // Track most recently used models
  lastAnthropicModel: text("last_anthropic_model"),
  lastOpenaiModel: text("last_openai_model"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Create the database instance
export const db = drizzle(sql);

// Export types for TypeScript
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type Usage = typeof usage.$inferSelect;
export type NewUsage = typeof usage.$inferInsert;
