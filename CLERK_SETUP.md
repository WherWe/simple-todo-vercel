# 🔐 Clerk Authentication Setup Guide

## Quick Start

### 1. Create a Clerk Account

1. Go to [https://dashboard.clerk.com/sign-up](https://dashboard.clerk.com/sign-up)
2. Create a free account (10k MAU free tier)
3. Create a new application (choose "Next.js" as the framework)

### 2. Get Your API Keys

After creating your app, you'll see your keys on the dashboard:

- **Publishable Key**: `pk_test_...` (safe to expose in frontend)
- **Secret Key**: `sk_test_...` (keep private, server-side only)

### 3. Configure Environment Variables

#### Local Development (.env.local)

Create a `.env.local` file in the project root:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_here

# Database (from Vercel Postgres)
POSTGRES_URL=your_postgres_connection_string

# AI Providers (optional)
ANTHROPIC_API_KEY=sk-ant-your_key_here
OPENAI_API_KEY=sk-your_key_here
```

#### Vercel Deployment

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - (POSTGRES_URL should already exist from Vercel Postgres connection)
3. Click **Save**
4. Redeploy your app

### 4. Update Database Schema

After setting environment variables, run:

```bash
npm run db:push
```

This will add the `userId` column to your `todos` table.

### 5. Configure Clerk Dashboard

#### Sign-in/Sign-up URLs

In Clerk Dashboard → **Paths**:

- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`
- After sign-in URL: `/`
- After sign-up URL: `/`

#### Social Login (Optional)

In Clerk Dashboard → **User & Authentication** → **Social Connections**:

- Enable Google, GitHub, or other OAuth providers
- No additional code changes needed!

### 6. Test Multi-User Setup

1. Start your dev server: `npm run dev`
2. Visit `http://localhost:3000`
3. You'll be redirected to sign-in page
4. Create an account → you'll see your personal todo list
5. Open an incognito window → sign up with different email → separate todo list!

## Features Enabled

✅ **User Isolation**: Each user sees only their todos  
✅ **Secure API**: All `/api/todos/*` endpoints require authentication  
✅ **Beautiful UI**: Clerk's pre-built components match your design  
✅ **Social Login**: Add Google/GitHub/etc with one click  
✅ **User Profile**: Click avatar → manage profile, sign out

## Troubleshooting

### "Unauthorized" errors

- Check that both keys are set in environment variables
- Restart your dev server after adding `.env.local`
- Verify keys don't have extra quotes or spaces

### Database errors

- Make sure `POSTGRES_URL` is set
- Run `npm run db:push` to apply schema changes
- If table exists, you may need to manually add the `user_id` column

### Middleware not working

- Ensure `src/middleware.ts` exists
- Check that `matcher` config includes your routes
- Clear `.next` cache: `rm -rf .next && npm run dev`

## Production Checklist

- [ ] Add Clerk env vars to Vercel dashboard
- [ ] Run database migration (automatic on first deploy after schema change)
- [ ] Test sign-in flow in production
- [ ] Verify user isolation (create 2 test accounts)
- [ ] Configure sign-in appearance (optional, in Clerk Dashboard → Customization)

## Cost

- **Clerk Free Tier**: 10,000 monthly active users
- **Vercel Hobby**: Free (includes authentication features)
- **Perfect for**: Personal use, showing to family, small teams

---

**Need help?** Check [Clerk Docs](https://clerk.com/docs/quickstarts/nextjs) or [Vercel Docs](https://vercel.com/docs/storage/vercel-postgres)
