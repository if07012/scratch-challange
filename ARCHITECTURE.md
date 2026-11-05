# Scratch Challenge Architecture

## 1. Purpose and Scope

Scratch Challenge is an Indonesian-language learning platform for Scratch exercises. It provides a public catalog for browsing categories and exercises and a protected administrator experience for managing content, publication status, checklists, and media.

The application is a full-stack Next.js project with Supabase providing authentication, Postgres data, row-level security, and public exercise assets.

## 2. System Context

```text
Browser / user
    |
    | HTTP pages and fetch API requests
    v
Next.js App Router application
    |-- Server Components and shared query functions
    |-- Client Components and admin browser interactions
    |-- Route Handlers under src/app/api/
    |
    +--> Supabase Auth / Postgres / Storage
    |
    +--> Google Drive API (optional media integration)
```

- Public visitors browse published exercises and category pages.
- Administrators sign in with Supabase and receive role-authorized access to the `/admin` dashboard and mutation APIs.
- Supabase remains the data and authorization boundary; Google Drive is an optional external destination for uploaded images or videos.

## 3. Runtime Structure

### Presentation and routing

The Next.js App Router is organized in `src/app/`:

- `/` lists categories and exercises and supports category/difficulty filtering.
- `/categories/[slug]` displays exercises for one category.
- `/exercises/[slug]` displays exercise instructions, objectives, resources, and checklists.
- `/login` authenticates administrators through Supabase browser auth.
- `/admin` provides the content management dashboard.
- `src/app/api/` contains server route handlers for exercises, categories, checklists, uploads, and Google Drive OAuth/token operations.

Server Components perform most initial reads and render shared data directly. `ClientFilters`, `ExerciseGrid`, exercise-detail, category, login, and admin implementations use client-side state only where browser interaction is needed. Suspense and route-specific skeleton components handle loading UI.

### Application services

`src/lib/supabase/queries.ts` centralizes database reads and some mutations, while API route handlers own explicitly validated server-side mutations. `src/lib/supabase/server.ts` creates a cookie-aware server client and `src/lib/supabase/client.ts` creates a browser client from the Supabase SSR packages.

`src/middleware.ts` refreshes Supabase sessions through cookies. Database policies provide the final authorization boundary.

## 4. Data Architecture

The Postgres schema is defined by migrations in `supabase/migrations/` and seeded by `supabase/seed.sql`.

- `categories`: stable display metadata and sort order.
- `exercises`: main learning content, category relation, difficulty, duration, instructions, objectives, status, Scratch resource, thumbnail/video fields, and sort order.
- `exercise_checklists`: ordered completion steps belonging to an exercise.
- `student_progress`: optional user-owned progress records keyed by user and exercise.

Exercise lifecycle values are `draft`, `published`, and `archived`. Public queries explicitly select `published` exercises and checklists; the admin dashboard can read all exercises. Stable slugs identify category and exercise routes. Updated timestamps are maintained by database triggers, and indexes support category, difficulty, status, slug, checklist, and progress lookups.

RLS is enabled on all domain tables. Public policies expose only published exercises and their checklists; administrators receive full management access; student progress is restricted to its owner and administrators.

## 5. Media and External Integrations

The `exercise-assets` Supabase Storage bucket is public and limited to 50 MB and supported image/video MIME types. The upload API accepts files, chooses Google Drive when configured for images/videos, and otherwise stores the asset in Supabase Storage through the service role. URLs are then saved in exercise media fields.

Google Drive integration uses OAuth cookies plus refresh-token handling for browser uploads or a service-account JSON fallback. The Google token routes manage consent and token exchange; sensitive credentials are environment variables and are never stored in database content.

## 6. Security and Operational Boundaries

- Browser Supabase calls use the public anon key; server routes use cookie-bound sessions.
- Public reads rely on status filtering and RLS, while mutations require an authenticated administrator role.
- Storage and database access are separate boundaries. Storage policies and bucket limits complement application validation.
- Required public configuration is `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Private integration settings include Supabase service role, Google OAuth/service-account credentials, redirect URI, and Drive folder ID.
- Migrations should remain the source of schema, RLS, storage, trigger, and policy changes. Avoid serving draft or archived content through public query paths.

## 7. Build and Deployment Model

The project runs with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Supabase SSR. `npm run dev`, `npm run build`, `npm run start`, and `npm run lint` are the standard workflows. Deployment requires a Next.js host with Node server/route-handler support, the environment variables above, and a configured Supabase project. Supabase migrations and seed data are deployed separately from the application bundle.