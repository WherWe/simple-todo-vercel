import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";

// Interface for extracted todo items
interface ExtractedTodo {
  text: string;
  tags: string[];
  priority: "high" | "medium" | "low";
  dueDate: string | null; // ISO string format
  context: string;
}

// System prompt for AI extraction
const SYSTEM_PROMPT = `You are an AI assistant that extracts actionable todo items from natural language text. 

Your task is to:
1. Extract individual, distinct todo items from rambling or unstructured text
2. Assign relevant tags (work, personal, urgent, home, health, finance, etc.)
3. Determine priority (high, medium, low) based on urgency indicators
4. Infer due dates from temporal references (tomorrow, next week, Friday, etc.)
5. Preserve context by noting the original snippet

Current date: ${new Date().toISOString().split("T")[0]}

Return ONLY valid JSON with this exact structure:
{
  "todos": [
    {
      "text": "Clear, actionable todo item",
      "tags": ["tag1", "tag2"],
      "priority": "high|medium|low",
      "dueDate": "YYYY-MM-DD" or null,
      "context": "Original snippet from input"
    }
  ]
}

Rules:
- Extract only actionable items (not observations or questions)
- Keep todo text concise but complete
- Use lowercase for tags
- Set dueDate to null if no temporal reference exists
- For "tomorrow", calculate from current date
- For "next week", use next Monday
- For specific days like "Friday", use the next upcoming Friday
- Priority: high = urgent/important, medium = normal, low = someday/maybe`;

// Try Anthropic Claude first
async function extractWithClaude(text: string): Promise<ExtractedTodo[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `${SYSTEM_PROMPT}\n\nExtract todos from this text:\n\n"${text}"`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const response = JSON.parse(content.text);
  return response.todos;
}

// Fallback to OpenAI GPT
async function extractWithOpenAI(text: string): Promise<ExtractedTodo[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Extract todos from this text:\n\n"${text}"`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const response = JSON.parse(content);
  return response.todos;
}

// Main extraction function with fallback logic
async function extractTodos(text: string): Promise<ExtractedTodo[]> {
  const errors: string[] = [];

  // Try Claude first
  try {
    console.log("Attempting extraction with Claude...");
    return await extractWithClaude(text);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Claude extraction failed:", errorMessage);
    errors.push(`Claude: ${errorMessage}`);
  }

  // Fallback to OpenAI
  try {
    console.log("Attempting extraction with OpenAI...");
    return await extractWithOpenAI(text);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("OpenAI extraction failed:", errorMessage);
    errors.push(`OpenAI: ${errorMessage}`);
  }

  // Both failed
  throw new Error(`All AI providers failed: ${errors.join("; ")}`);
}

// POST endpoint
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    // Validate input
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text input is required" }, { status: 400 });
    }

    // Extract todos using AI
    const extractedTodos = await extractTodos(text);

    // Return extracted todos
    return NextResponse.json({
      success: true,
      todos: extractedTodos,
      count: extractedTodos.length,
    });
  } catch (error) {
    console.error("Error in AI extraction:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to extract todos",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
