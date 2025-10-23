# Simple Todo List App - Copilot Instructions

Full-stack Next.js 16 todo app with PostgreSQL persistence via Vercel Postgres + Drizzle ORM.

## Architecture

**3-Layer Stack:**

- **Frontend**: `src/components/TodoApp.tsx` - Client component with React hooks for state management
- **API Layer**: `src/app/api/todos/*` - Next.js 16 App Router API routes (RESTful endpoints)
- **Database**: `src/lib/db.ts` - Drizzle ORM schema + Vercel Postgres connection

**Data Flow**: TodoApp → fetch(`/api/todos`) → Drizzle queries → Neon Postgres

## Critical Patterns

### 1. Next.js 16 App Router API Routes

- **Async params**: In `/api/todos/[id]/route.ts`, params are now `Promise<{ id: string }>` - must `await params` before use
- **Error responses**: Always return `NextResponse.json()` with appropriate status codes (503 for DB not initialized, 500 for errors)

### 2. Clerk Authentication (CRITICAL)

- **Multi-user isolation**: All todos are filtered by `userId` from Clerk's `auth()` helper
- **Middleware protection**: `src/middleware.ts` uses `clerkMiddleware` with `auth.protect()` to secure all routes except `/sign-in` and `/sign-up`
- **API authentication**: All `/api/todos/*` endpoints check `await auth()` and return 401 if no userId
- **User filtering**: Database queries use `.where(eq(todos.userId, userId))` to isolate user data
- **Sign-in pages**: Pre-built Clerk components at `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]`
- **User profile**: `UserButton` component in header shows avatar, sign-out option
- **Environment keys**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (public) and `CLERK_SECRET_KEY` (server-side only)

### 3. Database Schema (Drizzle ORM)

- Schema in `src/lib/db.ts` uses Drizzle's `pgTable` - NOT Prisma or raw SQL strings
- **User isolation field**: `userId: text("user_id").notNull()` - required on all todos
- Types auto-inferred: `Todo` from `todos.$inferSelect`, `NewTodo` from `todos.$inferInsert`
- Connection via `drizzle(sql)` where `sql` is `@vercel/postgres` client

### 3. Input Styling Issue (CRITICAL)

- Dark mode CSS (`@media (prefers-color-scheme: dark)`) causes white text on white inputs
- **Solution**: Global CSS override in `globals.css`: `input[type="text"] { color: #000000 !important; background-color: #ffffff !important; }`
- Always use `text-black bg-white` Tailwind classes on inputs to reinforce visibility

### 4. Database Initialization

- New deployments need table creation via `POST /api/setup` endpoint
- Frontend detects missing table (503 response with `needsSetup: true`) and shows setup button
- Dedicated UI at `/setup` page for manual initialization

### 5. TypeScript Todo Interface

```typescript
interface Todo {
  id: number;
  text: string;
  completed: boolean;

  // AI-enhanced fields
  tags: string[];
  priority: "high" | "medium" | "low";
  dueDate: string | null;
  context: string | null;
  aiGenerated: boolean;

  createdAt: string; // Note: API returns ISO string, not Date object
  updatedAt: string;
}

interface Draft {
  id: string; // client-generated UUID
  text: string;
  status: "queued" | "processing" | "error";
  error?: string;
  createdAt: string; // ISO timestamp
}
```

### 6. Draft Queue Pattern (CRITICAL)

- **FIFO Processing**: Drafts added via `enqueueDraftFromInput()` → queued → processed one at a time
- **useEffect trigger**: Watches `[drafts.length, isProcessingDraft]` - NOT the full drafts array (prevents missed triggers)
- **State flow**: User types → Enter → `setDrafts([new, ...prev])` → useEffect fires → `processNextDraft()` → AI extraction → save todos → remove draft
- **Optimistic UI**: Input always available, no blocking during AI processing
- **Staggered animation**: Extracted todos appear 250ms apart with `newTodoIds` Set for glow effect

### 7. Optimistic Delete Pattern

