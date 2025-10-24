import { db, usage } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export type RequestType = "extract" | "query";
export type AIProvider = "anthropic" | "openai";

export async function trackUsage(userId: string, requestType: RequestType, provider: AIProvider, modelName?: string) {
  try {
    // Check if user has a usage record
    const existingUsage = await db.select().from(usage).where(eq(usage.userId, userId)).limit(1);

    const updateData: any = {
      totalRequests: 1,
      extractRequests: requestType === "extract" ? 1 : 0,
      queryRequests: requestType === "query" ? 1 : 0,
      anthropicRequests: provider === "anthropic" ? 1 : 0,
      openaiRequests: provider === "openai" ? 1 : 0,
    };

    // Store the model name if provided
    if (modelName) {
      if (provider === "anthropic") {
        updateData.lastAnthropicModel = modelName;
      } else if (provider === "openai") {
        updateData.lastOpenaiModel = modelName;
      }
    }

    if (existingUsage.length === 0) {
      // Create new usage record
      await db.insert(usage).values({
        userId,
        ...updateData,
      });
    } else {
      // Update existing usage record
      const setClause: any = {
        totalRequests: sql`${usage.totalRequests} + 1`,
        extractRequests: requestType === "extract" ? sql`${usage.extractRequests} + 1` : usage.extractRequests,
        queryRequests: requestType === "query" ? sql`${usage.queryRequests} + 1` : usage.queryRequests,
        anthropicRequests: provider === "anthropic" ? sql`${usage.anthropicRequests} + 1` : usage.anthropicRequests,
        openaiRequests: provider === "openai" ? sql`${usage.openaiRequests} + 1` : usage.openaiRequests,
        updatedAt: new Date(),
      };

      // Update model name if provided
      if (modelName) {
        if (provider === "anthropic") {
          setClause.lastAnthropicModel = modelName;
        } else if (provider === "openai") {
          setClause.lastOpenaiModel = modelName;
        }
      }

      await db.update(usage).set(setClause).where(eq(usage.userId, userId));
    }
  } catch (error) {
    console.error("Error tracking usage:", error);
    // Don't throw - usage tracking shouldn't break the main functionality
  }
}
