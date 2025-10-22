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

### 2. Database Schema (Drizzle ORM)
- Schema in `src/lib/db.ts` uses Drizzle's `pgTable` - NOT Prisma or raw SQL strings
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
  createdAt: string;  // Note: API returns ISO string, not Date object
  updatedAt: string;
}
```

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
- `src/components/TodoApp.tsx` - Main UI component (inline editing, async operations)
- `drizzle.config.ts` - Drizzle config (uses `POSTGRES_URL` env var)

## Environment Variables

- `POSTGRES_URL` - Required. Set by Vercel when Neon database is connected to project
- No `.env.local` needed for deployed environments (Vercel injects vars automatically)

## Common Gotchas

1. **Inline styles over Tailwind**: Inputs use `text-black bg-white` classes + CSS override due to dark mode conflict
2. **API error handling**: Check for table existence errors (`relation "todos" does not exist`) → return 503 with `needsSetup: true`
3. **Timestamps**: Database stores `timestamp`, API returns ISO strings, frontend displays as-is (no Date parsing needed for display)
4. **Auto-deployment**: Don't run `npx vercel --prod` manually - Git push triggers Vercel build automatically