- **Instant removal**: `setTodos(prev => prev.filter(...))` before API call
- **Background deletion**: `fetch('/api/todos/${id}', {method: 'DELETE'})`
- **Rollback on error**: Re-insert todo at top with error message: `"Failed to delete "{text}". It has been restored."`
- **Auto-dismiss**: Error clears after 5 seconds

### 8. Date-Based Grouping

- **groupTodosByDate()**: Categorizes todos into: Overdue, Today, Tomorrow, This Week, Later, No Due Date
- **Collapsible sections**: Each group can expand/collapse independently
- **Sort order**: Overdue → Today → Tomorrow → This Week → Later → No Due Date

### 9. Query Detection Pattern (CRITICAL)

- **Smart input routing**: `enqueueDraftFromInput()` calls `/api/ai/query` FIRST to detect intent
- **Detection flow**:
  1. User types → Enter → Clear input immediately
  2. Call `/api/ai/query` with `{text, todos}`
  3. AI returns `{isQuery, intent, keywords, response, matchingTodoIds}`
  4. If `isQuery: true` → Execute query (show response bubble, filter todos)
  5. If `isQuery: false` → Queue as draft for todo extraction
- **Query state**: `activeQuery` (QueryResult | null), `filteredTodoIds` (Set<number>), `isQuerying` (boolean), `queryClearTimer` (NodeJS.Timeout | null)
- **Visual feedback**:
  - Blue gradient response bubble with robot emoji
  - Matching todos get `ring-2 ring-blue-400` highlight
  - Non-matching todos fade to `opacity-30`
  - Auto-clear after 10 seconds with timer cleanup
- **API endpoint**: `POST /api/ai/query` - Uses OpenAI GPT-4o (Anthropic fallback available)
- **Critical fix**: Prompt shows `ID ${t.id}:` instead of numbered list to prevent index/ID mismatch

### 10. Search & Filter Pattern (CRITICAL)

- **Multi-filter state**: `searchQuery`, `priorityFilter`, `tagFilter`, `statusFilter`, `dateFilter`
- **Filter cascade**: AI query filter → search text → priority → tags → status → date (AND logic)
- **getFilteredTodos()**: Single source of truth for filtered todo list
  1. If `activeQuery` exists: filter to `filteredTodoIds` Set first
  2. Apply search query (case-insensitive text match)
  3. Apply priority filter (exact match)
  4. Apply tag filter (array intersection)
  5. Apply status filter (completed boolean)
  6. Apply date filter (date range logic: overdue/today/this week)
- **Live search**: Updates on every keystroke, no debounce needed
- **Keyboard shortcuts**: `/` focuses search, `Esc` clears all filters
- **Search highlighting**: `highlightSearchTerm()` wraps matches in yellow `bg-yellow-200` spans
- **Active filter indicator**: Shows "X of Y todos" when filters active
- **Clear all**: Single button clears query timer + all filters

### 11. What's Ahead Summary Pattern (CRITICAL)

- **getSummary()**: Generates conversational narrative string describing upcoming todos
- **Summary structure**:
  - Overdue: ⚠️ "X overdue items: [names]..."
  - Today: 📅 "Today (X tasks): • [name] • [name]..."
  - Tomorrow: 📆 "Tomorrow (X task): [name]"
  - This Week: 🗓️ "This Week (X tasks): • [name] • [name]..."
  - Urgent: 🚨 "Urgent: [names]..."
  - Empty state: "Nothing scheduled! You're free to focus on other things"
- **Item limits**: Shows first 2-3 todos per section, adds "..." if more exist
- **Markdown parsing**: `parseSummaryText()` converts **bold** to `<strong>` tags
  - Splits on `\n`, wraps `**text**` in `<strong>` elements
  - Returns array of React nodes (strings + JSX)
- **Visual design**: Purple gradient panel below chat input with white text
- **Auto-updates**: Re-renders on every todo change (no separate state needed)

## Development Workflows

```bash
npm run dev           # Dev server on :3000
npm run build         # Test production build (catches type errors)
npm run db:push       # Push Drizzle schema to database
npm run db:studio     # Open Drizzle Studio for DB inspection
```

