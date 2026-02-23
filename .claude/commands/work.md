---
name: work
description: Execute a feature plan or spec systematically — read plan, break into tasks, implement incrementally, verify quality
argument-hint: "[plan file path, feature description, or session number]"
---

# Execute Work Plan

Execute a work plan efficiently while maintaining quality and shipping complete features.

## Input

<input_document> $ARGUMENTS </input_document>

## Execution Workflow

### Phase 1: Understand

1. **Review Context**
   - Read CLAUDE.md for project rules and conventions
   - Check MEMORY.md for past lessons relevant to this work
   - Read the work document / plan completely

2. **Clarify**
   - If anything is unclear or ambiguous, ask questions NOW
   - Get user approval to proceed
   - Better to ask questions now than build the wrong thing

3. **Break Into Tasks**
   - Create a task list (use TaskCreate if the plan has 3+ steps)
   - Include dependencies between tasks
   - Prioritize: database changes first, then backend logic, then UI

### Phase 2: Implement

For each task:

1. **Read Before Writing**
   - Read existing code that you'll be modifying
   - Look for similar patterns in the codebase (grep for similar implementations)
   - Match naming conventions, file structure, and component style exactly

2. **Implement**
   - Follow existing patterns — don't reinvent
   - Server components by default, `'use client'` only when needed
   - All strings through `t('key')` — add both EN and KA translations
   - All Supabase queries check `.error` before using `.data`
   - All buttons have loading/disabled state during actions

3. **Verify After Each Task**
   - Run `npm run build` to catch TypeScript errors
   - Check the change makes sense in context

4. **Commit Heuristic**
   - Can you write a commit message that describes a complete, valuable change?
   - If yes → commit (stage specific files, not `git add .`)
   - If the message would be "WIP" → keep working

### Phase 3: Quality Check

Before considering work done:

```bash
npm run build    # Must pass clean
npm run lint     # Must pass clean
```

Verify:
- [ ] All tasks from the plan completed
- [ ] Both EN and KA translations added for new text
- [ ] All action buttons have loading states
- [ ] Mobile responsive (check at 375px mentally)
- [ ] No hardcoded strings
- [ ] RLS policies added for any new tables
- [ ] Supabase error handling on all queries
- [ ] `revalidatePath` called after mutations

### Phase 4: Finish

1. **Update CLAUDE.md** — check off completed build phase items
2. **Summarize** — tell the user what was completed
3. **Commit** — only when user asks (don't auto-commit)

## Key Principles

- **Start fast** — read plan, clarify once, then execute
- **Follow patterns** — match what exists, don't reinvent
- **Test continuously** — run build after each major change
- **Ship complete** — don't leave features 80% done
- **Track progress** — mark tasks as completed as you go
