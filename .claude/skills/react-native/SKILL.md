---
name: react-native
description: Use when working on the client mobile app (apps/mobile) — React Native components, navigation, native modules, platform-specific behavior, or RTL on iOS/Android. The mobile app is a smaller, simpler companion to the website.
---

# React Native (client mobile app)

## Role of the mobile app

A deliberately **smaller/simpler version of the client website** — patients viewing appointments, their visit history, rewards, and notifications. It is not the admin/management surface; that is the Electron desktop app. When a feature's home is ambiguous, default to web/desktop and keep mobile thin.

## Hard rules

- Reuse before rewrite: business logic, validation, and types come from `packages/core`; translations from `packages/i18n`. The mobile app should mostly be screens and navigation glue.
- Same i18n contract as everywhere: no hardcoded user-visible strings, EN/HE complete (see `i18n-rtl` skill).
- RTL on native goes through `I18nManager` (`allowRTL`/`forceRTL`) and requires an app restart to apply — design the language switch flow with that constraint in mind.
- No patient data cached unencrypted on device; anything persisted locally uses secure storage (Keychain/Keystore).

## Conventions

- Test on both platforms before considering a screen done; platform forks via `Platform.select` kept inside the component, not scattered.
- Prefer built-in / community-standard modules (react-navigation, etc.) over niche dependencies — mobile dependency rot is expensive.

## Learnings

(Appended by the `capture-learning` skill.)
