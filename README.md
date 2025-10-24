# todoish

An AI-powered task management app built with Next.js 16, TypeScript, Tailwind CSS 4, and PostgreSQL. Features intelligent task extraction, natural language queries, and smart scheduling - deployed on Vercel.

## ✨ Features

### Core Todo Management

- ✅ Add, edit, and delete todos
- ✅ Mark todos as complete/incomplete
- ✅ Inline editing (click to edit)
- ✅ PostgreSQL database persistence (Neon)
- ✅ RESTful API endpoints
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript for type safety
- ✅ Real-time sync across devices
- ✅ Loading states and error handling

### 🔐 Multi-User Authentication (NEW!)

- 👤 **Secure Sign-In/Sign-Up**: Powered by Clerk authentication
- 🔒 **User Isolation**: Each user has their own private todo list
- 👥 **Multi-User Support**: Perfect for families, teams, or sharing with others
- 🎨 **Beautiful Auth UI**: Pre-built sign-in pages that match your app design
- ⚡ **Instant Protection**: All routes and API endpoints secured automatically
- 🚀 **Session Management**: Stay signed in across devices
- 🔐 **Password Security**: Industry-standard authentication with Clerk

### 🤖 AI-Powered Features

- 🎯 **Natural Language Todo Extraction**: Ramble, rant, or brain dump - AI extracts actionable todos
- 🏷️ **Smart Auto-Tagging**: Automatically categorizes todos (work, personal, urgent, health, etc.)
- 📊 **Priority Assignment**: AI determines task priority (high, medium, low)
- 📅 **Date Inference**: Extracts due dates from phrases like "tomorrow", "next week", "Friday"
- 🔄 **Dual AI Providers**: Uses Claude (Anthropic) with OpenAI GPT fallback
- ⚡ **Draft Queue System**: Type freely - todos queue instantly and process in background (FIFO)
- 🗂️ **Smart Date Grouping**: Organizes todos by Overdue, Today, Tomorrow, This Week, Later, No Due Date
- 🚀 **Optimistic UI**: Deletes happen instantly, rollback on failure for smooth UX
- 🎨 **Two-Column Layout**: Chat-style input on left, organized todos on right (desktop)
- 🔍 **Intelligent Query Detection**: Ask questions like "What's urgent?" - AI filters and highlights matching todos
- 💬 **Conversational Interface**: Natural language queries with AI-powered responses
- 🔎 **Advanced Search & Filters**: Live text search with quick filters for priority, tags, status, and dates
- ⌨️ **Keyboard Shortcuts**: Press `/` to focus search, `Esc` to clear all filters
- 🎨 **Search Highlighting**: Yellow highlight on matching text in todos
- 📊 **What's Ahead Summary**: Conversational AI-generated summary panel showing upcoming tasks at a glance

### 👤 User Profile & Personalization (NEW!)

