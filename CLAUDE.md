# Vibe Check — Developer Guide

Group trip/weekend planning app. A host creates a session, shares an invite link, friends submit ideas, everyone votes, and the app surfaces a ranked schedule.

## Stack

- **Framework**: Next.js 14 (App Router, Server Components, Server Actions)
- **Database + Auth**: Supabase (Postgres, RLS, Realtime, magic-link auth)
- **Styling**: Tailwind CSS
- **Language**: TypeScript strict mode

## Project structure

```
app/
  page.tsx                          # Landing (redirects logged-in users to /dashboard)
  login/page.tsx                    # Magic-link login
  auth/callback/route.ts            # Supabase auth code exchange
  join/[code]/page.tsx              # Public join page (uses RPC for session preview)
  (app)/                            # Auth-protected route group
    layout.tsx                      # Checks session, renders nav
    dashboard/page.tsx              # User's sessions list
    sessions/
      new/page.tsx                  # Create session form
      [id]/page.tsx                 # Session overview + host controls
      [id]/ideas/page.tsx           # Idea submission
      [id]/vote/page.tsx            # Voting (+ voting-ui.tsx client component)
      [id]/schedule/page.tsx        # Ranked results

lib/
  supabase/client.ts                # Browser client (createBrowserClient)
  supabase/server.ts                # Server client (createServerClient + cookies)
  types/database.types.ts           # Manual TypeScript types for all tables
  actions/
    sessions.ts                     # createSession, joinSession, advanceSessionStatus
    ideas.ts                        # submitIdea, deleteIdea
    votes.ts                        # castVote (upserts on idea_id,user_id conflict)

middleware.ts                       # Supabase session refresh + route protection
supabase/schema.sql                 # Full schema with RLS policies — run this in Supabase SQL editor
```

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in values from your Supabase project dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # used for invite link generation
```

## Database setup

1. Create a Supabase project
2. In the SQL editor, paste and run the contents of `supabase/schema.sql`
3. Enable magic link (OTP) in Auth → Providers → Email

The schema creates:
- `sessions` — the planning session (title, status, invite_code, dates)
- `session_members` — who has joined (is_host flag)
- `ideas` — submitted ideas with category + optional URL/cost
- `votes` — 1=Pass, 2=Like, 3=Love; unique per (idea_id, user_id)

RLS is enabled on all tables. The `preview_session_by_code(p_invite_code)` RPC function is `SECURITY DEFINER` so unauthenticated users can preview a session before signing up.

## Session lifecycle

```
collecting_ideas  →  voting  →  completed
```

The host advances the status via the "Advance phase" button on the session detail page. Only the host (`created_by`) can advance.

## Voting model

Three levels: Pass (1), Like (2), Love (3). `castVote` upserts so users can change their mind. The schedule page ranks ideas by summing vote values and groups by category.

## Auth flow

1. User submits email on `/login`
2. Supabase sends magic link with `redirectTo` pointing at `/auth/callback?next=<path>`
3. Callback exchanges the code and redirects to `next`
4. Middleware refreshes the session token on every request

## Key patterns

- **Server Actions**: all mutations (create session, submit idea, vote). Never expose service-role key to the client.
- **Server Components**: all data fetching — no `useEffect` + fetch patterns.
- **Client Components**: `VotingUI` (optimistic vote state), `SignOutButton`, `CopyInviteButton`.
- **Join preview**: uses `supabase.rpc('preview_session_by_code', ...)` which bypasses RLS safely.

## Future integrations (planned)

- Ticketmaster API — event search by destination + date
- OpenTable API — restaurant availability
- Google Maps — place autocomplete for ideas
- Supabase Realtime — live idea/vote updates without page refresh
