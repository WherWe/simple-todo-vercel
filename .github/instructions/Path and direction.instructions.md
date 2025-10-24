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
2. ✅ Add AI extraction endpoint (`POST /api/ai/extract`) (DONE)
3. ✅ Update todo schema with new fields (DONE)
4. ✅ Build magical input experience with animations (DONE - Draft Queue + Staggered Animations)
5. ✅ Implement query detection and filtering (DONE - Smart query detection with AI responses)
6. ✅ Advanced search & quick filters (DONE - Live search + Priority/Tags/Status/Date filters)
7. ✅ Conversational summary panel (DONE - "What's Ahead" narrative with markdown parsing)
8. ✅ Intelligent model selection (DONE - Adaptive fast/advanced tier based on complexity)
9. ✅ SEO & Branding for Beta Launch (DONE - Meta tags, OG, Twitter Cards, favicons, manifest)
10. ✅ User Profile & Personalization (DONE - Age, gender, occupation, sleep schedule, bio)
11. 🎯 Add AI provider configuration UI (NEXT UP)

## Phase 2 Priorities (Polish & Power Features)

1. **Production Polish**:

   - Toast notifications for actions (delete, save, error)
   - Loading skeletons for todos while fetching
   - Mobile UX improvements (single-column layout, touch gestures)
   - Empty state illustrations and onboarding
   - Accessibility (keyboard navigation, ARIA labels, screen reader support)

2. **User Profile & Personalization** (DONE ✅):

   - ✅ **Personal Settings Page** (`/profile`):
     - ✅ Basic info: Age, gender (M/F/Other/Non-binary), occupation
     - ✅ Sleep schedule: Current wake time, ideal wake time, current bedtime, ideal bedtime
     - ✅ General bio/context field for AI to understand user better
     - ✅ Beautiful gradient UI matching brand design
     - ✅ Privacy notice and security messaging
   - ✅ **Database Schema** (`userProfiles` table):
     - ✅ `userId`, `age`, `gender`, `occupation`
     - ✅ `currentWakeTime`, `idealWakeTime`, `currentBedtime`, `idealBedtime`
     - ✅ `bio` (text field for general context)
     - ✅ Migration script: `npx tsx scripts/add-profiles-table.ts`
   - ✅ **API Endpoints**:
     - ✅ GET `/api/profile` - Fetch user profile
     - ✅ POST `/api/profile` - Create new profile
     - ✅ PUT `/api/profile` - Update existing profile
     - ✅ DELETE `/api/profile` - Delete profile
   - ✅ **Settings Integration**: Card link from Settings page to Profile
   - 🎯 **Next**: Use profile data in AI prompts for personalized suggestions
   - 🔮 **Future**: Location settings (home/work addresses for commute calculations)

3. **Smart Scheduling with Location** (Future):

   - Google Maps API integration for travel time calculations
   - Auto-suggest departure times for appointments based on home/work location
   - Traffic-aware notifications ("Leave now to make your 2pm meeting")
   - Commute-aware task scheduling ("Do this before leaving for work")

4. **Advanced AI Features**:

   - Smart scheduling suggestions using profile data ("This might be easier in the morning based on your schedule")
   - Recurring todos detection ("every week" → auto-create recurring pattern)
   - Context-aware suggestions ("You have 3 work tasks due today, want to prioritize?")
   - Natural language todo editing ("move dentist to Friday")

5. **AI Provider UI**:

   - Settings/preferences page
   - Select preferred AI provider (Anthropic/OpenAI)
   - API key status indicators (valid/invalid/missing)
   - Cost tracking (tokens used, estimated monthly cost)
   - Rate limiting configuration

6. **Performance & Scale**:
   - Pagination for large todo lists (100+ items)
   - Virtual scrolling for smooth performance
   - Optimistic updates for all mutations
   - Local storage backup (offline-first mode)

## Future Enhancements Roadmap

### Personal Context Engine

- Profile-aware AI prompts: Pass user context (age, occupation, schedule) to AI for better suggestions
- Chronotype optimization: Suggest task times based on when user is most productive (morning/night person)
- Work-life balance tracking: Analyze ratio of work vs personal tasks, suggest breaks

### Location Intelligence

- **Google Maps Platform APIs needed**:
  - Directions API (travel time calculations)
  - Distance Matrix API (batch travel time queries)
  - Geocoding API (address validation)
- **Environment variables**: `GOOGLE_MAPS_API_KEY`
- **Privacy**: Encrypt address data at rest, only decrypt for API calls
- **Features**:
  - "Leave by" notifications for appointments
  - Traffic-based rescheduling suggestions
  - Nearby task clustering ("You have errands near work, do them on your commute?")

## Lessons Learned

### AI Query Detection

- **ID Matching Bug**: AI models confuse array indexes with database IDs when shown numbered lists. Always show `ID ${t.id}:` format in prompts.
- **Timer Management**: React state timers need cleanup. Store timer reference, clear before setting new, cleanup on unmount.
- **Filter Priority**: Apply AI query filter FIRST in cascade, before manual filters. Query is the "initial context" for further refinement.

### Search & Filters

- **Combined AND Logic**: All filters work together. User expects "High priority + Work tag + Overdue" to narrow down, not broaden.
- **Live Search**: No debounce needed for small lists (<1000 items). Instant feedback is better UX.
- **Visual Feedback**: Highlight what matches (yellow for search, blue ring for query), fade what doesn't. Clear > subtle.

### Conversational Summary

- **Narrative > Stats**: Users want "You have dentist today at 2pm" not "1 personal task, medium priority, due today".
- **Show Names, Not Counts**: First 2-3 actual todo names per section, then "...". Gives immediate context without clutter.
- **Friendly Empty States**: "Nothing scheduled!" feels better than "0 todos".

### React State Patterns

- **Cascade Dependencies**: `useEffect([drafts.length, isProcessing])` triggers correctly, `[drafts]` causes re-render loops.
- **Set for IDs**: Use `Set<number>` for filtered IDs - O(1) lookup vs array search.
- **Cleanup Everything**: Timers, listeners, subscriptions - assume unmount happens anytime.

### Intelligent Model Selection

- **Fast by default**: 80% of requests use cheap models (Haiku 4.5 / o4-mini) - simple, short inputs.
- **Escalation triggers**: Long input, complex dates, multiple constraints, summarization, ambiguity.
- **Cost-aware**: System automatically balances quality vs cost based on actual complexity.
- **Observability**: Server logs show tier selection reason for debugging and optimization.

## 📝 Documentation Requirements (CRITICAL)

**Auto-Update Rule**: Whenever you complete a feature or make significant changes:

1. **Update README.md**:

   - Add/update feature descriptions in the "Features" section
   - Update usage examples if UX changed
   - Add new API endpoints to the API section
   - Update tech stack if new dependencies added

2. **Update .github/copilot-instructions.md**:

   - Add new patterns (state management, API patterns, etc.)
   - Document critical implementation details
   - Update TypeScript interfaces if schema changed
   - Add gotchas and debugging tips

3. **Update Path and direction.instructions.md**:
   - Mark features as ✅ DONE or 🎯 IN PROGRESS
   - Add lessons learned or design decisions
   - Update priorities if project direction shifts

**Documentation triggers** (always update docs after):

- Completing a todo list item
- Adding new API endpoints
- Changing database schema
- Implementing new UX patterns
- Fixing critical bugs (add to gotchas)
- Adding new dependencies

**Goal**: Keep docs as a single source of truth - anyone (including future you or AI assistants) should understand the app just from reading the docs.

---

**Remember**: The magic is in making complexity feel simple. User rambles → AI organizes → User feels relieved.
