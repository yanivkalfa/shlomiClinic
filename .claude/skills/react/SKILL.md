---
name: react
description: Use when writing or reviewing any React/JSX/TSX code in this repo — the client website (apps/web), the desktop renderer (apps/desktop), or shared UI packages (packages/ui). Covers stack conventions, component rules, and accumulated React learnings for this project.
---

# React (web + desktop renderer + shared UI)

## Stack

- Latest stable React (19+), function components and hooks only — no class components.
- TypeScript everywhere, `strict: true`. No `any` unless annotated with a reason.
- Vite for apps/web. The Electron renderer in apps/desktop uses the same React conventions.
- Components that both web and desktop need live in `packages/ui`; pure logic (no JSX) lives in `packages/core`.

## Hard rules

- **No hardcoded user-visible strings.** Every label, title, placeholder, error, and tooltip goes through the i18n dictionary (see the `i18n-rtl` skill). This is a project-level contract: EN/HE with full RTL support.
- Layout with CSS logical properties (`margin-inline-start`, not `margin-left`) so RTL works for free.
- Keep components presentational where possible; data fetching and business rules belong in hooks/`packages/core`, not inside JSX.
- Server state ≠ UI state: server data goes through a query layer (e.g. TanStack Query) — don't mirror it into local state stores.
- Prefer controlled, small components over prop-drilling monoliths; extract when a component crosses ~150 lines or holds unrelated state.

## Conventions

- Files: `PascalCase.tsx` for components, `useThing.ts` for hooks, colocate component + styles + test.
- Named exports (no default exports) for shared packages.
- Dates/numbers/currency always formatted through `Intl` with the active locale — never string-built.

## Learnings

(Appended by the `capture-learning` skill — hard-won React knowledge for this project.)

- **[2026-08-07] Single-file deliverable via `vite-plugin-singlefile`** — Vite 6 + `@vitejs/plugin-react` 4 + `vite-plugin-singlefile` inlines everything (React, FullCalendar, Chart.js, SVG data-URIs) into one `dist/index.html` (~765 KB) that works from `file://`. Set `assetsInlineLimit`/`chunkSizeWarningLimit` high and `cssCodeSplit: false`. The POC later switched to a normal build (deployed to Pages via the `example` branch) because a regular module build does NOT run from `file://` (CORS blocks `type="module"` scripts) — pick one per delivery target. Use `base: './'` for subpath hosting like GitHub Pages. (Context: POC build.)
- **[2026-08-07] Browser smoke test on Windows without downloads** — Playwright's npm package + `chromium.launch({ channel: 'msedge' })` drives the preinstalled Edge headless; no `playwright install` needed. Driving the built `file://` page also verifies the real delivery scenario. Check `console`/`pageerror` events before declaring success. (Context: POC verification.)
- **[2026-08-07] FullCalendar theming/RTL** — bridge its CSS vars (`--fc-border-color` etc.) to the app palette; pass `locale={heLocale}` + `direction="rtl"` and `key={lang}` to force a clean remount on language switch. (Context: appointments page.)
- ⚠️ **`position: fixed` overlays break inside a `backdrop-filter` / `filter` / `transform` ancestor** — those properties make the ancestor the containing block, so a "fullscreen" modal renders trapped inside that box instead of covering the viewport. Our `.card` uses `backdrop-filter: blur()`, so ANY overlay rendered from inside a card must go through `createPortal(…, document.body)`. Symptom: the overlay looks like a small mis-positioned panel. [2026-08-12] (Context: `components/compare.jsx` fullscreen compare view.)
- **[2026-08-12] Inline `style={{height}}` cannot be overridden by `:hover`** — for hover-to-expand blocks pass the size as a custom property (`style={{'--h': '80px'}}`) and set `height: var(--h)` in CSS; then `.block:hover { height: auto; min-height: var(--h); }` wins. (Context: home schedule appointment blocks that clip short slots.)
