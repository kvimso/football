---
name: refactor
description: Systematically refactor code — analyze, plan changes, execute incrementally, verify nothing breaks
argument-hint: "[file or component to refactor, or description of what to improve]"
---

# Refactor Code

Systematically refactor code while preserving behavior.

## Target: $ARGUMENTS

## Refactoring Workflow

### 1. Analyze Current State
- Read the target files completely
- Understand what the code does and why
- Identify all places that import/use this code (grep for imports)
- Note the current behavior that must be preserved

### 2. Identify Issues
Rate each issue found:

| Priority | Issue Type | Example |
|----------|-----------|---------|
| High | Bug risk | Missing error handling on Supabase call |
| High | Security | Service role key exposed to client |
| Medium | Performance | Unnecessary `'use client'` on data-fetching component |
| Medium | Maintainability | Duplicated logic across components |
| Low | Style | Inconsistent naming conventions |

### 3. Plan Changes
- Define clear goals (performance? readability? fixing bugs?)
- Plan small, incremental steps
- Present the plan to the user before executing

### 4. Execute Incrementally
For each change:
1. Make one focused change
2. Run `npm run build` to verify nothing breaks
3. Move to the next change

### 5. Final Verification
```bash
npm run build   # Clean
npm run lint    # Clean
```

- All existing functionality preserved
- Code follows project conventions (see CLAUDE.md)
- No new `any` types introduced
- No hardcoded strings (use `t('key')`)

## Project-Specific Rules

When refactoring this codebase:
- Server components by default — convert `'use client'` to server where possible
- Use Supabase client directly — no ORM
- Use existing `globals.css` classes — no new CSS frameworks
- Preserve all RLS policy compliance
- Keep translations working in both EN and KA
- Don't add unnecessary abstractions — three similar lines > premature abstraction
