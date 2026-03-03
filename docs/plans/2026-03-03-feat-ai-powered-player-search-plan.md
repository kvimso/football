---
title: AI-Powered Player Search
type: feat
status: active
date: 2026-03-03
---

# AI-Powered Player Search

## Overview

Add a natural language search bar to the player directory that uses Claude API to translate scout queries into structured database filters. Scouts type queries like "left-footed winger under 18, good at dribbling" or Georgian equivalents, and the system returns matching players with editable filter tags.

**Key principle:** Claude never sees player data. It only receives the scout's text and returns filter JSON. The API route builds the database query from those filters.

**Cost estimate:** ~$0.001-0.005 per search using Haiku. At 100 scouts x 10 searches/day = $3-15/month.

## Problem Statement / Motivation

Scouts currently filter players using manual dropdown filters (position, age, club, foot, stats). This works but requires:
- Knowing which filters to combine
- Multiple clicks to build a complex query
- No support for fuzzy/descriptive searches ("someone like Kvaratskhelia")

Natural language search lets scouts describe what they want conversationally, in English or Georgian, and get instant results.

## Proposed Solution

Two-session implementation:

- **Session 7**: API route + AI service + database migration (backend)
- **Session 8**: Search bar component + filter tags + page integration (frontend)

### Architecture

```
Scout types query → Frontend POST /api/players/ai-search
  → API validates request (Zod) + authenticates user + checks rate limit
  → Sends scout text to Claude API (Haiku)
  → Claude returns structured JSON filters
  → API validates response (Zod, strict mode)
  → Resolves club names to UUIDs if needed
  → Builds Supabase query from validated filters
  → Returns players + applied filters + result count
Frontend shows results in existing PlayerCard grid + editable AI filter tags
```

## Technical Approach

### Architectural Decisions

**1. Separate API route (not URL-param redirect)**
The player directory page is a server component driven by URL search params. The AI search uses a separate API route (`/api/players/ai-search`) that returns players directly, rather than converting AI filters to URL params and navigating.

Rationale:
- The AI search supports filter types not in the current URL param system (skill minimums: pace, shooting, dribbling, etc.)
- Avoids refactoring the existing filter system
- Keeps AI search self-contained — easy to disable or modify independently
- Filter tag removal re-queries the API (without Claude call), not the page

**2. Claude Haiku for cost efficiency**
This is a structured extraction task (NLP → JSON), not creative writing. Haiku is sufficient and ~10x cheaper than Sonnet. Fallback to Sonnet if quality proves insufficient.

**3. Database-backed search history (not localStorage)**
Enables cross-device access and future analytics. Max 4 entries per user, FIFO eviction.

**4. Rate limiting: 20 searches/hour per user**
Same database-count pattern as chat messages (`src/app/api/messages/route.ts`). Prevents cost blowouts.

**5. Feature flag: `NEXT_PUBLIC_AI_SEARCH_ENABLED`**
Gate the entire feature. When false, AI search bar is hidden, existing text search remains. Quick kill switch if costs spike.

### Key Corrections from Spec vs. Codebase

| Spec says | Codebase reality | Correction |
|-----------|-------------------|------------|
| `status: 'active' \| 'injured' \| 'transferred' \| 'inactive'` | `PlayerStatus = 'active' \| 'free_agent'` | Use actual DB enum |
| Raw `NextResponse.json()` for responses | `apiSuccess()` / `apiError()` from `api-utils.ts` | Use existing utilities |
| `createClient()` for API routes | `createApiClient(request)` supports Bearer + cookie auth | Use `createApiClient` |
| Manual auth check | `authenticateRequest(supabase)` returns `{ user, profile, error }` | Use existing helper |
| `player_skills` as single object | Returns as array from Supabase join | Access `player_skills[0]` or unwrap |
| Error messages as English strings | API errors use i18n keys (e.g., `'errors.notAuthenticated'`) | Use i18n keys |
| Need to add CSP for Anthropic | Server-side fetch, no CSP needed | Skip CSP changes |
| `ANTHROPIC_API_KEY` needs setup | Already exists in `.env.local` | Just install SDK |
| Model: `claude-sonnet-4-5-20250929` | Haiku sufficient for extraction | Use `claude-haiku-4-5-20251001` |

## System-Wide Impact

### Interaction Graph
- Scout submits search → API route authenticates → rate limit check → Claude API call → Supabase query → response
- No webhooks, no realtime subscriptions, no server actions — clean request/response cycle
- Search history INSERT fires after response (non-blocking)

### Error Propagation
- Claude API failure → catch → return `apiError('errors.aiSearchFailed', 500)` → frontend shows retry button
- Zod validation failure on Claude response → catch → return empty filters (show all players)
- Supabase query error → return `apiError('errors.serverError', 500)`
- Missing API key → return `apiError('errors.aiSearchUnavailable', 503)` → frontend hides search bar

### State Lifecycle Risks
- Search history cleanup (delete older entries) is fire-and-forget — if it fails, user just has >4 entries (harmless)
- No partial state risk — API returns complete response or error, no streaming

### API Surface Parity
- `/api/players/ai-search` POST — new endpoint, no existing equivalent
- `/api/players/ai-search/history` GET — new endpoint for search history
- Existing `/api/players` route unchanged — AI search is additive

### Integration Test Scenarios
1. Authenticated scout → AI search → receives filtered players with correct filter tags
2. Unauthenticated request → 401 error
3. Claude returns invalid JSON → empty filters, shows all active players
4. Rate limit exceeded → 429 error with i18n message
5. Georgian query → correct English enum values in filters

---

## Implementation Phases

### Session 7: API Route & Core Logic (~60-80K tokens)

#### Step 1: Install Anthropic SDK [x]

```bash
npm install @anthropic-ai/sdk
```

No `.env.local` changes needed — `ANTHROPIC_API_KEY` already exists.

#### Step 2: Create AI Search Types [x]

**File:** `src/lib/ai-search/types.ts`

Zod schema for Claude's response — strict mode to reject unknown keys:

```typescript
import { z } from 'zod';

export const AISearchFiltersSchema = z.object({
  // Player table filters
  position: z.enum(['GK', 'DEF', 'MID', 'ATT', 'WNG', 'ST']).optional(),
  preferred_foot: z.enum(['Left', 'Right', 'Both']).optional(),
  nationality: z.string().max(50).optional(),
  status: z.enum(['active', 'free_agent']).optional(),  // CORRECTED: actual DB enum

  // Age (calculated from date_of_birth)
  min_age: z.number().int().min(10).max(30).optional(),
  max_age: z.number().int().min(10).max(30).optional(),

  // Physical
  min_height_cm: z.number().int().min(140).max(210).optional(),
  max_height_cm: z.number().int().min(140).max(210).optional(),
  min_weight_kg: z.number().int().min(40).max(120).optional(),
  max_weight_kg: z.number().int().min(40).max(120).optional(),

  // Club filter (resolved to UUID server-side)
  club_name: z.string().max(100).optional(),

  // Player skills (1-100 ratings)
  min_pace: z.number().int().min(1).max(100).optional(),
  min_shooting: z.number().int().min(1).max(100).optional(),
  min_passing: z.number().int().min(1).max(100).optional(),
  min_dribbling: z.number().int().min(1).max(100).optional(),
  min_defending: z.number().int().min(1).max(100).optional(),
  min_physical: z.number().int().min(1).max(100).optional(),

  // Season stats filters
  min_goals: z.number().int().min(0).optional(),
  min_assists: z.number().int().min(0).optional(),
  min_matches_played: z.number().int().min(0).optional(),
  min_pass_accuracy: z.number().min(0).max(100).optional(),
  min_tackles: z.number().int().min(0).optional(),
  min_interceptions: z.number().int().min(0).optional(),
  min_clean_sheets: z.number().int().min(0).optional(),
  min_shots_on_target: z.number().int().min(0).optional(),

  // Sorting
  sort_by: z.enum([
    'goals', 'assists', 'pace', 'shooting', 'passing', 'dribbling',
    'defending', 'physical', 'pass_accuracy', 'height_cm', 'age',
    'matches_played', 'tackles', 'interceptions', 'clean_sheets',
    'minutes_played', 'sprints', 'distance_covered_km'
  ]).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
}).strict();  // IMPORTANT: rejects unknown keys — defense against prompt injection

export type AISearchFilters = z.infer<typeof AISearchFiltersSchema>;

export interface AISearchResponse {
  players: Array<Record<string, unknown>>;  // Player data from DB
  filters_applied: AISearchFilters;
  query_text: string;
  result_count: number;
}
```

#### Step 3: Create the Claude System Prompt [x]

**File:** `src/lib/ai-search/prompt.ts`

System prompt that maps NLP → JSON. Include:
- All valid filter fields with types and ranges
- Position aliases (English + Georgian)
- Quality word → threshold mapping ("good at X" → min_X: 70, etc.)
- Georgian football terms (positions, attributes, physical)
- Player style references (Kvaratskhelia → WNG, Left, pace 80, dribbling 85)
- Explicit instruction: return ONLY valid JSON, no markdown, no explanation
- Always use English enum values regardless of input language
- Include current date and season context
- If query is nonsense, return `{}`

Key Georgian mappings to include:
- Positions: მეკარე→GK, მცველი→DEF, ნახევარმცველი→MID, თავდამსხმელი→ATT, ფლანგი→WNG, ფორვარდი→ST
- Attributes: სწრაფი→pace, ძლიერი→physical, მარცხენა ფეხის→Left, მარჯვენა ფეხის→Right
- Physical: მაღალი→tall (min_height_cm), დაბალი→short (max_height_cm)

#### Step 4: Create the AI Search Service [x]

**File:** `src/lib/ai-search/service.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { AISearchFiltersSchema, type AISearchFilters } from './types';
import { AI_SEARCH_SYSTEM_PROMPT } from './prompt';

const anthropic = new Anthropic();  // reads ANTHROPIC_API_KEY from env automatically

export async function parseSearchQuery(query: string): Promise<AISearchFilters> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',  // Cheap + fast for structured extraction
    max_tokens: 500,
    system: AI_SEARCH_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: query }],
  });

  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  // Strip any markdown fencing Claude might add
  const cleanJson = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  const parsed = JSON.parse(cleanJson);
  return AISearchFiltersSchema.parse(parsed);  // Strict validation
}
```

Wrap the entire function body in try/catch — on any error (API failure, JSON parse error, Zod validation error), log the error and return `{}` (empty filters = show all players).

#### Step 5: Create the API Route [x]

**File:** `src/app/api/players/ai-search/route.ts`

Follow the modern API pattern from `api-utils.ts`:

```typescript
import { NextRequest } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';
import { authenticateRequest, apiSuccess, apiError } from '@/lib/api-utils';
import { parseSearchQuery } from '@/lib/ai-search/service';
import { z } from 'zod';

const RequestSchema = z.object({
  query: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  // 1. Auth
  const supabase = await createApiClient(request);
  const { user, error: authResponse } = await authenticateRequest(supabase);
  if (authResponse) return authResponse;

  // 2. Parse + validate request body
  const body = await request.json();  // wrap in try/catch
  const { query } = RequestSchema.parse(body);

  // 3. Rate limit check (20/hour)
  // Query ai_search_history count for this user in last hour

  // 4. Feature flag check
  // if (!process.env.NEXT_PUBLIC_AI_SEARCH_ENABLED) return apiError(...)

  // 5. Call Claude API
  const filters = await parseSearchQuery(query);

  // 6. Build Supabase query from filters
  // ... (detailed in implementation)

  // 7. Post-filter by skills and season stats
  // player_skills comes as array — use [0] to access first record

  // 8. Sort results

  // 9. Save to search history (fire-and-forget)

  // 10. Return results
  return apiSuccess({
    players: filteredPlayers,
    filters_applied: filters,
    query_text: query,
    result_count: filteredPlayers.length,
  });
}
```

**Critical implementation details:**

- Club name resolution: If `filters.club_name` is set, query `clubs` table with `.or('name.ilike.%...%,name_ka.ilike.%...%')` to get UUIDs, then use `.in('club_id', clubIds)`
- Age calculation: `max_age` → `minDOB = today - (max_age+1) years`, use `.gte('date_of_birth', minDOB)`
- `player_skills` is an **array** from the join — access `player.player_skills?.[0]` when filtering
- Use `escapePostgrestValue()` for any string values passed to `.ilike()` or `.or()` filters
- Default status filter: `.in('status', ['active', 'free_agent'])` unless filters.status is specified
- Limit results to 50 players

#### Step 6: Create Search History Migration [x]

**File:** Applied via Supabase MCP `apply_migration`

```sql
-- AI search history (stores recent queries per user)
create table public.ai_search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  query_text text not null,
  filters_applied jsonb not null default '{}',
  result_count int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_ai_search_history_user on public.ai_search_history(user_id, created_at desc);

alter table public.ai_search_history enable row level security;

-- Users can read their own history
create policy "Users can view own search history"
  on public.ai_search_history for select
  to authenticated
  using (user_id = auth.uid());

-- Users can insert their own history
create policy "Users can insert own search history"
  on public.ai_search_history for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can delete their own history
create policy "Users can delete own search history"
  on public.ai_search_history for delete
  to authenticated
  using (user_id = auth.uid());

-- Platform admins can read all (for analytics, future use)
create policy "Platform admins can view all search history"
  on public.ai_search_history for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'platform_admin'
    )
  );
```

#### Step 7: Create Search History GET Endpoint [x]

**File:** `src/app/api/players/ai-search/history/route.ts`

Returns last 4 search entries for the authenticated user. Uses `createApiClient`, `authenticateRequest`, `apiSuccess`/`apiError` pattern.

#### Step 8: Search History Cleanup in POST Handler [x]

After returning the search response, fire-and-forget:
1. Insert new history entry
2. Query entries for this user ordered by `created_at desc`
3. Delete any entries beyond the 4th (FIFO eviction)

#### Step 9: Regenerate Types + Build + Commit [x]

```bash
# After migration applied via MCP
npx supabase gen types typescript --project-id jodnjhqnoawsxigrxqgv > src/lib/database.types.ts
npm run build
```

Commit: `feat: AI search API route with Claude integration`

---

### Session 8: Frontend UI (~60-80K tokens)

#### Step 1: Add i18n Translations [x]

**File:** `src/lib/translations/players.ts`

Add to both `en` and `ka` objects under a new `aiSearch` namespace:

**English keys:**
- `players.aiSearch.placeholder` — "Describe the player you're looking for..."
- `players.aiSearch.button` — "Search"
- `players.aiSearch.searching` — "Searching..."
- `players.aiSearch.analyzing` — "Analyzing your search..."
- `players.aiSearch.label` — "AI Search"
- `players.aiSearch.clearAll` — "Clear all"
- `players.aiSearch.clear` — "Clear AI search"
- `players.aiSearch.noResults` — "No exact matches found"
- `players.aiSearch.noResultsHint` — "Try broader terms or adjust the filters below."
- `players.aiSearch.recentSearches` — "Recent searches"
- `players.aiSearch.playersFound` — "{count} players found"
- `players.aiSearch.timeout` — "Search took too long. Please try again."
- `players.aiSearch.error` — "Something went wrong. Please try again."
- `players.aiSearch.rateLimit` — "Too many searches. Please wait a moment."
- Filter tag labels: position, foot, age, height, weight, club, pace, shooting, passing, dribbling, defending, physical, goals, assists, matches, passAcc, tackles, interceptions, cleanSheets, sortedBy

**Georgian keys:** (corresponding translations for all above)

#### Step 2: Create AISearchBar Component [x]

**File:** `src/components/player/AISearchBar.tsx`

Client component (`'use client'`).

**UI Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  [icon]  "Describe the player you're looking for..."  [Search] │
└─────────────────────────────────────────────────────────┘
  Recent: [fast winger] [tall striker Dinamo]
