---
status: pending
priority: p3
issue_id: "015"
tags: [code-review, security, csp]
dependencies: []
---

# CSP Allows unsafe-inline and unsafe-eval

## Problem Statement

The Content Security Policy includes `'unsafe-inline' 'unsafe-eval'` in `script-src`, which significantly weakens XSS protection. `unsafe-eval` is typically only needed during development.

## Findings

**Source:** Security Sentinel (M1) + Architecture Strategist

**Location:** `next.config.ts`, line 29

## Proposed Solutions

- Remove `'unsafe-eval'` for production builds
- Investigate nonce-based CSP with Next.js support
- Condition on `NODE_ENV` if needed for dev

- **Effort:** Medium (requires testing with production build)
- **Risk:** Low-Medium (may break if a dependency relies on eval)

## Acceptance Criteria

- [ ] `'unsafe-eval'` removed or conditioned on development only
- [ ] Production build works without eval
- [ ] No runtime errors from CSP violations

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Security Sentinel M1 |
