# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` contains Next.js App Router pages and server routes (API endpoints live in `src/app/api/`).
- `src/components/` holds shared UI and form components; `src/components/ui/` provides small reusable primitives.
- `src/features/jubili/` contains domain-specific pages, hooks, and service wrappers.
- `src/models/`, `src/schemas/`, and `src/utils/` store database models, Zod schemas, and helpers.
- `public/` keeps static assets (images, fonts, placeholders).
- `test/` hosts Vitest tests (example: `test/deals.filter.test.ts`).
- `src/scripts/` includes migration and maintenance scripts.

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js dev server.
- `npm run build` creates a production build.
- `npm run start` runs the production server (uses `PORT` and runs `prestart` migrations).
- `npm run lint` runs Next.js ESLint rules.
- `npm run test` runs Vitest once; `npm run test:watch` keeps tests running.
- `npm run migrate` / `npm run migrate:*` execute data migrations (requires DB access).

## Coding Style & Naming Conventions
- Prefer TypeScript/TSX; mark client components with `"use client"`.
- Follow the existing formatting (typically 2-space indentation).
- Use `PascalCase` for component files (e.g., `CustomerFormNew.tsx`) and `camelCase` for hooks/utilities.
- Tailwind CSS is the primary styling system; reuse primitives from `src/components/ui/`.

## Testing Guidelines
- Vitest is the test runner; tests live in `test/` and use `*.test.ts`/`*.test.tsx`.
- Add or update tests when changing business logic (filters, API utilities).

## Commit & Pull Request Guidelines
- History mixes imperative messages (`Fix ...`) and Conventional Commits (`feat:`); prefer clear, descriptive messages (avoid placeholders like “ss”).
- PRs should include a brief summary, testing notes, and screenshots for UI changes.

## Configuration & Security Notes
- Use `env.example` as a template for local environment variables.
- Migration scripts can modify production-like data; run them only against the intended database.
