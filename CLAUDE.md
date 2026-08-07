# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

- Remote: https://github.com/yanivkalfa/shlomiClinic.git (origin), branch `main`.
- `POC/` contains a **working phase-1 mock** (see below). The monorepo folders under `apps/` and `packages/` are still empty scaffolding.

## POC (phase-1 admin mock)

`POC/` is a Vite + React 19 app implementing the full admin-side dummy from the spec.

```
cd POC
npm install        # once
npm run dev        # dev server
npm run build      # normal Vite build -> POC/dist/ (git-ignored)
npm run preview    # serve the build locally
```

- **Branch model**: `main` holds the full project source. `.github/workflows/deploy-poc.yml` builds the POC on every push to `main` that touches `POC/` and publishes `POC/dist` to the **`example`** branch — that branch holds only the built site and is the GitHub Pages source (`main` never serves Pages). Vite `base` is `'./'` so the build works under the Pages subpath.
- Demo login: `shlomi` / `clinic123` (defined in `POC/src/data.js` as `ADMIN`).
- All state is in-memory by design (spec: "don't save anything") — no localStorage.
- Every user-visible string goes through `POC/src/i18n.jsx` (`t()`/`L()`); dummy data values are bilingual `[en, he]` arrays resolved by `L()`.
- Verification: an i18n coverage script (extracts `t('…')` keys from src and diffs against the dictionary) plus a Playwright smoke test against `npm run preview` using Edge (`chromium.launch({ channel: 'msedge' })` — no browser download needed on Windows).

## What this project is

A management system for an aesthetics clinic specializing in facial injections (Botox, fillers, permanent makeup): customer/patient handling, visits and scheduling, medicine inventory, orders, payments, rewards/referrals, legal forms, and statistics.

Three applications plus a backend:

- **apps/web** — client-facing website, latest React stack (Vite).
- **apps/mobile** — client mobile app, React Native; deliberately a smaller/simpler version of the website.
- **apps/desktop** — the clinic management app (Electron + React): the doctor's tool for onboarding clients, running visits, taking client photos (Canon camera over USB), and charging payments via a physical credit-card terminal. Local login with local encryption.
- **apps/server** — API + database. Engine leaning **PostgreSQL** (vs Mongo) — not final; confirm before the first migration.

Shared code lives in `packages/`: `core` (business logic, types, hardware adapter interfaces), `ui` (shared React components for web + desktop), `i18n` (EN/HE dictionaries). Reuse from packages before writing app-local code.

**Phase 1 deliverable** (fully specified in `POC/Clinic App designer text.txt`, implemented in `POC/`): a client-side-only, fully functional dummy of the **admin side** to demonstrate the workflow. No server. Read that file end-to-end before changing the mock — its own first rule: if anything is not 100% clear, stop and ask the owner before generating code.

## Living skills — capture what you learn

`.claude/skills/` holds project skills that are **living documents**: `capture-learning` (the meta-skill — read it), `react`, `react-native`, `electron`, `database`, `i18n-rtl`, `security`. Whenever something is figured out the hard way — a tricky bug, a non-obvious behavior, a harmful pattern, a user correction — invoke `capture-learning` and record it in the relevant skill's Learnings section (or a new skill) instead of letting it be relearned next session.

## Source-of-truth documents

- `POC/Clinic App designer text.txt` — complete page-by-page spec for the phase-1 admin mock: layout, every page (`############### P.`) and reusable template (`############### T.`), behaviors, and styling.
- `database structure.xlsx` — the planned data model (single sheet; schema mirrored below since the binary file isn't greppable).

## Hard requirements from the spec (phase 1)

- **i18n is non-negotiable**: every text/title/entry translated EN ↔ Hebrew via a custom JSON dictionary; Hebrew is full RTL; small en/heb switcher on top; default English. No untranslated text anywhere — pages, modules, popups.
- **Single `.html` file** output the owner can download and open. Tech stack: latest/most sophisticated, Vite + React unless something better.
- **No persistence** — no localStorage, nothing saved. Mock/dummy data only: at least 2 dummy entries for everything, example images where needed.
- Camera: the design must anticipate direct image capture from a Canon digital camera over USB (mocked for now).
- Suggested libraries (optional): FullCalendar (schedule/Google Calendar), Cropper.js (profile photo zoom/crop), Chart.js (finances/stats).
- Styling: deep-blue and orange-golden, dynamic background, warm beauty-salon lighting, futuristic and clean, slightly rounded borders.
- Lines marked `[optional line - toggle via app options page]` in the spec must each get an enable/disable toggle on the App settings page.
- Admin layout is 3 panels: left actions menu / middle content / right tools panel (quick-access icons, mini calendar, "Clinic pulse" alerts, today's treatments). Right panel collapsible for mobile.
- Working hours come from parsing a Google Calendar event titled `"Clinic Open 8-12, 13-14, 18-20"` — the daily schedule view opens only within those hours and splices out unscheduled time.

## Planned data model (from database structure.xlsx)

Index-based relational tables; `X-index` columns are foreign keys.

- **Users**: index, ID, first/last name, birth, phone, email, address, wallet points, alerts, notes
- **Visits**: index, date, time start/end, User-index
- **treatments** (user ↔ procedure per visit): index, procedure-index, User-index, Visit-index, cost
- **treatments-prods** (products used per treatment): index, treatments-index, product-index, amount-used
- **payments**: index, date, type, amount, status, transactionID, External-Invoice-index, treatments-index
- **Ex-Invoices** (external invoices): index, date, service, service identifier
- **procedures** (static catalog): index, Name, cost, action duration, visits-count, longevity
- **procedures-prods**: index, procedures-index, product-index
- **product** (static catalog): index, Name, company, common use, packaging, notes
- **inventory** (dynamic counts): index, product-index, count
- **orders**: index, product-index, date, seller, batch count, cost, notes
- **Reward** (static reward definitions): index, Name, date-init/end, value (percent/cash/points), redemption mode, restrictions (procedure-indexes), condition + term + value
- **Rewards** (per-user granted): index, User-index, Reward-index, Manual-description, status (active/used/expired), dates, restrictions, actual value on redemption
- **user questionnair / user-q-questions / user-q-options / user questionnair signed** — admin-built legal forms; signed copies become PDFs stored per user per treatment (server-side, future phase)

Reward conditions are predetermined: 'Birthday month', 'Number of visits', 'Number of treatments', 'Money spent', 'Wallet points', 'Referred user count', 'Membership duration', 'Frequency of visits', 'Coupon Text'. Smart values use `#` (e.g. `#CurrentMonth`). Admins can also grant a free-form manual reward directly to a user.
