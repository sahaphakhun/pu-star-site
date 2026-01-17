# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` contains Next.js App Router pages and API routes (`src/app/api/`).
- `src/components/` holds shared UI/form components; small primitives live in `src/components/ui/`.
- `src/features/jubili/` contains feature-specific pages, hooks, and service wrappers.
- `src/models/`, `src/schemas/`, and `src/utils/` store database models, Zod schemas, and helpers.
- `public/` stores static assets (images, fonts, placeholders).
- `test/` contains Vitest tests (example: `test/deals.filter.test.ts`).
- `src/scripts/` includes migration and maintenance scripts.

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js dev server.
- `npm run build` creates a production build.
- `npm run start` runs the production server (uses `PORT` and runs `prestart` migrations).
- `npm run lint` runs Next.js ESLint rules.
- `npm run test` runs Vitest once; `npm run test:watch` runs Vitest in watch mode.
- `npm run migrate` / `npm run migrate:*` execute data migrations (requires DB access).

## Coding Style & Naming Conventions
- Prefer TypeScript/TSX; mark client components with `"use client"`.
- Follow existing formatting (typically 2-space indentation).
- Use `PascalCase` for component files (e.g., `CustomerFormNew.tsx`) and `camelCase` for hooks/utilities.
- Tailwind CSS is the primary styling system; reuse primitives in `src/components/ui/`.

## Testing Guidelines
- Vitest is the test runner; tests live in `test/` and use `*.test.ts`/`*.test.tsx`.
- Add or update tests when changing business logic (filters, API utilities).
- Run tests with `npm run test` or `npm run test:watch`.

## Commit & Pull Request Guidelines
- History mixes imperative messages (`Fix ...`) and Conventional Commits (`feat:`); use clear, descriptive messages.
- PRs should include a brief summary, testing notes, and screenshots for UI changes.

## Security & Configuration Tips
- Use `env.example` as the template for local environment variables.
- Migration scripts can modify production-like data; run only against the intended database.
