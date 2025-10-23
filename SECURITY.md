# Security Guidelines

## 🔒 API Key Management

### DO ✅

- Store API keys in `.env.local` (git-ignored)
- Use environment variables in code: `process.env.ANTHROPIC_API_KEY`
- Add keys to Vercel dashboard for production
- Use `.env.example` as a template (with fake keys)
- Rotate keys if accidentally exposed

### DON'T ❌

- **NEVER** commit `.env.local` to Git
- **NEVER** hardcode API keys in source files
- **NEVER** share your `.env.local` file
- **NEVER** include real keys in screenshots/issues
- **NEVER** log API keys to console

## 🛡️ Current Protection

Your repo is protected by:

1. **`.gitignore`** - Excludes all `.env*` files
2. **`.env.local`** - Local secrets (git-ignored)
3. **`.env.example`** - Public template (safe to commit)

## 🚨 If You Accidentally Commit a Key

1. **Immediately rotate the key** (invalidate the old one)

   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/settings/keys

2. **Remove from Git history**:

   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push** (⚠️ only if you haven't shared the repo yet):

   ```bash
   git push origin --force --all
   ```

4. **Better approach**: If repo is already shared, just rotate keys and move on.

## 📋 Pre-Push Checklist

Before pushing code:

- [ ] Check no `.env.local` in `git status`
- [ ] Search code for hardcoded keys: `grep -r "sk-" src/` (should be empty)
- [ ] Verify `.env.example` has only fake/placeholder keys
- [ ] Run `git diff` to review changes

## 🔐 Environment Variables Reference

```bash
# Required
POSTGRES_URL=          # Database connection (auto-set by Vercel)
ANTHROPIC_API_KEY=     # Claude API access
OPENAI_API_KEY=        # GPT API access

# Optional
DEFAULT_AI_PROVIDER=   # "anthropic" or "openai"
DEFAULT_AI_MODEL=      # Model identifier
FALLBACK_AI_MODEL=     # Backup model
```

## 📞 Contact

If you discover a security vulnerability, please email [your-email] instead of opening a public issue.
