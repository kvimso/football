---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, security, file-upload]
dependencies: []
---

# File Upload Lacks Double-Extension and Filename Sanitization

## Problem Statement

The chat file upload validates extensions via `fileName.endsWith(ext)` but doesn't check the final extension only, doesn't sanitize filenames for XSS, and doesn't strip null bytes.

## Findings

**Source:** Security Sentinel (M3)

**Location:** `src/app/api/chat-upload/route.ts`, lines 52-56

1. `file.jpg.svg` could pass the `.jpg` check first
2. Filename like `<img src=x onerror=alert(1)>.pdf` could be an XSS vector if rendered
3. `file.name` is returned directly in the response

## Proposed Solutions

```typescript
// Sanitize filename
const safeName = file.name.replace(/[<>"'&\x00]/g, '_').substring(0, 200)

// Check only the FINAL extension
const lastDotIndex = fileName.lastIndexOf('.')
const ext = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : ''
if (!ALLOWED_CHAT_FILE_EXTENSIONS.includes(ext)) {
  return NextResponse.json({ error: 'errors.fileTypeNotAllowed' }, { status: 400 })
}
```

- **Effort:** Small
- **Risk:** None

## Acceptance Criteria

- [ ] Only the final file extension is validated
- [ ] Filenames are sanitized before storage and response
- [ ] Double-extension files are rejected correctly

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Security Sentinel M3 |
