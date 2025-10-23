import { NextRequest, NextResponse } from "next/server";
import { db, todos } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

// GET /api/todos - Get all todos for the current user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allTodos = await db.select().from(todos).where(eq(todos.userId, userId)).orderBy(desc(todos.createdAt));

    return NextResponse.json(allTodos);
  } catch (error) {
    console.error("Error fetching todos:", error);

    // Check if it's a table doesn't exist error
    if (error instanceof Error && error.message.includes('relation "todos" does not exist')) {
      return NextResponse.json(
        {
          error: "Database not initialized. Please set up the database first.",
          needsSetup: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
  }
}

// POST /api/todos - Create a new todo for the current user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { text, tags, priority, dueDate, context, aiGenerated } = body;

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json({ error: "Text is required and must be a non-empty string" }, { status: 400 });
    }

    const newTodo = await db
      .insert(todos)
      .values({
        userId,
        text: text.trim(),
        completed: false,
        tags: tags || [],
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        context: context || null,
        aiGenerated: aiGenerated || false,
      })
      .returning();

    return NextResponse.json(newTodo[0], { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
