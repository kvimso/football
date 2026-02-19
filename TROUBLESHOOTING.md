# Troubleshooting Guide

Recurring issues and their solutions. Update this file whenever a new issue is resolved.

---

## "This site cannot be reached" / Dev server won't start

### Problem
`npm run dev` crashes with `Operation not permitted (os error 1)` or Turbopack panics. The site shows "This site cannot be reached" in the browser.

### Root Cause
The project is on the Windows filesystem (`/mnt/c/`) inside a OneDrive-synced folder. WSL2 has permission issues writing to Windows paths, and OneDrive locks files during sync. Turbopack writes files with special characters (like `[root-of-the-server]__...`) that OneDrive can't handle.

### Solution
Move the project to the native WSL filesystem for development:

```bash
# 1. Copy project (without node_modules — they're huge and platform-specific)
mkdir -p ~/projects
rsync -a --exclude='node_modules' --exclude='.next' --exclude='nul' \
  "/mnt/c/Users/kvims/OneDrive/Desktop/georgian-football-platform/" \
  ~/projects/georgian-football-platform/

# 2. Install dependencies fresh
cd ~/projects/georgian-football-platform
npm install

# 3. Start dev server
npm run dev
```

### If the dev server still fails after moving
```bash
# Kill old next processes
pkill -f "next dev"

# Remove stale .next cache and lock
rm -rf .next

# Free up ports
lsof -ti:3000 | xargs kill -9

# Retry
npm run dev
```

### Prevention
- Always run the dev server from `~/projects/georgian-football-platform/` (WSL filesystem), NOT from `/mnt/c/...`
- The OneDrive copy can stay as a backup, but development should happen on WSL
- When syncing changes back to OneDrive, use `rsync` with the same excludes

---

## Port already in use

### Problem
```
Port 3000 is in use by an unknown process
```

### Solution
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

---

## .next lock file prevents startup

### Problem
```
Unable to acquire lock at .next/dev/lock
```

### Solution
```bash
rm -rf .next
npm run dev
```

---

## Dev server freezes / hangs after a few requests

### Problem
The dev server starts fine and responds to the first 2-3 requests, then becomes completely unresponsive. Curl returns HTTP 000 (timeout). The `next-server` process stays alive but consumes 1-2GB RAM.

### Root Causes
1. **Zombie Next.js processes** — Multiple `next-server` processes pile up when the dev server isn't cleanly stopped (e.g. closing terminal without Ctrl+C). They compete for the same port and lock file.
2. **Corrupted `.next` cache** — Previous crashes leave corrupt Turbopack state.
3. **Node.js thread pool exhaustion** — The middleware makes HTTPS calls to Supabase on every request. The default `UV_THREADPOOL_SIZE=4` bottlenecks when multiple concurrent requests each need DNS + TLS handshakes.

### Solution
```bash
# 1. Kill ALL zombie Next.js processes
pkill -9 -f "next-server"
pkill -9 -f "next dev"
pkill -9 -f "postcss"

# 2. Clear corrupted cache
rm -rf .next

# 3. Start fresh (UV_THREADPOOL_SIZE is already set in package.json dev script)
npm run dev
```

### Prevention
- Always stop the dev server cleanly with Ctrl+C before closing the terminal
- If the server seems frozen, don't just close the terminal — kill the processes first
- The `npm run dev` script now includes `UV_THREADPOOL_SIZE=16` to prevent thread pool exhaustion
