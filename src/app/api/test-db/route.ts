import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    // Test basic database connection
    const result = await sql`SELECT version()`;

    // Check if todos table exists
    let tableExists = false;
    try {
      await sql`SELECT 1 FROM todos LIMIT 1`;
      tableExists = true;
    } catch (e) {
      tableExists = false;
    }

    return NextResponse.json({
      status: "success",
      database: {
        connected: true,
        version: result.rows[0].version,
        todosTableExists: tableExists,
      },
      environment: {
        hasStorageUrl: !!process.env.STORAGE_URL,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error("Database test failed:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        environment: {
          hasStorageUrl: !!process.env.STORAGE_URL,
          hasPostgresUrl: !!process.env.POSTGRES_URL,
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 500 }
    );
  }
}
