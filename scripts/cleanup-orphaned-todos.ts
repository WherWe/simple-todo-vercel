/**
 * Migration script to clean up todos without userId
 * Run this once to remove todos created before authentication was added
 */

import { sql } from "@vercel/postgres";

async function cleanupOrphanedTodos() {
  try {
    console.log("Checking for todos without userId...");

    const result = await sql`
      DELETE FROM todos 
      WHERE user_id IS NULL OR user_id = ''
      RETURNING id, text
    `;

    console.log(`✅ Deleted ${result.rowCount} orphaned todos`);

    if (result.rows.length > 0) {
      console.log("\nDeleted todos:");
      result.rows.forEach((row) => {
        console.log(`  - ID ${row.id}: ${row.text}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

cleanupOrphanedTodos();
