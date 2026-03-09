# Code Health: Keep Code Clean Over Time

**Date:** 2026-03-09
**Status:** Decided

## What We're Building

Automated code quality guardrails (Approach 2) that keep the codebase clean as features pile up, without requiring manual effort day-to-day.

### Components:
1. **Prettier** — auto-formats code on commit (consistent style)
2. **Husky + lint-staged** — pre-commit hooks that lint and format changed files
3. **GitHub Actions CI** — runs `lint` + `build` on every push as a safety net
4. **Fix existing lint issues** — 1 error + 5 warnings to clear

## Why This Approach

- **Solo developer** shipping fast — needs zero-friction guardrails, not heavyweight processes
- **TypeScript strict mode + ESLint already in place** — just need enforcement layer
- **No tests yet** — deferred to Phase 8 (pre-launch). Current coverage from `/workflows:review` + manual testing is sufficient for pre-launch development
- **GitHub CI** adds cloud-level safety net beyond local hooks

## Key Decisions

- **Approach 2 chosen over Approach 1** (added CI) and **Approach 3** (deferred tests)
- **Tests deferred to Phase 8** — `/workflows:review` + manual testing covers 80% for solo dev
- **Prettier config**: semicolons, single quotes, trailing commas, 100 char width (matches existing style)
- **lint-staged**: only checks changed files (fast commits)
- **CI runs**: lint + build (no tests until Phase 8)

## Open Questions

None — all decisions made.

## Implementation Plan

### Session 1 (now):
1. Fix 1 lint error + 5 warnings
2. Install and configure Prettier
3. Install and configure Husky + lint-staged
4. Create GitHub Actions CI workflow
5. Verify everything works end-to-end

### Future (Phase 8):
- Add Jest + React Testing Library
- Write tests for auth, API routes, form validation, key components
- Add test step to CI pipeline
