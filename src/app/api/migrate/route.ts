import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST() {
  try {
    console.log("Running migration to add model tracking columns...");

    // Add model tracking columns to existing usage table
    await sql`ALTER TABLE usage ADD COLUMN IF NOT EXISTS last_anthropic_model text;`;
    await sql`ALTER TABLE usage ADD COLUMN IF NOT EXISTS last_openai_model text;`;

    console.log("Migration complete!");
    return NextResponse.json({ message: "Migration complete!" });
  } catch (error) {
    console.error("Error running migration:", error);
    return NextResponse.json({ error: "Migration failed", details: error }, { status: 500 });
  }
}
