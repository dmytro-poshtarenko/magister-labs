# magister-labs

Educational project for the Master’s program (2025) in “Software Engineering” at Cherkasy State Technological University (ChSTU). This repository will host laboratory works for all subjects taught in 2025.

## Tech stack
- Vite 5 (React plugin) — fast build tool
- React 19 + React Router 6 — UI and routing
- TypeScript (strict) — strict typing by default
- Mantine — UI component library and theming
- ESLint (flat config) + typescript-eslint + eslint-plugin-unused-imports — type-aware linting

## Requirements
- Node.js 18.18+ (LTS recommended) or 20+
- npm 8+ / 9+

## Environment setup
1) Install dependencies:
```bash
npm install
```
2) Start dev server:
```bash
npm run dev
```
Default URL: `http://localhost:5173`.

3) Lint and typecheck:
```bash
npm run lint
```
This runs ESLint (type-aware) and `tsc --noEmit`.

4) Build and preview:
```bash
npm run build
npm run preview
```

## Structure & conventions
- Entry point: `src/index.tsx`
- Main layout: `src/App.tsx` (Mantine `AppShell`)
- Sidebar navigation: `src/components/SidebarNav.tsx` (React Router 6)
- Mantine theme: `src/theme.ts` (via `MantineProvider`)
- Only `.ts` / `.tsx` files are allowed (`.js` / `.jsx` linting is disabled)
