import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";

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

    // Check for API keys
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    console.log("Anthropic key available:", !!anthropicKey);
    console.log("OpenAI key available:", !!openaiKey);

    // Try Anthropic first, fallback to OpenAI
    let result;
    if (anthropicKey) {
      console.log("Using Anthropic for query detection");
      try {
        result = await detectWithAnthropic(text, todos, anthropicKey);
      } catch (err: any) {
        console.error("Anthropic failed, falling back to OpenAI:", err.message);
        if (openaiKey) {
          result = await detectWithOpenAI(text, todos, openaiKey);
        } else {
          throw err;
        }
      }
    } else if (openaiKey) {
      console.log("Using OpenAI for query detection");
      result = await detectWithOpenAI(text, todos, openaiKey);
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

async function detectWithAnthropic(text: string, todos: any[], apiKey: string) {
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
  "matchingTodoIds": [actual todo IDs here, e.g., 38, 34]
}

IMPORTANT: Use the actual todo IDs from "ID X:" in your matchingTodoIds array, NOT array positions.

Examples:
- "What's urgent?" → isQuery: true, intent: "filter_by_priority", keywords: ["urgent", "high"], response: "You have 3 urgent tasks...", matchingTodoIds: [actual IDs of urgent todos]
- "Show me work stuff" → isQuery: true, intent: "filter_by_tag", keywords: ["work"], response: "Here are your work todos...", matchingTodoIds: [actual IDs of work todos]
- "What's next week?" → isQuery: true, intent: "filter_by_date", keywords: ["next week"], response: "You have 5 tasks next week...", matchingTodoIds: [actual IDs of next week todos]
- "buy groceries tomorrow" → isQuery: false, intent: "todo_creation", keywords: [], response: "", matchingTodoIds: []`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
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

async function detectWithOpenAI(text: string, todos: any[], apiKey: string) {
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
  "matchingTodoIds": [actual todo IDs here, e.g., 38, 34]
}

IMPORTANT: Use the actual todo IDs from "ID X:" in your matchingTodoIds array, NOT array positions.

Examples:
- "What's urgent?" → isQuery: true, intent: "filter_by_priority", keywords: ["urgent", "high"], response: "You have 3 urgent tasks...", matchingTodoIds: [actual IDs of urgent todos]
- "Show me work stuff" → isQuery: true, intent: "filter_by_tag", keywords: ["work"], response: "Here are your work todos...", matchingTodoIds: [actual IDs of work todos]
- "What's next week?" → isQuery: true, intent: "filter_by_date", keywords: ["next week"], response: "You have 5 tasks next week...", matchingTodoIds: [actual IDs of next week todos]
- "buy groceries tomorrow" → isQuery: false, intent: "todo_creation", keywords: [], response: "", matchingTodoIds: []`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return JSON.parse(content);
}