- 🎯 **Personal Context**: Add age, gender, occupation to help AI understand you better
- 😴 **Sleep Schedule**: Track current & ideal wake/bed times for smart task scheduling
- ✍️ **Bio & Preferences**: Free-form context field for AI to learn your working style
- 🔒 **Privacy First**: All profile data is private and encrypted
- 🎨 **Beautiful UI**: Gradient-themed profile page matching app design
- 🚀 **Settings Integration**: Easy access from Settings page

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: Vercel Postgres (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Clerk (Multi-user auth with session management)
- **AI**: Anthropic Claude 3.5 Sonnet + OpenAI GPT-4o
- **Deployment**: Vercel
- **Version Control**: Git + GitHub

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- Vercel account (for deployment)
- PostgreSQL database (Neon recommended)

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/WherWe/simple-todo-vercel.git
cd simple-todo-vercel
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory (this file is **git-ignored** and will never be committed):

```env
# Clerk Authentication (Get from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Database (automatically set by Vercel in production)
POSTGRES_URL="your_postgres_connection_string"

# AI Provider API Keys (at least ONE is required for AI features)
ANTHROPIC_API_KEY="sk-ant-api03-..."  # Get from https://console.anthropic.com/
OPENAI_API_KEY="sk-..."                # Get from https://platform.openai.com/api-keys
```

**📋 Use the template**: Copy `.env.local.example` to `.env.local` and fill in your actual keys:

```bash
cp .env.local.example .env.local
# Then edit .env.local with your real API keys
```

**🔑 Getting API Keys:**

- **Clerk Authentication**: Sign up at [dashboard.clerk.com](https://dashboard.clerk.com/) (required for multi-user features)
  - Create a new application
  - Copy the publishable key (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
  - Copy the secret key (`CLERK_SECRET_KEY`)
- **Anthropic Claude**: Sign up at [console.anthropic.com](https://console.anthropic.com/) (recommended, tried first)
- **OpenAI GPT**: Sign up at [platform.openai.com](https://platform.openai.com/) (fallback option)
- You need at least ONE AI key configured for AI features to work

### 4. Initialize Database

Run the setup to create the database table:

```bash
# Option 1: Visit /setup page in your browser after starting dev server
# Option 2: Use the API endpoint
curl -X POST http://localhost:3000/api/setup
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤖 Using AI Features

### Intelligent Query Detection (NEW!)

The app automatically detects if you're asking a question or creating todos:

**Ask questions naturally:**

```
"What's urgent?"
"Show me work stuff"
"What's due next week?"
"What am I forgetting?"
```

**AI Response:**

- 🤖 Chat bubble appears with natural language answer
- 🎯 Matching todos are highlighted with blue ring
- 🌫️ Non-matching todos fade out (30% opacity)
- 🔍 Keywords shown as badges
- ⏱️ Auto-clears after 10 seconds (or click "Clear filter")

**Example:**

```
[You type]: "show me urgent tasks"
[AI responds]: "Here are your urgent tasks: Fix production bug and Client meeting prep."
[Visual]: Todos #1 and #3 highlighted, others faded
```

### Advanced Search & Filters (NEW!)

**Live Text Search:**

- Type in search bar to filter todos by text
- Yellow highlighting on matching terms
- Press `/` to focus search, `Esc` to clear all filters

**Quick Filter Chips:**

- **Priority**: High (red) / Medium (yellow) / Low (gray)
- **Tags**: Dynamically generated from your todos (#work, #personal, etc.)
- **Status**: All / Active / Completed
- **Date**: Overdue / Today / This Week

**Combined Filtering:**

- All filters work together (AND logic)
- AI query filter applied first, then manual filters
- Active filter indicator shows "X of Y todos"

### What's Ahead Summary (NEW!)

Conversational AI-generated summary panel appears below the chat input:

**Features:**

- 📊 **Narrative format**: Reads like a personal assistant telling you what's ahead
- 🎯 **Actual todo names**: Shows 2-3 specific items per section (not just counts)
- ⚠️ **Priority sections**: Overdue, Today, Tomorrow, This Week, Urgent
- 💬 **Friendly messages**: "Nothing scheduled! You're free to focus on other things"
- 🎨 **Bold formatting**: Section headers in **bold** for easy scanning
- 🔄 **Auto-updates**: Regenerates as you add/complete todos

**Example:**

```
What's Ahead

⚠️ 2 overdue items: Fix production bug, Call dentist...

📅 Today (2 tasks):
• Prepare for Shabbat
• Appointment with Alida at 11am

📆 Tomorrow (1 task):
• NB - call

🚨 Urgent: Fix production bug
```

### Draft Queue System

Just type and press Enter - your input is queued instantly and AI processes it in the background:

1. **Type your rambling text** in the input field (no need to wait)
2. **Press Enter** - Draft appears immediately in "Drafts" section
3. **Keep typing** - Add more drafts while AI processes the first one
4. **AI extracts in FIFO order** - Todos pop out one by one with animations
5. **Instant feedback** - Purple spinner shows processing status

**Example workflow:**

```
[You type]: "urgent client meeting prep tomorrow"
[Press Enter] → Draft queued instantly
[You type]: "also buy groceries and call dentist"
[Press Enter] → Second draft queued
[AI processes first] → Todos appear with tags/dates
[AI processes second] → More todos appear
```

### AI Todo Extraction

The app can intelligently extract todos from natural language rambling:

**Example input:**

```
I'm so stressed about the client meeting next week, need to prep the slides,
also gotta call mom back, oh and fix that bug in production ASAP,
and maybe grab groceries on Friday
```

**Click "✨ AI Extract"** and watch the magic:

- ✨ Input glows with purple ring
- 🤖 "AI is thinking..." indicator appears
- 📝 Todos pop out one by one with staggered animation
- 🏷️ Automatically tagged (work, personal, urgent, etc.)
- 📊 Priority assigned (high, medium, low)
- 📅 Due dates inferred from temporal references
- 💬 Original context preserved

**Result:**

1. ✅ "Prepare slides for client meeting" - #work #urgent - High - Due: Oct 28
2. ✅ "Call mom back" - #personal - Medium
3. ✅ "Fix bug in production ASAP" - #work #urgent - High
4. ✅ "Grab groceries" - #personal - Medium - Due: Oct 25

### Todo Display Features

AI-extracted todos show:

- **Purple left border** - Indicates AI-generated item
- **✨ Sparkle icon** - Visual indicator of AI extraction
- **Tag badges** - Color-coded categories (#work, #personal, etc.)
- **Priority badges** - Red for high, gray for low
- **Due dates** - Calendar icon with formatted date
- **Context quote** - Original text snippet in italics

### Manual vs AI

- **"Add" button** - Simple, single todo creation (traditional)
- **"✨ AI Extract" button** - Intelligent extraction from rambling text

## 🗂️ Project Structure

```
simple-todo-vercel/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── extract/    # 🤖 AI todo extraction
│   │   │   │   │   └── route.ts
│   │   │   │   └── query/      # 🔍 AI query detection
│   │   │   │       └── route.ts
│   │   │   ├── setup/          # Database initialization
│   │   │   ├── test-db/        # Database connection test
│   │   │   └── todos/          # CRUD API endpoints
│   │   │       ├── route.ts    # GET all, POST new
│   │   │       └── [id]/
│   │   │           └── route.ts # PUT update, DELETE
│   │   ├── setup/              # Setup page UI
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   └── TodoApp.tsx         # Main todo component (search, filters, query, summary)
│   └── lib/
│       └── db.ts               # Database schema & config (AI fields)
├── drizzle/                    # Database migrations
├── scripts/
│   └── setup-db.ts            # DB setup script
├── .env.local.example         # Environment variable template
├── drizzle.config.ts          # Drizzle ORM config
├── package.json
└── README.md
```

## 🔌 API Endpoints

### 🤖 AI Endpoints

- `POST /api/ai/extract` - Extract todos from natural language text

  ```json
  {
    "text": "I'm so stressed about the client meeting next week, need to prep the slides, also gotta call mom back, oh and fix that bug in production..."
  }
  ```

- `POST /api/ai/query` - Detect if input is a question and filter relevant todos
  ```json
  {
    "text": "what's urgent?",
    "todos": [
      { "id": 1, "text": "Fix production bug", "tags": ["work", "urgent"], "priority": "high", "completed": false },
      { "id": 2, "text": "Call mom", "tags": ["personal"], "priority": "medium", "completed": false }
    ]
  }
  ```
  **Response:**
  ```json
  {
    "isQuery": true,
    "intent": "find urgent tasks",
    "keywords": ["urgent", "high priority"],
    "response": "Here are your urgent tasks: Fix production bug.",
    "matchingTodoIds": [1]
  }
  ```
  **Response:**
  ```json
  {
    "success": true,
    "count": 3,
    "todos": [
      {
        "text": "Prepare slides for client meeting",
        "tags": ["work", "urgent"],
        "priority": "high",
        "dueDate": "2025-10-28",
        "context": "client meeting next week, need to prep the slides"
      },
      {
        "text": "Call mom back",
        "tags": ["personal"],
        "priority": "medium",
        "dueDate": null,
        "context": "gotta call mom back"
      },
      {
        "text": "Fix bug in production",
        "tags": ["work", "urgent"],
        "priority": "high",
        "dueDate": null,
        "context": "fix that bug in production"
      }
    ]
  }
  ```

### Todos

- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create a new todo
  ```json
  { "text": "Buy groceries" }
  ```
- `PUT /api/todos/[id]` - Update a todo
  ```json
  { "text": "Updated text", "completed": true }
  ```
- `DELETE /api/todos/[id]` - Delete a todo

### Database

- `POST /api/setup` - Initialize database tables
- `GET /api/test-db` - Test database connection

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database scripts
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## 🎨 SEO & Branding (Beta Ready!)

### Comprehensive SEO Setup

- ✅ **Meta Tags**: Title, description, keywords optimized for search engines
- ✅ **Open Graph**: Rich social media previews (Facebook, LinkedIn)
- ✅ **Twitter Cards**: Large image cards for Twitter sharing
- ✅ **Sitemap**: Auto-generated XML sitemap for Google/Bing
- ✅ **Robots.txt**: Search engine crawler configuration
- ✅ **PWA Manifest**: Installable as mobile/desktop app
- ✅ **Favicon System**: SVG icon ready (PNG variants pending)

### Generate Assets for Beta Launch

**Quick Start (5 minutes):**

1. **Generate OG Image** (for social sharing):

   - Visit `http://localhost:3000/generate-og-image.html`
   - Download the generated image
   - Save as `public/og-image.png`

2. **Generate Favicons**:

   - Upload `public/icon.svg` to [RealFaviconGenerator](https://realfavicongenerator.net/)
   - Download package and extract to `public/`

3. **Update Production URLs**:
   - Edit `src/app/layout.tsx`: Change `metadataBase` to your domain
   - Edit `src/app/sitemap.ts`: Update base URL
   - Edit `public/robots.txt`: Update sitemap URL

**📖 Full Guide**: See `docs/SEO_SETUP.md` for complete checklist

### SEO Testing Tools

Before launching, validate your setup:

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## 🚢 Deployment

### Automatic Deployment (Recommended)

1. **Connect to Vercel**:

   - Push code to GitHub
   - Import repository on [Vercel](https://vercel.com)
   - Vercel auto-detects Next.js and configures build

2. **Add Database**:

   - In Vercel dashboard: Storage → Create Database → Neon
   - Environment variables are automatically configured

3. **Initialize Database**:

   - Visit `your-app.vercel.app/setup`
   - Click "Setup Database" button

4. **Done!** 🎉
   - Every push to `main` automatically deploys
   - Preview deployments for pull requests

### Manual Deployment

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 🗄️ Database Schema

```typescript
todos {
  // Core fields
  id: serial (primary key)
  text: text (required)
  completed: boolean (default: false)

  // AI-enhanced fields
  tags: jsonb (array of strings, default: [])
  priority: text ("high" | "medium" | "low", default: "medium")
  dueDate: timestamp (nullable)
  context: text (original snippet from ramble, nullable)
  aiGenerated: boolean (default: false)

  // Timestamps
  createdAt: timestamp (auto)
  updatedAt: timestamp (auto)
}
```

## 🐛 Troubleshooting

### Database Connection Issues

1. Check `POSTGRES_URL` environment variable
2. Visit `/api/test-db` to test connection
3. Visit `/setup` to initialize tables

### White Text on White Background

Fixed with CSS override in `globals.css`:

```css
input[type="text"] {
  color: #000000 !important;
  background-color: #ffffff !important;
}
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## 🔒 Security & Environment Variables

### Local Development

- **`.env.local`** - Contains your actual API keys (git-ignored, **never committed**)
- **`.env.example`** - Template with placeholder values (committed to repo)

### Production (Vercel)

Add environment variables in Vercel dashboard:

1. Go to your project → Settings → Environment Variables
2. Add each key:
   - `POSTGRES_URL` (auto-set when you add Vercel Postgres)
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `DEFAULT_AI_PROVIDER`
   - `DEFAULT_AI_MODEL`

### ⚠️ NEVER Commit API Keys!

The `.gitignore` already excludes `.env*` files. Your keys are safe as long as you:

- ✅ Only put real keys in `.env.local`
- ✅ Use `.env.example` for documentation (fake keys only)
- ❌ Never hardcode keys in source files
- ❌ Never commit `.env.local` to Git

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Note**: When contributing, never include real API keys in your commits!

## 📝 License

MIT License - feel free to use this project however you'd like!

## 🔗 Links

- **Live Demo**: [https://simple-todo-vercel.vercel.app](https://simple-todo-vercel.vercel.app)
- **Repository**: [https://github.com/WherWe/simple-todo-vercel](https://github.com/WherWe/simple-todo-vercel)
- **Vercel**: [https://vercel.com](https://vercel.com)
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Drizzle ORM**: [https://orm.drizzle.team](https://orm.drizzle.team)

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [TypeScript](https://www.typescriptlang.org/docs)

---

Built with ❤️ using Next.js and Vercel

```
src/
├── app/
│   ├── page.tsx          # Main page component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
└── components/
    └── TodoApp.tsx       # Main todo application component
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: Browser localStorage

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - learn about TypeScript
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS
