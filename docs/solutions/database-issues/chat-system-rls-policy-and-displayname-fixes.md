---
title: "Chat UI: RLS Policy Gap, DisplayName Logic, and Messenger-Style Polish"
date: "2026-03-01"
status: solved
severity: critical-to-low
category: database-issues
tags:
  - rls-policy
  - profiles-access
  - displayname-logic
  - bilingual-ordering
  - css-overflow
  - messenger-ui
  - navbar-centering
  - admin-dashboard
  - kebab-menu
affected_components:
  - supabase/migrations/20250101000031_fix_profiles_rls_for_chat.sql
  - src/lib/chat-queries.ts
  - src/lib/translations.ts
  - src/components/chat/ChatThread.tsx
  - src/components/chat/ChatInput.tsx
  - src/components/chat/ChatInbox.tsx
  - src/components/chat/MessageBubble.tsx
  - src/components/chat/DateDivider.tsx
  - src/components/layout/Navbar.tsx
  - src/app/admin/page.tsx
discovery_method: "User-reported bug (scout name showing blank/Unknown Scout in chat thread header)"
related_docs:
  - docs/solutions/security-issues/chat-system-code-review-fixes.md
  - docs/solutions/security-issues/comprehensive-audit-security-code-quality-fixes.md
  - docs/solutions/ui-bugs/chat-session-f-polish-reliability-accessibility.md
  - docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md
  - docs/solutions/integration-issues/supabase-storage-signed-url-expiry-chat.md
  - docs/plans/2026-03-01-fix-chat-ui-names-input-polish-plan.md
---

## Problem Symptom

Three related issues reported in the chat system:

1. **Critical**: Scout names displayed as blank or "Unknown Scout" in the chat thread header when viewed by academy admins
2. **Minor**: Native browser up/down scrollbar arrows visible on the auto-growing message textarea (Windows/WSL)
3. **Polish**: Chat UI looked flat and utilitarian compared to modern messenger apps

## Investigation Steps

### Step 1: UI Fallback (Insufficient)
Added `t('common.unknownScout')` fallback in ChatThread.tsx and ChatInbox.tsx. The fallback displayed but didn't solve the root cause — the name data was genuinely missing.

### Step 2: Data Layer Fallback (Insufficient)
Added email prefix extraction in `chat-queries.ts` as a fallback when `scout_full_name` was empty:
```typescript
const scoutDisplayName = row.scout_full_name || (row.scout_email ? row.scout_email.split('@')[0] : '')
```
Still showed "Unknown Scout" because the data wasn't reaching the client at all.

### Step 3: DisplayName Logic Bug (Partial Fix)
Found that the displayName derivation in ChatThread.tsx checked `lang === 'ka'` before checking `userRole`. This meant academy admins saw their own club's Georgian name instead of the scout's name:

**Before (broken):**
```typescript
const displayName = lang === 'ka' && conversation.club.name_ka
  ? conversation.club.name_ka
  : conversation.club.name
```

**After (fixed):**
```typescript
const rawDisplayName = userRole === 'scout'
  ? (lang === 'ka' && conversation.club.name_ka ? conversation.club.name_ka : conversation.club.name)
  : conversation.other_party.full_name
```

This fixed the logic but the scout profile data was still null.

### Step 4: RLS Policy Discovery (Root Cause)
Queried Supabase RLS policies on the `profiles` table and discovered the gap. The policy allowed academy admins to see scout profiles **only** through `contact_requests`:

```sql
-- Old policy (broken for chat)
get_user_role() = 'academy_admin'
AND id IN (
  SELECT cr.scout_id FROM contact_requests cr
  JOIN players p ON p.id = cr.player_id
  WHERE p.club_id = get_user_club_id()
)
```

When chat replaced contact requests, no new RLS clause was added for the `conversations` table. Academy admins could chat with scouts but couldn't read their profile names.

## Root Cause Analysis

**Primary (Critical)**: Supabase RLS policy on `profiles` table had no clause for conversation-based access. When Phase 6.5 introduced chat as a replacement for contact requests, the profiles access path was not updated. Academy admins could create conversations with scouts but couldn't SELECT the scout's profile row, causing `full_name` to return null.

**Secondary (Medium)**: DisplayName derivation logic in ChatThread.tsx applied bilingual name selection (`lang === 'ka'`) before role-based name source selection (`userRole === 'scout'`), causing academy admins to see their own club's Georgian name instead of the other party's name.

**Tertiary (Low)**: Missing `overflow-hidden` on the auto-growing textarea allowed native browser scrollbar arrows to appear on Windows.

## Solution

### 1. RLS Policy Migration

Applied migration `20250101000031_fix_profiles_rls_for_chat.sql`:

