---
name: database
description: Use when designing schema, writing migrations, queries, or data-access code (apps/server) — table design, indexing, the clinic data model, and PostgreSQL specifics. Also consult before any decision that assumes a particular database engine.
---

# Database

## Engine decision

**Leaning PostgreSQL, not final.** The data model (see CLAUDE.md) is clearly relational — users → visits → treatments → products, payments, rewards — which favors Postgres. Confirm with the owner before the first migration hard-commits the choice. If Postgres: use a migration tool from day one (e.g. Drizzle/Prisma/Knex migrations) — no hand-applied schema changes.

## The data model

The authoritative planned schema is mirrored in CLAUDE.md ("Planned data model") from `database structure.xlsx`. Key shape:

- `users` ← `visits` ← `treatments` (one per procedure per visit) ← `treatments_products`
- Static catalogs: `procedures`, `products` (+ `procedures_products` link)
- Money: `payments` (linked to treatments + external invoices), `ex_invoices`
- Stock: `inventory`, `orders`
- Rewards: `reward` definitions (conditions/restrictions) + per-user granted `rewards`
- Legal: questionnaire tables + signed copies stored as PDFs per user per treatment

## Conventions

- `snake_case` for tables/columns; singular FK naming `<table>_id`; every table gets `id`, `created_at`, `updated_at`.
- Money as `integer` cents (or `numeric`), **never float**.
- Timestamps as `timestamptz`, UTC in the database; locale/timezone formatting happens at the edge.
- Soft-delete (`deleted_at`) for anything medical/financial — patient history and payment records are never hard-deleted.
- Patient data is sensitive: encryption at rest required (see `security` skill); no production data in fixtures or tests.

## Learnings

(Appended by the `capture-learning` skill.)
