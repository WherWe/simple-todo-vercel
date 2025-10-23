---
applyTo: "**"
---

# Project Vision: AI-Powered Conversational Todo System

## Core Concept

Transform the simple todo app into an **AI-powered task assistant** where users can naturally ramble, rant, and think out loud. The AI extracts actionable todos, categorizes them intelligently, and provides conversational assistance.

## Key Features to Build

### 1. Natural Language Input Processing

- **Input behavior**: Single input field accepts both:
  - **Rambling todo dumps**: "I'm so stressed about the client meeting next week, need to prep the slides, also gotta call mom back, oh and fix that bug in production..."
  - **Questions/queries**: "What do I have going on next week?", "Show me urgent items", "What's my work stuff?"
- **AI Detection**: Automatically determine if input is:
  - Todo creation (extract and categorize)
  - Query/question (filter + summarize)

### 2. Magical AI Extraction Experience

- **Visual feedback**: After hitting enter/submit:
  - Input field + todo list **glows** (subtle animation, maybe pulsing border)
  - Show "✨ AI is thinking..." indicator
  - Todos **magically pop out** one by one (staggered animation)
- **AI Extraction**: Process rambling text to:
  - Extract individual todo items
  - Auto-assign **tags** (work, personal, urgent, someday, etc.)
  - Auto-assign **priority** (high, medium, low)
  - Infer **dates** if mentioned ("next week", "tomorrow", "Friday")

### 3. Intelligent Filtering & Responses

- **Query handling**: When user asks questions:
  - Highlight/filter relevant todos (fade out non-matching items)
  - Show AI **summary/answer** in chat-like bubble above todo list
  - Examples:
    - "What's next week?" → Shows todos with next week dates + summary
    - "Work stuff?" → Filters to #work tag + lists them
    - "Am I forgetting anything?" → AI reviews and responds

### 4. Todo Schema Extensions

**New fields to add**:

- `tags: string[]` - Auto-generated categories (work, personal, urgent, home, health, etc.)
- `priority: 'high' | 'medium' | 'low'` - AI-assigned importance
- `dueDate: Date | null` - Extracted from natural language
- `context: string` - Original snippet from ramble (for reference)
- `aiGenerated: boolean` - Track which todos came from AI vs manual

### 5. AI Provider Setup

- **API Keys**: Support both Anthropic (Claude) and OpenAI (GPT)
  - Store in environment variables: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
  - UI to select preferred provider (settings/preferences)
  - Fallback logic if one provider fails
- **LLM Integration points**:
  - Extract todos from rambling text
  - Categorize and tag
  - Assign priority
  - Answer questions about todo list
  - Summarize and filter

## UX Goals

- **Effortless capture**: No friction between brain dump → organized todos
- **Delightful animations**: Make AI processing feel magical, not robotic
- **Conversational**: Feel like talking to an assistant, not filling forms
- **Smart context**: AI remembers what's in the list and provides relevant answers

## Technical Direction

- Keep Next.js 16 + PostgreSQL foundation
- Add AI provider SDK integration (Anthropic SDK, OpenAI SDK)
- Extend Drizzle schema for new fields (tags, priority, dueDate, context)
- Add streaming support for AI responses (progressive display)
- Consider rate limiting and cost management for API calls

## Phase 1 Priorities (MVP)

1. ✅ Basic todo CRUD (DONE)
2. 🎯 Add AI extraction endpoint (`POST /api/ai/extract`)
3. 🎯 Update todo schema with new fields
4. 🎯 Build magical input experience with animations
5. 🎯 Implement query detection and filtering
6. 🎯 Add AI provider configuration UI

---

**Remember**: The magic is in making complexity feel simple. User rambles → AI organizes → User feels relieved.