```sql
CREATE OR REPLACE POLICY "profiles_select_policy" ON profiles
FOR SELECT USING (
  id = auth.uid()
  OR get_user_role() = 'platform_admin'
  OR get_user_role() = 'scout'
  OR (
    get_user_role() = 'academy_admin'
    AND (
      id IN (
        SELECT cr.scout_id FROM contact_requests cr
        JOIN players p ON p.id = cr.player_id
        WHERE p.club_id = get_user_club_id()
      )
      OR id IN (
        SELECT c.scout_id FROM conversations c
        WHERE c.club_id = get_user_club_id()
      )
    )
  )
);
```

The key addition is the `OR id IN (SELECT c.scout_id FROM conversations c WHERE c.club_id = get_user_club_id())` clause.

### 2. DisplayName Logic Fix

Reordered to check `userRole` first, then apply language preference:

```typescript
const rawDisplayName = userRole === 'scout'
  ? (lang === 'ka' && conversation.club.name_ka ? conversation.club.name_ka : conversation.club.name)
  : conversation.other_party.full_name

const displayName = rawDisplayName || (userRole === 'scout' ? t('common.unknownClub') : t('common.unknownScout'))
```

### 3. Data Layer Fallback

Added email prefix extraction in `chat-queries.ts` for cases where `full_name` is genuinely empty:

```typescript
const scoutDisplayName = row.scout_full_name || (row.scout_email ? row.scout_email.split('@')[0] : '')
```

### 4. Input Scrollbar Fix

Added `overflow-hidden` to the textarea class in ChatInput.tsx:

```tsx
className="max-h-[96px] min-h-[40px] w-full resize-none overflow-hidden rounded-3xl ..."
```

### 5. Messenger-Style Polish

- **MessageBubble**: Asymmetric border-radius (`rounded-2xl rounded-br-sm` for sent, `rounded-bl-sm` for received), `shadow-sm`, smart spacing based on sender continuity
- **ChatInput**: Pill-shaped textarea (`rounded-3xl`), grouped action buttons, larger send button with shadow
- **ChatThread**: Card container (`rounded-2xl border shadow-lg`), enlarged avatar (h-12), kebab menu for block action, subtle `bg-background-secondary/50` zones
- **ChatInbox**: Larger avatars (h-11), accent border on unread, hover shadow elevation
- **DateDivider**: Softer styling (`bg-border/50`, `text-foreground-muted/70`)

### 6. Navbar Improvements

- Replaced EN|KA toggle with globe icon dropdown
- Removed redundant green Admin role badge
- Changed from `flex justify-between` to `grid grid-cols-[1fr_auto_1fr]` for true center alignment

### 7. Admin Dashboard Redesign

- Welcome header with club name and building icon
- Icon badge stat cards in responsive grid
- 2x2 quick actions grid with unread badge on Messages
- Two-column layout for Quick Actions + Player Views
- Full-width Scout Activity section with proper empty states

## Prevention Strategies

### 1. RLS Checklist for Feature Migrations
When a new feature replaces or supplements an existing data access pattern:
- [ ] List all RLS policies that reference the old access path
- [ ] Add equivalent clauses for the new access path
- [ ] Test with each role (scout, academy_admin, platform_admin) after migration
- [ ] Query the RLS policies directly to verify (don't rely on app-level testing alone)

### 2. Bilingual DisplayName Pattern
Always structure bilingual name derivation as:
```
1. Determine data SOURCE based on user role
2. Apply language preference to the selected source
3. Apply fallback for missing data
```
Never apply language preference before determining the data source.

### 3. CSS Auto-Growing Textarea
When building auto-growing textareas with JavaScript height manipulation, always include `overflow-hidden` to prevent native browser scrollbar artifacts, especially on Windows.

### 4. RLS Policy Testing
After any migration that adds a new table involved in cross-table relationships:
- Query `pg_policies` to verify all related tables have updated policies
- Test data access from the perspective of each user role
- Use Supabase MCP or direct SQL to verify policy definitions

## Key Lessons

1. **RLS policies don't update themselves when you add new tables.** When chat replaced contact requests as the communication channel, the profiles table RLS still only knew about contact_requests. Always audit related RLS policies when introducing new relationship tables.

2. **Test with real user roles, not just the happy path.** The bug only manifested for academy_admins viewing scout profiles. Scout-to-academy worked fine because scouts had broader SELECT access on profiles.

3. **Layer your fallbacks.** The final solution has three layers: RLS policy (data access), email prefix extraction (data layer), and translation key fallback (UI layer). Each layer catches a different failure mode.

4. **CSS grid > flexbox for centered navbars.** `flex justify-between` with unequal left/right content shifts the center. `grid grid-cols-[1fr_auto_1fr]` guarantees true centering regardless of side content width.
