# Scratch Challenge Product Overview

## 1. Product Purpose

Scratch Challenge is an Indonesian-language web learning platform for children and beginner programmers working on Scratch exercises. It helps learners discover structured coding challenges, understand the expected result, download a starter project, watch supporting material, and verify their work against an exercise checklist.

The product has two main experiences:

- **Public learning experience:** browse and complete published Scratch exercises.
- **Administrator experience:** create, update, organize, publish, archive, and remove exercises.

The platform is designed around practical tasks rather than passive lessons. An exercise combines a story/context, a programming problem, instructions, learning objectives, difficulty, duration, an optional Scratch starter file, and an optional result video.

## 2. Public Experience

### Exercise discovery

The home page presents a catalog of published exercises with title, summary, category, thumbnail, difficulty, and estimated completion time. Visitors can:

- Filter exercises by category.
- Filter exercises by difficulty: **Pemula**, **Menengah**, or **Lanjutan**.
- Reset filters to view the complete catalog.
- Open a card to view the full exercise detail page.

The platform is also organized into category pages. Categories such as Basic, Event, Condition, Loop, Variable, Logic, and Advanced group exercises by Scratch concept. A category page displays its description, exercise count, and exercises filtered by difficulty.

Published content is hidden from the public catalog and detail routes when it is in draft or archived status.

### Exercise detail page

Each published exercise has a stable URL based on its slug. The detail page presents the exercise's category, difficulty, estimated duration, short description, and Scratch project type. Content is divided into clear tabs:

1. **Deskripsi Kasus —** displays the exercise scenario, problem statement, requirements, expected behavior, and additional hints as rich content.
2. **Unduh File —** offers the linked `.sb3` file and explains that learners should upload/load it in Scratch. The page also gives step-by-step instructions for opening a project at Scratch's website.
3. **Video Hasil —** displays the expected result through a YouTube embed or direct video player. When no video exists, the page shows an unavailable state.
4. **Checklist —** lists ordered items for learners to compare against their work and manually check as complete.

Scratch project types are **Starter Project**, **Partial Project**, and **Blank Project**, making the starting point explicit before download.

### Learning flow

A typical learner journey is:

1. Browse or filter published exercises.
2. Select an exercise and read its category and difficulty.
3. Review the case description, constraints, and expected behavior.
4. Download and load the Scratch project in the Scratch editor.
5. Implement the requested game or program.
6. Compare the result with the result video where available.
7. Use the checklist to self-assess completion.

Checklist selections are currently a browser interaction and are not presented as an account-wide progress record. A `student_progress` data model exists for future or optional progress tracking, but the public UI does not currently submit or retrieve learner progress.

## 3. Administrator Experience

### Authentication and access

Administrators reach the platform through `/admin`. Login uses Supabase email/password authentication and verifies that the signed-in user has the `admin` role in Supabase application metadata. Non-admin users are signed out rather than granted dashboard access.

The dashboard retrieves both published and unpublished exercises and is reserved for authenticated administrators. Access checks are repeated in relevant API routes rather than relying only on navigation or dashboard UI.

### Exercise management

Authorized administrators can:

- View all exercises, including draft, published, and archived items.
- Search exercises by title or slug.
- Filter by category, difficulty, and publication status.
- Add a new exercise.
- Edit an existing exercise.
- Delete an exercise.

Exercise forms support category, title, slug, summary, case description, problem statement, instructions, learning objectives, difficulty, estimated duration, thumbnail, Scratch project URL/name/type, video URL/type, and publication status. Instructions and learning objectives are entered as line-separated values and stored as ordered lists.

New exercises are created in draft status. Administrators can later set an exercise to `published` for public availability or `archived` to remove it from normal public publication without deleting it. Sort order controls ordering in public exercise and category queries.

### Media management

The admin dashboard supports thumbnail and result-video URLs and file uploads. Uploads may be stored in Supabase Storage in the `exercise-assets` public bucket. Images and videos may instead be uploaded to a configured Google Drive folder through OAuth or a service-account configuration. Google Drive OAuth status is displayed within the dashboard so administrators can connect or refresh their integration.

Storage is limited to supported media types and a maximum file size of 50 MB. The UI returns upload success or an Indonesian error message when configuration or transfer fails.

### Supporting content administration

The database supports ordered checklists attached to individual exercises, and server APIs exist for creating, updating, and deleting checklist items. The product data also models categories and category metadata, including name, slug, description, icon identifier, color treatment, and sort order. The current dashboard implementation includes the main exercise management flow; category and checklist management routes are available server-side but are not presented as a complete dedicated category/checklist UI.

## 4. Product Content Model

The seed content represents a beginner-to-intermediate Scratch curriculum organized around programming concepts:

- Basic movement, looks, sound, and game mechanics.
- Events and broadcasts.
- Conditions and branching.
- Loops and repetition.
- Variables, state, and scoring.
- Logic operators.
- Advanced game systems such as collision and score logic.

Seed examples include narrative challenges such as *Tangkap Buah*, *Petualangan Kucing*, and *Tebak Angka*. Each exercise may provide a clear problem statement, starter resources, learning objectives, estimated time, and supporting result material.

## 5. User Roles and Publication Rules

| Role | Primary capabilities |
|---|---|
| Public visitor | Browse categories; filter published exercises; view exercise details; download linked Scratch projects; watch videos; use checklists |
| Administrator | Sign in; manage exercises and publication states; search/filter the dashboard; upload thumbnails and media; manage content through APIs |

The key publication rule is status-based: public views expose only `published` exercises and their published-exercise checklists. Draft and archived exercises remain administrator-only. Administrator authorization is checked by both application code and Supabase Row Level Security.

## 6. Current Product Boundaries

The product is primarily an exercise content and administration platform. It does not currently require learners to create public accounts, submit Scratch files, receive grading, or persist checklist state in the database. Optional user progress is modeled in Postgres but is not integrated into the learner UI. Scratch editor execution continues outside the platform, while Scratch Challenge supplies the challenge, starting project, expected-result resources, and self-checking content.