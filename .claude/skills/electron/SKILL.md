---
name: electron
description: Use when working on the clinic management desktop app (apps/desktop) — Electron main/preload/renderer architecture, IPC, packaging, auto-update, local data encryption, or hardware integrations (Canon camera capture, physical credit-card terminal, receipt printing).
---

# Electron (clinic management desktop app)

This is the doctor's primary tool: onboarding clients, running visits, taking before/after photos, charging payments on a physical terminal. It must stay reliable and secure — it handles medical data.

## Security baseline (non-negotiable)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` for all renderer windows.
- Renderer never touches Node/OS APIs directly. Everything crosses a **typed IPC bridge** exposed via the preload script (`contextBridge.exposeInMainWorld`), with a narrow, explicit channel list — no generic `invoke(anything)` passthrough.
- Validate every IPC payload in the main process; treat the renderer as untrusted.
- Local secrets (tokens, DB keys) go through Electron `safeStorage` / OS keychain — never plaintext files.

## Architecture

- Renderer is React and follows the `react` skill; shared components from `packages/ui`, logic from `packages/core`.
- Main process owns: window lifecycle, hardware access, local persistence/encryption, auto-update.
- **Hardware behind adapters**: camera (Canon — likely EDSDK or WIA on Windows) and the card-payment terminal (vendor SDK, serial/HID) each get an interface in `packages/core` plus a mock implementation. UI code depends on the interface only, so development and tests run without physical devices, and vendors can be swapped.
- Payment terminal integration is certification-sensitive: card data never passes through our code — the terminal handles it; we only send amount + receive result/reference.

## Conventions

- One feature = one IPC namespace (e.g. `camera:capture`, `payment:charge`, `db:query` is **forbidden** — expose intent-level operations, not raw DB access).
- Test packaging early (electron-builder/Forge) — native modules and code signing surprises are cheaper to find at the start.

## Learnings

(Appended by the `capture-learning` skill.)
