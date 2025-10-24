import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { trackUsage } from "@/lib/trackUsage";
import { selectQueryModel, validateQueryResults, isLowConfidence, MAX_ESCALATIONS_PER_REQUEST } from "@/lib/modelSelector";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, todos } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'text' field" }, { status: 400 });
    }

    if (!Array.isArray(todos)) {
      return NextResponse.json({ error: "Missing or invalid 'todos' array" }, { status: 400 });
    }

    console.log("Query detection for:", text);

    // Track escalations to prevent runaway costs
    let escalationCount = 0;

    // Intelligently select model based on complexity
    const modelSelection = selectQueryModel(text, todos);
    console.log(`Model selection: ${modelSelection.tier} tier - ${modelSelection.reason}`);
    console.log(`Selected models: Anthropic=${modelSelection.anthropicModel}, OpenAI=${modelSelection.openaiModel}`);

    // Check for API keys
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    console.log("Anthropic key available:", !!anthropicKey);
    console.log("OpenAI key available:", !!openaiKey);

    // Try Anthropic first, fallback to OpenAI
    let result;
    let usedTier = modelSelection.tier;

    if (anthropicKey) {
      console.log(`Using Anthropic for query detection (${modelSelection.anthropicModel})`);
      try {
        result = await detectWithAnthropic(text, todos, anthropicKey, modelSelection.anthropicModel);
        await trackUsage(userId, "query", "anthropic", modelSelection.anthropicModel);

        // Check for low confidence or suspicious results if we used fast model
        if (modelSelection.tier === "fast" && escalationCount < MAX_ESCALATIONS_PER_REQUEST) {
          const confidenceCheck = isLowConfidence(result);
          const validationCheck = validateQueryResults(result, text, todos);

          if (confidenceCheck.isLow || !validationCheck.isValid) {
            const escalationReason = confidenceCheck.reason || validationCheck.reason;
            console.log(`⚠️ ESCALATION: ${escalationReason}`);
            if (confidenceCheck.confidence !== undefined) {
              console.log(`   Original confidence: ${confidenceCheck.confidence.toFixed(2)}`);
            }
            escalationCount++;

            // Retry with advanced model
            const advancedModel = "claude-sonnet-4-5-20250929";
            result = await detectWithAnthropic(text, todos, anthropicKey, advancedModel);
            await trackUsage(userId, "query", "anthropic", advancedModel);
            usedTier = "advanced";
            console.log(`✅ Escalation complete - used advanced model`);
          }
        }
      } catch (err: any) {
        console.error("Anthropic failed, falling back to OpenAI:", err.message);
        if (openaiKey) {
          result = await detectWithOpenAI(text, todos, openaiKey, modelSelection.openaiModel);
          await trackUsage(userId, "query", "openai", modelSelection.openaiModel);
        } else {
          throw err;
        }
      }
    } else if (openaiKey) {
      console.log(`Using OpenAI for query detection (${modelSelection.openaiModel})`);
      result = await detectWithOpenAI(text, todos, openaiKey, modelSelection.openaiModel);
      await trackUsage(userId, "query", "openai", modelSelection.openaiModel);

      // Check for low confidence or suspicious results if we used fast model
      if (modelSelection.tier === "fast" && escalationCount < MAX_ESCALATIONS_PER_REQUEST) {
        const confidenceCheck = isLowConfidence(result);
        const validationCheck = validateQueryResults(result, text, todos);

        if (confidenceCheck.isLow || !validationCheck.isValid) {
          const escalationReason = confidenceCheck.reason || validationCheck.reason;
          console.log(`⚠️ ESCALATION: ${escalationReason}`);
          if (confidenceCheck.confidence !== undefined) {
            console.log(`   Original confidence: ${confidenceCheck.confidence.toFixed(2)}`);
          }
          escalationCount++;

          // Retry with advanced model
          const advancedModel = "gpt-4.1";
          result = await detectWithOpenAI(text, todos, openaiKey, advancedModel);
          await trackUsage(userId, "query", "openai", advancedModel);
          usedTier = "advanced";
          console.log(`✅ Escalation complete - used advanced model`);
        }
      }
    } else {
      return NextResponse.json({ error: "No AI provider configured" }, { status: 503 });
    }

    console.log("Query detection result:", result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Query detection error:", error);
    return NextResponse.json({ error: error.message || "Query detection failed" }, { status: 500 });
  }
}

