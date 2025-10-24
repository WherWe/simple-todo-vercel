import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, usage } from "@/lib/db";
import { eq } from "drizzle-orm";

// GET /api/usage - Get usage statistics for the current user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create usage record for this user
    let userUsage = await db.select().from(usage).where(eq(usage.userId, userId)).limit(1);

    if (userUsage.length === 0) {
      // Create initial usage record
      const newUsage = await db
        .insert(usage)
        .values({
          userId,
          totalRequests: 0,
          extractRequests: 0,
          queryRequests: 0,
          anthropicRequests: 0,
          openaiRequests: 0,
        })
        .returning();

      return NextResponse.json({
        totalRequests: 0,
        extractRequests: 0,
        queryRequests: 0,
        anthropicRequests: 0,
        openaiRequests: 0,
        lastAnthropicModel: null,
        lastOpenaiModel: null,
        lastUpdated: newUsage[0].updatedAt,
      });
    }

    const stats = userUsage[0];
    return NextResponse.json({
      totalRequests: stats.totalRequests,
      extractRequests: stats.extractRequests,
      queryRequests: stats.queryRequests,
      anthropicRequests: stats.anthropicRequests,
      openaiRequests: stats.openaiRequests,
      lastAnthropicModel: stats.lastAnthropicModel,
      lastOpenaiModel: stats.lastOpenaiModel,
      lastUpdated: stats.updatedAt,
    });
  } catch (error: any) {
    console.error("Error fetching usage:", error);

    // Check if the error is due to missing table
    if (error?.message?.includes('relation "usage" does not exist') || error?.message?.includes("does not exist") || error?.code === "42P01") {
      return NextResponse.json({ error: "Database not initialized", needsSetup: true }, { status: 503 });
    }

    return NextResponse.json({ error: "Failed to fetch usage statistics" }, { status: 500 });
  }
}

// DELETE /api/usage - Reset usage statistics for the current user
export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reset all counters to 0
    await db
      .update(usage)
      .set({
        totalRequests: 0,
        extractRequests: 0,
        queryRequests: 0,
        anthropicRequests: 0,
        openaiRequests: 0,
        updatedAt: new Date(),
      })
      .where(eq(usage.userId, userId));

    return NextResponse.json({ message: "Usage statistics reset successfully" });
  } catch (error) {
    console.error("Error resetting usage:", error);
    return NextResponse.json({ error: "Failed to reset usage statistics" }, { status: 500 });
  }
}
