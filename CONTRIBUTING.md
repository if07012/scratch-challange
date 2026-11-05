# Contributing to Scratch Challenge

## Getting Started

Read [ARCHITECTURE.md](ARCHITECTURE.md) and [PRODUCT.md](PRODUCT.md) before changing the application. Use Node.js/npm and a Supabase project for local development.

```bash
npm install
npm run dev
```

Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Features that use private storage or Google Drive may also require the service-role or Google integration variables documented by the environment setup. Never commit credentials, `.env*` files, tokens, or service-account JSON.

Validation commands:

```bash
npm run lint    # ESLint
npm run build   # production build
npm run start   # serve the production build
```

## Project Conventions

- `src/app/` — App Router pages, layouts, and API route handlers.
- `src/app/admin/` — administrator dashboard.
- `src/components/` — shared React components.
- `src/lib/supabase/` — Supabase clients, domain types, and reusable queries.
- `supabase/migrations/` — schema, RLS, storage, and trigger changes.
- `supabase/seed.sql` — reference/development seed data.

Use `@/*` for imports under `src/*`, existing Tailwind patterns, and shared types instead of duplicating database models. Keep user-facing copy clear and consistent with the project's Indonesian UI.

## Implementation Guidelines

### Next.js and React

Use Server Components for initial reads and Client Components only for browser state, effects, or event handlers. Preserve Next.js 16 async route `params` and `searchParams` values (`Promise<{ ... }>`). Match existing loading, skeleton, and not-found behavior. Remove unused imports and avoid unrelated refactoring.

### Supabase and Security

Use `src/lib/supabase/server.ts` for server requests and `src/lib/supabase/client.ts` for browser requests. Put reusable database reads in `src/lib/supabase/queries.ts`. Public views must expose only `published` exercises; drafts and archived exercises are administrator-only.

Rely on RLS as the final database boundary. Preserve restrictions for student progress and exercise/checklist data. Do not weaken public policies for convenience.

### Database Changes

Add a new migration for schema, buckets, triggers, indexes, policies, or storage changes. Do not edit an applied migration as if it were a new deployment. Verify cascades, constraints, sort behavior, and existing RLS remain valid. Update [src/lib/supabase/types.ts](src/lib/supabase/types.ts) when a database type represented by TypeScript changes.

## Validation and Review

Run the smallest relevant check first. For UI or TypeScript changes, run lint and build when framework behavior is involved. For API, auth, database, storage, or build-affecting changes, run lint and production build, then manually verify public versus administrator access. Test migrations against an appropriate Supabase environment.

Pull requests should explain the behavior changed, include screenshots for visible UI updates, list validation commands, and flag migration or environment-variable requirements. Include a security/access-impact note for authentication, RLS, API, or storage changes. Keep commits focused and do not include generated files, local logs, secrets, or unrelated workspace artifacts.