```

**Props:**
```typescript
interface AISearchBarProps {
  onSearchResults: (players: Player[], filters: AISearchFilters) => void;
  onClearSearch: () => void;
  isSearching: boolean;
  onSearchStart: () => void;
}
```

**Behavior:**
- Text input with i18n placeholder
- Search button (or Enter key) triggers POST to `/api/players/ai-search`
- Loading state: spinner in button, input disabled
- Recent searches as clickable chips below input (fetched from GET `/api/players/ai-search/history`)
- Click history chip → populate input + trigger search
- Clear button (X) resets state and calls `onClearSearch()`
- AbortController for concurrent search cancellation — if new search starts, abort previous
- 10-second timeout with user-friendly error message
- `aria-label` on input, `aria-live="polite"` for result announcements

**Feature flag:** Component checks `process.env.NEXT_PUBLIC_AI_SEARCH_ENABLED`. If false, renders nothing.

#### Step 3: Create AIFilterTags Component [x]

**File:** `src/components/player/AIFilterTags.tsx`

Client component.

**UI Layout:**
```
AI Search:  [Position: WNG x] [Foot: Left x] [Age: <=18 x] [Dribbling: 70+ x]    [Clear all]
```

**Props:**
```typescript
interface AIFilterTagsProps {
  filters: AISearchFilters;
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}
```

**Behavior:**
- Renders one tag per non-null filter entry (skip `sort_by`, `sort_direction`)
- Each tag: human-readable label (i18n) + value + close button
- Close button removes that filter key → triggers re-query without Claude call
- "Clear all" link removes all AI filters → returns to normal mode
- Tags styled with purple/indigo background to distinguish from regular filters
- Filter-to-label utility function with i18n support

#### Step 4: Integrate into Player Directory Page [x]

**File:** `src/app/(platform)/players/page.tsx` + new client wrapper

The player directory page is a **server component**. The AI search requires client-side state. Integration approach:

1. Create a new client wrapper component `src/components/player/PlayerDirectoryClient.tsx`
2. The server component passes initial players, clubs, translations, and auth state as props
3. The client wrapper manages AI search state:
   - `aiResults: Player[] | null` — null = normal mode, array = AI mode
   - `aiFilters: AISearchFilters | null`
   - `isSearching: boolean`
4. In normal mode: renders existing FilterPanel + server-fetched players
5. In AI mode: renders AISearchBar + AIFilterTags + AI-fetched players
6. FilterPanel stays visible but visually dimmed/inactive during AI mode

**Two display modes:**
```typescript
const displayPlayers = aiResults !== null ? aiResults : serverPlayers;
```

**Filter tag removal flow:**
1. User clicks X on a filter tag
2. Remove that key from `aiFilters`
3. POST to `/api/players/ai-search/requery` with remaining filters (no Claude call)
4. Or: build client-side Supabase query with remaining filters
5. If no filters remain, exit AI mode

**Better approach for re-query:** Add a second endpoint or query param to the existing endpoint that accepts pre-built filters (skips Claude). This avoids needing a client-side Supabase instance for the query.

#### Step 5: Loading & Empty States [x]

**Loading (1-3 seconds):**
- Search button shows spinner
- Player grid shows 3-4 skeleton card placeholders
- "Analyzing your search..." text below search bar

**Zero results:**
```
┌──────────────────────────────────────┐
│     No exact matches found           │
│                                      │
│  Try broader terms or adjust the     │
│  filters below.                      │
│                                      │
│  [Clear AI search]                   │
└──────────────────────────────────────┘
```

**Error states:**
- Timeout (>10s): "Search took too long. Please try again." + retry button
- Server error (500): "Something went wrong. Please try again." + retry button
- Rate limit (429): "Too many searches. Please wait a moment."
- Feature disabled: AI search bar hidden entirely

#### Step 6: Accessibility [x]

- Search input: `aria-label={t('players.aiSearch.placeholder')}`
- Results region: `aria-live="polite"` announcing "{count} players found"
- Filter tags: each tag is a button with `aria-label="Remove {filter label}"`
- History dropdown: keyboard navigable with `role="listbox"`, `role="option"`
- Loading state: `aria-busy="true"` on results container

#### Step 7: Mobile Responsiveness [x]

- Search bar: full width, button stacks below input on narrow screens
- Filter tags: horizontal scroll on mobile (no wrapping)
- History chips: horizontal scroll, max 2 visible with scroll indicator

#### Step 8: Build + Commit [x]

```bash
npm run build
```

Commit: `feat: AI search bar UI with filter tags and history`

---

## Post-Implementation Tasks

After both sessions complete:

1. **Update CLAUDE.md:**
   - Add `ai_search_history` to core tables list
   - Add `@anthropic-ai/sdk` mention
   - Add `ANTHROPIC_API_KEY` and `NEXT_PUBLIC_AI_SEARCH_ENABLED` to env vars
   - Note AI search in completed features

2. **Add Vercel env vars:**
   - `ANTHROPIC_API_KEY` — from console.anthropic.com
   - `NEXT_PUBLIC_AI_SEARCH_ENABLED=true`

3. **Anthropic dashboard:**
   - Set monthly budget alert at $50 as safety net

---

## Acceptance Criteria

### Functional Requirements

- [ ] Scout can type natural language query in English and get filtered results
- [ ] Scout can type query in Georgian and get correct results
- [ ] Mixed English/Georgian queries work (e.g., "midfielder ტორპედოდან")
- [ ] Filter tags appear showing all applied AI filters
- [ ] Removing a filter tag re-queries without calling Claude
- [ ] "Clear all" returns to normal browse mode
- [ ] Search history shows last 4 queries as clickable chips
- [ ] Clicking history chip re-applies those filters (re-queries DB, not Claude)
- [ ] Results use existing PlayerCard component layout
- [ ] Empty query shows validation error (min 1 char)

### Non-Functional Requirements

- [ ] API responds within 5 seconds (Claude latency + DB query)
- [ ] Rate limited to 20 searches/hour per user
- [ ] Feature gated behind `NEXT_PUBLIC_AI_SEARCH_ENABLED`
- [ ] All strings use `t()` with both EN and KA translations
- [ ] Search button has disabled + loading states
- [ ] Mobile responsive (375px+)
- [ ] Accessible: aria labels, keyboard navigation, screen reader announcements
- [ ] No `any` types — full TypeScript

### Security Requirements

- [ ] Only authenticated users can search (401 for unauthenticated)
- [ ] Claude response validated with strict Zod schema (rejects unknown keys)
- [ ] API key never exposed to client (server-side only)
- [ ] String values sanitized with `escapePostgrestValue()` before DB queries
- [ ] Rate limiting prevents cost abuse
- [ ] RLS on `ai_search_history` — users see only own history

### Quality Gates

- [ ] `npm run build` passes with zero errors
- [ ] All error paths return proper i18n error keys
- [ ] Graceful degradation when API key missing (search bar hidden)
- [ ] Nonsense queries return empty filters (show all players, not crash)

---

## Dependencies & Prerequisites

- `@anthropic-ai/sdk` npm package (new dependency)
- `ANTHROPIC_API_KEY` already in `.env.local` (needs to be added to Vercel)
- Supabase migration for `ai_search_history` table
- No blockers on other features

## Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Claude returns inconsistent JSON | Medium | Strict Zod validation + fallback to empty filters |
| API costs spike from abuse | High | Rate limit (20/hr) + feature flag kill switch + Anthropic budget alert |
| Claude API latency >5s | Medium | 10s timeout + user-friendly error + retry button |
| Prompt injection via search input | Low | Zod strict mode rejects unknown keys; Claude only returns filter JSON |
| Georgian queries produce wrong filters | Medium | Extensive Georgian term mapping in system prompt + testing |
| `ANTHROPIC_API_KEY` expires in production | Medium | 503 error → frontend hides search bar → manual filters still work |

## Future Enhancements (not in this build)

- **Query caching:** In-memory LRU cache for identical queries (saves cost + latency)
- **Search suggestions:** Autocomplete hints as scout types
- **Search analytics:** Platform admin dashboard showing popular queries
- **Saved searches:** Bookmark a query, get notified when new players match
- **Voice search:** Mobile scouts speak their query
- **Camera stat filters:** When Phase 7 adds camera data, update system prompt + Zod schema

## Sources & References

### Internal References
- API route pattern: `src/lib/api-utils.ts` — `apiSuccess`, `apiError`, `authenticateRequest`
- Player directory page: `src/app/(platform)/players/page.tsx` — server component with URL-param filters
- Filter panel: `src/components/forms/FilterPanel.tsx` — client component, URL-param-driven
- Types: `src/lib/types.ts` — `Position`, `PlayerStatus`, `PreferredFoot`
- Translations: `src/lib/translations/players.ts` — player domain translations
- Validation patterns: `src/lib/validations.ts` — Zod schemas
- Rate limit pattern: `src/app/api/messages/route.ts:54-64` — DB-count rate limiting
- String sanitization: `src/lib/utils.ts` — `escapePostgrestValue()`

### Learnings Applied
- CSP: No changes needed (server-side API calls don't need CSP directives)
- RLS policies: Test from each role perspective (scout, academy_admin, platform_admin)
- i18n: Pass `t` through utilities, never hardcode strings
- Loading states: All action buttons must have disabled + loading states (CLAUDE.md rule)
- Error messages: Use i18n keys in API responses, not English strings
