# 🚀 Multi-User Authentication Setup - Next Steps

## What We Just Did

✅ Installed Clerk authentication SDK  
✅ Added `userId` column to database schema  
✅ Protected all API routes with user authentication  
✅ Added sign-in/sign-up pages  
✅ Added user profile button to the app header  
✅ Created middleware to protect all routes

## What You Need To Do Now

### Step 1: Get Clerk API Keys (5 minutes)

1. **Create Clerk Account**

   - Go to: https://dashboard.clerk.com/sign-up
   - Sign up (it's free - 10k users/month)

2. **Create Application**

   - Click "Add application"
   - Name it "Todo App" (or whatever you like)
   - Select "Next.js" as framework
   - Click "Create Application"

3. **Copy Your Keys**
   - You'll see a screen with two keys:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_...`)
     - `CLERK_SECRET_KEY` (starts with `sk_test_...`)
   - Keep this tab open!

### Step 2: Add Keys to Your Project

Open `.env.local` and paste your keys:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_here
```

**Important:** Replace the empty values with your actual keys from Clerk dashboard!

### Step 3: Update Database Schema

Run this command to add the `userId` column to your database:

```bash
npm run db:push
```

This will apply the schema changes to your Neon/Vercel Postgres database.

### Step 4: Restart Dev Server

Stop your current dev server (Ctrl+C) and restart:

```bash
npm run dev
```

### Step 5: Test It Out! 🎉

1. Visit `http://localhost:3000`
2. You'll be redirected to a sign-in page
3. Click "Sign up" and create your account
4. After signing in, you'll see your personal todo list with the user avatar in the top-right!

### Step 6: Test Multi-User Isolation

1. Open an **incognito/private window**
2. Go to `http://localhost:3000`
3. Sign up with a **different email** (you can use your wife's email or a test email)
4. Add some todos
5. Switch back to your original window → you should only see YOUR todos!

## For Vercel Deployment

When you're ready to deploy, add these to Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from Clerk dashboard)
   - `CLERK_SECRET_KEY` (from Clerk dashboard)
4. Redeploy: `git push origin main`

The database will automatically update on first deployment after schema changes.

## Features You Now Have

✨ **Separate User Accounts**: You and your wife each have your own todo lists  
🔐 **Secure Authentication**: No one can see each other's todos  
👤 **User Profile**: Click avatar to manage account/sign out  
📱 **Beautiful Sign-in**: Clerk's pre-built UI matches your app design  
🚀 **Social Login Ready**: Can add Google/GitHub login in Clerk dashboard with one click

## Optional: Configure Clerk Appearance

In Clerk Dashboard → **Customization**:

- Match your app's purple/blue color scheme
- Upload logo
- Customize text/labels

## Troubleshooting

**"Unauthorized" errors?**

- Make sure you filled in BOTH Clerk keys in `.env.local`
- Restart your dev server after adding keys
- Check for typos in the keys

**Database errors?**

- Run `npm run db:push` to apply schema
- Make sure `POSTGRES_URL` is set in `.env.local`

**Still seeing old todos?**

- Those were created without a `userId` - they'll cause errors now
- Either delete them manually or we can create a migration script

## Questions?

Check `CLERK_SETUP.md` for detailed troubleshooting or message me!

---

**Ready?** Get your keys from https://dashboard.clerk.com and let's test it out! 🚀
