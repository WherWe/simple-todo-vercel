import { NextRequest, NextResponse } from "next/server";
import { db, todos } from "@/lib/db";
import { eq } from "drizzle-orm";

// PUT /api/todos/[id] - Update a todo
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 });
    }

    const body = await request.json();
    const { text, completed } = body;

    // Build update object dynamically
    const updateData: any = { updatedAt: new Date() };
    if (text !== undefined) {
      if (typeof text !== "string" || text.trim() === "") {
        return NextResponse.json({ error: "Text must be a non-empty string" }, { status: 400 });
      }
      updateData.text = text.trim();
    }
    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return NextResponse.json({ error: "Completed must be a boolean" }, { status: 400 });
      }
      updateData.completed = completed;
    }

    const updatedTodos = await db.update(todos).set(updateData).where(eq(todos.id, id)).returning();

    if (updatedTodos.length === 0) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTodos[0]);
  } catch (error) {
    console.error("Error updating todo:", error);
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

// DELETE /api/todos/[id] - Delete a todo
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 });
    }

    const deletedTodos = await db.delete(todos).where(eq(todos.id, id)).returning();

    if (deletedTodos.length === 0) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
