/**
 * Run this script to add the user_profiles table to your database
 * Usage: npx tsx scripts/add-profiles-table.ts
 */

import * as dotenv from "dotenv";
import { sql } from "@vercel/postgres";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function addProfilesTable() {
  try {
    console.log("🚀 Adding user_profiles table...");

    // Create the user_profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        
        age INTEGER,
        gender TEXT,
        occupation TEXT,
        
        current_wake_time TEXT,
        ideal_wake_time TEXT,
        current_bedtime TEXT,
        ideal_bedtime TEXT,
        
        bio TEXT,
        
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // Create index on user_id for faster lookups
    await sql`CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);`;

    console.log("✅ user_profiles table created successfully!");
    console.log("📊 You can now use the profile page at /profile");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating table:", error);
    process.exit(1);
  }
}

addProfilesTable();
