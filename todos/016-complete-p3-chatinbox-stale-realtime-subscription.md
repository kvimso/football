---
status: pending
priority: p3
issue_id: "016"
tags: [code-review, bug, realtime]
dependencies: []
---

# ChatInbox Stale Realtime Subscription for New Conversations

## Problem Statement

The Realtime subscription in ChatInbox uses `conversationIdsRef.current` to scope message filtering. When a new conversation is created, the Realtime channel is not re-subscribed, so messages in new conversations won't trigger inbox updates until the component remounts.

## Findings

**Source:** Performance Oracle (Optimization #8)

**Location:** `src/components/chat/ChatInbox.tsx`

## Proposed Solutions

Add conversation list to the effect's dependency array and resubscribe when it changes, or use a broader filter scoped by RLS.

- **Effort:** Small-Medium
- **Risk:** Low

## Acceptance Criteria

- [ ] New conversations receive real-time message updates without page refresh
- [ ] No duplicate subscriptions created

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Performance Oracle |
