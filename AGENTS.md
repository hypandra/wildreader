# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, API routes, and global styles.
- `components/`: Reusable UI building blocks; `components/ui/` holds shadcn-based primitives.
- `lib/`: Auth, data access, game logic, and shared utilities.
- Migrations live in `supabase/migrations/`.
- `data/`: Static data inputs (for example `data/ipa-data.json`).
- `types/`: Shared TypeScript types; `docs/` and `scripts/` for reference material and tooling.

## Build, Test, and Development Commands
- `bun install`: Install dependencies.
- `bun dev`: Run the local Next.js dev server.
- `bun run build`: Create a production build.
- `bun start`: Serve the production build locally.
- `bun run lint`: Run ESLint (`next lint`) for code quality checks.
- `supabase db push`: Apply migrations to your Supabase instance.

## Supabase Management
- Migrations are in `supabase/migrations/`.
- For fresh installs, use `supabase/migrations/combined_schema.sql`.
- Table prefix: `wr_` for all Wild Reader tables.
- Database connection uses `DATABASE_URL`.
- RLS is disabled; authorization handled in application layer via `user_id` filtering.

## Coding Style & Naming Conventions
- TypeScript + React with Next.js App Router conventions.
- Indentation is 2 spaces; use double quotes and omit semicolons (match existing files).
- Components use `PascalCase` filenames (example: `components/GameCard.tsx`).
- Route segments under `app/` use kebab-case (example: `app/select-child/`).
- Tailwind CSS classes are used for styling; favor existing design tokens in `tailwind.config.ts`.

## Testing Guidelines
- No automated test runner is configured in this repo.
- Validate changes with `bun run lint` and manual QA in `bun dev`.
- If you add a testing framework, document the command and naming convention here.

## Commit & Pull Request Guidelines
- Commit messages are short, imperative, sentence-case (examples: “Update better-auth to 1.4.10”).
- Keep commits scoped to one logical change when possible.
- PRs should include: a concise summary, testing notes, screenshots for UI changes, and any new env vars or migrations.

## Configuration & Secrets
- Copy `.env.example` to `.env.local` and set required values (`NEXT_PUBLIC_SUPABASE_URL`, `DATABASE_URL`, `OPENROUTER_API_KEY`, etc.).
- Do not commit secrets; keep local overrides in `.env.local`.
