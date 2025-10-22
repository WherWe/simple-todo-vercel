# Simple Todo List App

A full-stack todo list application built with Next.js 16, TypeScript, Tailwind CSS 4, and PostgreSQL. Features a clean UI with database persistence and deployed on Vercel.

## ✨ Features

- ✅ Add, edit, and delete todos
- ✅ Mark todos as complete/incomplete  
- ✅ Inline editing (click to edit)
- ✅ PostgreSQL database persistence (Neon)
- ✅ RESTful API endpoints
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript for type safety
- ✅ Real-time sync across devices
- ✅ Loading states and error handling

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: Vercel Postgres (Neon)
- **ORM**: Drizzle ORM
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

Create a `.env.local` file in the root directory:

```env
POSTGRES_URL="your_postgres_connection_string"
```

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

## 🗂️ Project Structure

```
simple-todo-vercel/
├── src/
│   ├── app/
│   │   ├── api/
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
│       └── db.ts               # Database schema & config
├── drizzle/                    # Database migrations
├── scripts/
│   └── setup-db.ts            # DB setup script
├── drizzle.config.ts          # Drizzle ORM config
├── package.json
└── README.md
```

## 🔌 API Endpoints

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
  id: serial (primary key)
  text: text (required)
  completed: boolean (default: false)
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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

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
