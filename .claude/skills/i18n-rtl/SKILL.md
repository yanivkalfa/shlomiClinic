---
name: i18n-rtl
description: Use when adding or changing ANY user-visible text, building UI layout, formatting dates/numbers/currency, or working on the language switcher — English/Hebrew translation and right-to-left layout rules that apply to all three apps (web, mobile, desktop).
---

# i18n & RTL (EN/HE)

A founding, project-wide contract: **every** piece of user-visible text exists in both English and Hebrew, and the Hebrew experience is fully RTL. The owner's spec is explicit: *"I DO NOT WANT TO ENCOUNTER ANY TEXT WHATSOEVER ANYWHERE WHICH IS NOT BEING TRANSLATED."*

## Hard rules

- **Zero hardcoded user-visible strings** in components — everything through the shared dictionary in `packages/i18n`. This includes placeholders, aria-labels, alt text, error messages, empty states, and toasts.
- Adding a key means adding it to **both** `en` and `he` in the same change. A missing translation is a bug, not a TODO.
- English is the default locale; a small `en/heb` switcher sits at the top of every app.

## Dictionary conventions

- JSON dictionaries in `packages/i18n`, keyed by feature: `visits.schedule.title`, not `title3`.
- Interpolation via named params (`{name}`, `{count}`) — never string concatenation, which breaks RTL and grammar.
- Plurals/gender handled by the i18n layer (ICU-style), not `if` statements in components.

## RTL rules

- Web/desktop: set `dir="rtl"` + `lang="he"` on the document root when Hebrew is active; use CSS **logical properties** (`padding-inline-start`, `text-align: start`) so layout mirrors automatically. Never `left`/`right` for flow-relative spacing.
- Icons that imply direction (arrows, chevrons, "next") must flip in RTL; icons that don't (phone, camera) must not.
- React Native: RTL goes through `I18nManager` and needs an app restart — see the `react-native` skill.
- Dates, numbers, currency: always `Intl.*` with the active locale. Hebrew dates and ₪ formatting come free; hand-built strings don't.

## Review checklist for any UI change

1. All new strings in the dictionary, both languages?
2. Rendered in Hebrew — any overflow, misalignment, wrong-direction icon?
3. Any `left`/`right` CSS that should be logical?

## Learnings

(Appended by the `capture-learning` skill.)

- **[2026-08-07] Dummy/user data must be bilingual too** — the owner's "no untranslated text anywhere" includes data values (names, procedure names, notes, alerts). Pattern that worked: store values as `[en, he]` arrays and resolve with an `L()` helper next to `t()`. (Context: POC.)
- **[2026-08-07] List joins are language-specific** — English "and" needs a trailing space (`'and '`), Hebrew `ו־` attaches directly to the next word with no space. Never build sentences with a hardcoded `' and '`; keep the conjunction in the dictionary. Symptom when wrong: "and1 × Botox". (Context: POC welcome message.)
- **[2026-08-07] `t('key')` coverage is checkable** — a ~40-line node script extracting `t('…')`/`t(\`…\`)` from src and diffing against the dictionary catches missing keys before runtime; enumerate dynamic template keys (`payType.${m}`) explicitly. Run it before every build. (Context: POC i18n check found 0 missing after this discipline.)
- **[2026-08-07] Centered-toast RTL gotcha** — `inset-inline-start: 50%` + `translateX(-50%)` breaks in RTL (the translate doesn't flip); provide an RTL override with `translateX(50%)`. (Context: POC toast.)
