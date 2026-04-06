

## Plan: Add VITE_SUPABASE_ANON_KEY to .env

Since these are **public/publishable keys**, they're safe to store in the codebase.

### Current Problem
The `.env` file has `VITE_SUPABASE_PUBLISHABLE_KEY` but several files (`useGenerateSprite.ts`, `useGenerateAnimation.ts`, `src/lib/supabase.ts`) reference `VITE_SUPABASE_ANON_KEY`, which doesn't exist — causing those features to silently fail.

### Changes

**1. Update `.env`** — Add the missing `VITE_SUPABASE_ANON_KEY`:
```
VITE_SUPABASE_ANON_KEY=sb_publishable_lihBqhCIbObXisXzKV_85g_60Ih-GCh
```

This single change will fix all three files that read from `VITE_SUPABASE_ANON_KEY`.

| File | Change |
|---|---|
| `.env` | Add `VITE_SUPABASE_ANON_KEY` |

