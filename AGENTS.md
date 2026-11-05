<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Scratch Challenge Project Guide

## Project purpose

Scratch Challenge is an Indonesian-language learning platform for children's Scratch exercises. The public site browses categories and exercises; the admin area manages exercises, checklists, drafts, and publication status.

## Tech stack

- Next.js 16 App Router, React 19, strict TypeScript
- Tailwind CSS 4
- Supabase SSR, Postgres, Auth, and Row Level Security
- ESLint 9 with Next.js Core Web Vitals and TypeScript rules

## Commands

- `npm run dev` — start the local development server
- `npm run lint` — run ESLint
- `npm run build` — create a production build
- `npm run start` — serve the production build

Run targeted linting for changed files when available, then run the smallest relevant validation. For a final cross-cutting change, run `npm run lint` and `npm run build`.

## Source layout

- `src/app/` — App Router pages, layouts, API routes, and route-specific client components
- `src/app/admin/` — admin dashboard UI
- `src/app/api/` — server API routes
- `src/components/` — shared UI components
- `src/lib/supabase/` — Supabase clients, typed query functions, and shared domain types
- `supabase/migrations/` — database schema migrations
- `supabase/seed.sql` — seed data

Use the `@/*` alias for imports from `src/*`.

## Implementation conventions

- Keep Server Components server-side and add `'use client'` only when browser state or event handlers require it.
- Preserve Next.js 16 async route params and `searchParams` (`Promise<{ ... }>`) patterns.
- Match existing Indonesian user-facing copy and keep labels clear for children.
- Use the existing domain types in `src/lib/supabase/types.ts`; do not duplicate database models.
- Put reusable Supabase reads in `src/lib/supabase/queries.ts`. Keep route-specific mutations explicit and validated.
- Use `createClient()` from `src/lib/supabase/server.ts` for server-side Supabase access and `src/lib/supabase/client.ts` for browser access.
- Prefer existing Tailwind classes and component structure; do not introduce a separate UI library.
- Keep loading and not-found states consistent with adjacent pages.

## Supabase and security

- Treat `draft`, `published`, and `archived` exercise states as meaningful access boundaries.
- Public queries must only expose published content unless the caller is an authorized admin.
- Rely on RLS as the final database authorization boundary.
- Never commit secrets or public/private environment values. Required public variables are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Schema changes belong in a new migration. Keep migration SQL compatible with existing RLS policies, constraints, indexes, and triggers.
- Preserve cascade and `ON DELETE` behavior unless a data-model requirement intentionally changes it.

## Data and UI behavior

- Categories and exercises use stable slugs for routes.
- Exercise content includes difficulty, duration, instructions, learning objectives, optional Scratch/video resources, status, and sort order.
- Checklists belong to an exercise and use `sort_order`.
- `student_progress` is optional MVP data; only the owning user may read or modify progress.

## Change checklist

1. Inspect the nearest existing page, component, query, API route, migration, or seed pattern before editing.
2. Make the smallest complete change; do not rewrite unrelated admin or public UI files.
3. Preserve published-data filtering and authorization boundaries.
4. Update types and migrations together when the database shape changes.
5. Remove dead imports and unused duplicate variants from changed areas.
6. Run `npm run lint` and, for framework, data, API, or build-affecting changes, `npm run build`.