async function detectWithAnthropic(text: string, todos: any[], apiKey: string, model: string) {
  const anthropic = new Anthropic({ apiKey });
  const prompt = `You are a smart todo assistant. Analyze this user input and determine if it's a QUERY/QUESTION about their todos, or if it's TODO CREATION input.

USER INPUT: "${text}"

CURRENT TODOS:
${todos.map((t) => `ID ${t.id}: ${t.text} [tags: ${t.tags?.join(", ") || "none"}] [priority: ${t.priority || "none"}] [due: ${t.dueDate || "none"}] [completed: ${t.completed}]`).join("\n")}

Respond in JSON format with ACTUAL todo IDs (not array indexes):
{
  "isQuery": boolean,
  "intent": "filter_by_tag" | "filter_by_priority" | "filter_by_date" | "filter_by_status" | "summarize" | "search" | "todo_creation",
  "keywords": ["word1", "word2"],
  "response": "A natural language answer to their query",
  "matchingTodoIds": [actual todo IDs here, e.g., 38, 34],
  "confidence": 0.95,
  "confidenceReason": "Clear intent with specific keywords"
}

IMPORTANT: 
- Use the actual todo IDs from "ID X:" in your matchingTodoIds array, NOT array positions.
- Include a confidence score (0-1) indicating how certain you are about this classification.
- Provide a brief reason for your confidence level.

Examples:
- "What's urgent?" → isQuery: true, intent: "filter_by_priority", keywords: ["urgent", "high"], response: "You have 3 urgent tasks...", matchingTodoIds: [actual IDs of urgent todos], confidence: 0.95, confidenceReason: "Clear priority filter request"
- "Show me work stuff" → isQuery: true, intent: "filter_by_tag", keywords: ["work"], response: "Here are your work todos...", matchingTodoIds: [actual IDs of work todos], confidence: 0.9, confidenceReason: "Specific tag filter"
- "What's next week?" → isQuery: true, intent: "filter_by_date", keywords: ["next week"], response: "You have 5 tasks next week...", matchingTodoIds: [actual IDs of next week todos], confidence: 0.85, confidenceReason: "Date range query"
- "buy groceries tomorrow" → isQuery: false, intent: "todo_creation", keywords: [], response: "", matchingTodoIds: [], confidence: 0.98, confidenceReason: "Clear action item with future date"`;

  const message = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in Claude response");
  }

  return JSON.parse(jsonMatch[0]);
}

async function detectWithOpenAI(text: string, todos: any[], apiKey: string, model: string) {
  const openai = new OpenAI({ apiKey });
  const prompt = `You are a smart todo assistant. Analyze this user input and determine if it's a QUERY/QUESTION about their todos, or if it's TODO CREATION input.

USER INPUT: "${text}"

CURRENT TODOS:
${todos.map((t) => `ID ${t.id}: ${t.text} [tags: ${t.tags?.join(", ") || "none"}] [priority: ${t.priority || "none"}] [due: ${t.dueDate || "none"}] [completed: ${t.completed}]`).join("\n")}

Respond in JSON format with ACTUAL todo IDs (not array indexes):
{
  "isQuery": boolean,
  "intent": "filter_by_tag" | "filter_by_priority" | "filter_by_date" | "filter_by_status" | "summarize" | "search" | "todo_creation",
  "keywords": ["word1", "word2"],
  "response": "A natural language answer to their query",
  "matchingTodoIds": [actual todo IDs here, e.g., 38, 34],
  "confidence": 0.95,
  "confidenceReason": "Clear intent with specific keywords"
}

IMPORTANT: 
- Use the actual todo IDs from "ID X:" in your matchingTodoIds array, NOT array positions.
- Include a confidence score (0-1) indicating how certain you are about this classification.
- Provide a brief reason for your confidence level.

Examples:
- "What's urgent?" → isQuery: true, intent: "filter_by_priority", keywords: ["urgent", "high"], response: "You have 3 urgent tasks...", matchingTodoIds: [actual IDs of urgent todos], confidence: 0.95, confidenceReason: "Clear priority filter request"
- "Show me work stuff" → isQuery: true, intent: "filter_by_tag", keywords: ["work"], response: "Here are your work todos...", matchingTodoIds: [actual IDs of work todos], confidence: 0.9, confidenceReason: "Specific tag filter"
- "What's next week?" → isQuery: true, intent: "filter_by_date", keywords: ["next week"], response: "You have 5 tasks next week...", matchingTodoIds: [actual IDs of next week todos], confidence: 0.85, confidenceReason: "Date range query"
- "buy groceries tomorrow" → isQuery: false, intent: "todo_creation", keywords: [], response: "", matchingTodoIds: [], confidence: 0.98, confidenceReason: "Clear action item with future date"`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return JSON.parse(content);
}
