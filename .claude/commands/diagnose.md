---
name: diagnose
description: Diagnose a bug or technical issue systematically — analyze before fixing, propose a plan, wait for approval
argument-hint: "[description of the issue]"
---

# Diagnose Issue

Systematically diagnose a technical issue and create a step-by-step fix plan.

## Issue Description

**$ARGUMENTS**

## Diagnostic Workflow

### Step 1: Check Past Solutions

Before diagnosing, check if we've solved this before:

- Read `CLAUDE.md` for known patterns and troubleshooting notes
- Check `.claude/projects/*/memory/MEMORY.md` for past debugging insights
- Check `TROUBLESHOOTING.md` if it exists

### Step 2: Gather Context

- Read the relevant source files completely — do not guess about code you haven't seen
- Check git log for recent changes that might have introduced the issue
- Look at the error message carefully — identify the exact file, line, and component
- Check if the issue is in a server component or client component (different debugging approaches)

### Step 3: Diagnose

Think through the issue systematically:

1. **What is the expected behavior?**
2. **What is the actual behavior?**
3. **When did it start?** (check git log)
4. **What changed?** (recent commits, dependency updates)
5. **Can you reproduce it?** (what steps trigger it)

For common issue types:

| Issue Type | Check First |
|-----------|-------------|
| Hydration mismatch | Server vs client rendering differences, `useEffect` timing |
| Supabase query fails | `.error` check, RLS policies, column names, auth state |
| Page not loading | `loading.tsx` exists, Supabase env vars set, middleware redirect |
| Build error | TypeScript types, import paths, `database.types.ts` stale |
| Styling broken | `globals.css` custom properties, Tailwind v4 `@theme` syntax |
| Translation missing | Key exists in both EN and KA in `translations.ts` |
| Auth issue | Cookie refresh in middleware, `getUser()` vs `getSession()` |

### Step 4: Propose Fix Plan

Present a clear plan:

```
DIAGNOSIS: [What's causing the issue]
ROOT CAUSE: [Why it's happening]
CONFIDENCE: [High/Medium/Low]

FIX PLAN:
1. [First change — file, what to change, why]
2. [Second change — if needed]
3. [Verification — how to confirm the fix works]
```

### Step 5: Wait for Approval

**Do not implement the fix without user permission.**

Present the plan and wait. If approved, execute step by step, running `npm run build` after changes to verify no new errors are introduced.

### Step 6: After Fixing

- If this was a tricky bug, note the pattern in MEMORY.md so we don't repeat it
- Verify the fix doesn't break other functionality
- Run `npm run build` and `npm run lint` clean
