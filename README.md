# Simple Todo List App

A full-stack todo list application built with Next.js 16, TypeScript, Tailwind CSS 4, and PostgreSQL. Features a clean UI with database persistence and deployed on Vercel.

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

### 🤖 AI-Powered Features (NEW!)

- 🎯 **Natural Language Todo Extraction**: Ramble, rant, or brain dump - AI extracts actionable todos
- 🏷️ **Smart Auto-Tagging**: Automatically categorizes todos (work, personal, urgent, health, etc.)
- 📊 **Priority Assignment**: AI determines task priority (high, medium, low)
- 📅 **Date Inference**: Extracts due dates from phrases like "tomorrow", "next week", "Friday"
- 🔄 **Dual AI Providers**: Uses Claude (Anthropic) with OpenAI GPT fallback

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: Vercel Postgres (Neon)
- **ORM**: Drizzle ORM
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

- **Anthropic Claude**: Sign up at [console.anthropic.com](https://console.anthropic.com/) (recommended, tried first)
- **OpenAI GPT**: Sign up at [platform.openai.com](https://platform.openai.com/) (fallback option)
- You need at least ONE key configured for AI features to work

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
│   │   │   │   └── extract/    # 🤖 AI todo extraction
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
│   │   └── TodoApp.tsx         # Main todo component
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