**Deployment**: Push to `main` branch → Vercel auto-deploys (Git integration configured, no manual `vercel` CLI needed)

## Key Files

- `src/lib/db.ts` - Database schema and connection (single source of truth for data structure)
- `src/app/api/todos/route.ts` - GET all todos, POST new todo
- `src/app/api/todos/[id]/route.ts` - PUT update, DELETE todo
- `src/app/api/ai/extract/route.ts` - AI todo extraction from rambling text
- `src/app/api/ai/query/route.ts` - AI query detection and filtering
- `src/components/TodoApp.tsx` - Main UI component (inline editing, async operations, query detection, search/filters, summary)
- `drizzle.config.ts` - Drizzle config (uses `POSTGRES_URL` env var)

## Environment Variables

- `POSTGRES_URL` - Required. Set by Vercel when Neon database is connected to project
- `ANTHROPIC_API_KEY` - Optional. For Claude AI features (tried first)
- `OPENAI_API_KEY` - Optional. For OpenAI GPT features (fallback)
- No `.env.local` needed for deployed environments (Vercel injects vars automatically)

## Common Gotchas

1. **Inline styles over Tailwind**: Inputs use `text-black bg-white` classes + CSS override due to dark mode conflict
2. **API error handling**: Check for table existence errors (`relation "todos" does not exist`) → return 503 with `needsSetup: true`
3. **Timestamps**: Database stores `timestamp`, API returns ISO strings, frontend displays as-is (no Date parsing needed for display)
4. **Auto-deployment**: Don't run `npx vercel --prod` manually - Git push triggers Vercel build automatically
5. **AI query ID matching**: Always show `ID ${t.id}:` in prompts, never numbered lists (prevents index/ID confusion)
6. **Timer cleanup**: Clear old `queryClearTimer` before setting new one, cleanup in useEffect unmount
7. **Filter cascade**: Apply AI query filter FIRST in `getFilteredTodos()`, then manual filters (search/priority/tags/status/date)
8. **Search highlighting**: Use `highlightSearchTerm()` to wrap matches in `<span className="bg-yellow-200">` - handles case-insensitive matching

- **Auto-updates**: Re-renders on every todo change (no separate state needed)
  - Matching todos get `ring-2 ring-blue-400` highlight
  - Non-matching todos fade to `opacity-30`
  - Auto-clear after 10 seconds
- **API endpoint**: `POST /api/ai/query` - Uses OpenAI GPT-4o (Anthropic fallback available)

## Development Workflows

```bash
npm run dev           # Dev server on :3000
npm run build         # Test production build (catches type errors)
npm run db:push       # Push Drizzle schema to database
npm run db:studio     # Open Drizzle Studio for DB inspection
```

**Deployment**: Push to `main` branch → Vercel auto-deploys (Git integration configured, no manual `vercel` CLI needed)

## Key Files

- `src/lib/db.ts` - Database schema and connection (single source of truth for data structure)
- `src/app/api/todos/route.ts` - GET all todos, POST new todo
- `src/app/api/todos/[id]/route.ts` - PUT update, DELETE todo
- `src/app/api/ai/extract/route.ts` - AI todo extraction from rambling text
- `src/app/api/ai/query/route.ts` - AI query detection and filtering (NEW)
- `src/components/TodoApp.tsx` - Main UI component (inline editing, async operations, query detection)
- `drizzle.config.ts` - Drizzle config (uses `POSTGRES_URL` env var)

## Environment Variables

- `POSTGRES_URL` - Required. Set by Vercel when Neon database is connected to project
- No `.env.local` needed for deployed environments (Vercel injects vars automatically)

## Common Gotchas

1. **Inline styles over Tailwind**: Inputs use `text-black bg-white` classes + CSS override due to dark mode conflict
2. **API error handling**: Check for table existence errors (`relation "todos" does not exist`) → return 503 with `needsSetup: true`
3. **Timestamps**: Database stores `timestamp`, API returns ISO strings, frontend displays as-is (no Date parsing needed for display)
4. **Auto-deployment**: Don't run `npx vercel --prod` manually - Git push triggers Vercel build automatically
