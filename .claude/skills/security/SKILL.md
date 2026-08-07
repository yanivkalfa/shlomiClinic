---
name: security
description: Use when working on authentication, login, session handling, encryption, key storage, patient data handling (photos, medical records, signed forms), payment flows, or anything that touches personally identifiable / medical information in any of the apps.
---

# Security & Patient Data

This system holds **medical data**: patient identities, health alerts, before/after photos of faces, signed consent forms, and payment history. Treat every feature as if a privacy regulator and the patients themselves will read the code.

## Authentication (local login)

- Passwords hashed with **argon2id** (or bcrypt if argon2 is unavailable) — never reversible encryption, never plaintext, never a homemade scheme.
- Local desktop login backs onto the same rule; unlock keys derive from the password (e.g. via the OS keychain / Electron `safeStorage`), so a stolen disk is useless without credentials.
- Sessions expire; the desktop app auto-locks after inactivity (a clinic front desk is a semi-public place).

## Data at rest & in transit

- Database encryption at rest; patient photos and signed PDF forms encrypted on disk, not sitting in an open folder.
- TLS for anything that leaves the machine. No patient data in logs, error reports, or analytics.
- Backups are as sensitive as the live database — same encryption bar.

## Payments

- Card data **never** enters our code or database. The physical terminal handles the card; we store only amount, method, status, and the terminal's transaction reference.

## Repo hygiene

- No secrets, tokens, connection strings, or real patient data committed — ever. Fixtures use invented people.
- `.env` files are git-ignored from day one; a `.env.example` documents required variables with dummy values.

## Learnings

(Appended by the `capture-learning` skill.)
