import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST() {
  try {
    console.log("Setting up database...");

    // Create the todos table
    await sql`
      CREATE TABLE IF NOT EXISTS todos (
        id serial PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        text text NOT NULL,
        completed boolean DEFAULT false NOT NULL,
        tags jsonb DEFAULT '[]'::jsonb NOT NULL,
        priority text DEFAULT 'medium' NOT NULL,
        due_date timestamp,
        context text,
        ai_generated boolean DEFAULT false NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    // Create the usage table
    await sql`
      CREATE TABLE IF NOT EXISTS usage (
        id serial PRIMARY KEY NOT NULL,
        user_id text NOT NULL UNIQUE,
        total_requests integer DEFAULT 0 NOT NULL,
        extract_requests integer DEFAULT 0 NOT NULL,
        query_requests integer DEFAULT 0 NOT NULL,
        anthropic_requests integer DEFAULT 0 NOT NULL,
        openai_requests integer DEFAULT 0 NOT NULL,
        last_anthropic_model text,
        last_openai_model text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    // Create the user_profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id serial PRIMARY KEY NOT NULL,
        user_id text NOT NULL UNIQUE,
        age integer,
        gender text,
        occupation text,
        current_wake_time text,
        ideal_wake_time text,
        current_bedtime text,
        ideal_bedtime text,
        bio text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);`;

    // Add model tracking columns if they don't exist (for existing tables)
    await sql`ALTER TABLE usage ADD COLUMN IF NOT EXISTS last_anthropic_model text;`;
    await sql`ALTER TABLE usage ADD COLUMN IF NOT EXISTS last_openai_model text;`;

    console.log("Database setup complete!");
    return NextResponse.json({ message: "Database setup complete!" });
  } catch (error) {
    console.error("Error setting up database:", error);
    return NextResponse.json({ error: "Failed to setup database", details: error }, { status: 500 });
  }
}
