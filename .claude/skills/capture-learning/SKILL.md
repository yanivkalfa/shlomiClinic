---
name: capture-learning
description: Use whenever something new is figured out or learned the hard way — a bug that took real digging to fix, a non-obvious config/API/tooling behavior, a process worth repeating, a harmful pattern to avoid, or a user correction about how things should be done. Documents the learning into the right project skill (or creates a new one) so future sessions never relearn it.
---

# Capture Learning

The skills in `.claude/skills/` are **living documents**. Anything learned the hard way gets written down once, into a skill, and reused forever. This skill defines how.

## When to capture

Capture when at least one of these is true:

- It took real trial-and-error or debugging to figure out (if it was obvious, don't).
- A pattern/approach turned out to be **harmful** — it broke something, corrupted data, or wasted significant time.
- The user corrected how something should be done, or confirmed a preferred approach.
- A repeatable process was established (build steps, device setup, release flow, migration procedure).
- A tool/library/API behaved differently than documented and we adapted.

Do **not** capture: things trivially re-derivable from the code, one-off facts specific to today's session, or anything containing secrets/credentials/patient data.

## Where to put it

1. **Fits an existing skill's domain** → append to that skill's `## Learnings` section. This is the default; check existing skills first (`react`, `react-native`, `electron`, `database`, `i18n-rtl`, `security`).
2. **New domain that will recur** (e.g. first time touching the card-reader SDK, CI, or the Canon camera) → create `.claude/skills/<kebab-name>/SKILL.md` with frontmatter (`name`, trigger-rich `description`), a short body, and a `## Learnings` section. Then mention the new skill in CLAUDE.md's skills list.
3. **Cross-cutting rule about how we work** (not tied to a tech domain) → it belongs in CLAUDE.md, not a skill.

## Entry format

Append under `## Learnings` of the target skill:

```markdown
- **[YYYY-MM-DD] Short title** — what we learned and why it matters. What to do instead, if applicable. (Context: one line on where this came up.)
```

For harmful patterns, make it unmissable:

```markdown
- ⚠️ **NEVER <do the thing>** — what breaks and the safe alternative. [YYYY-MM-DD]
```

## Hygiene rules

- Keep entries to 1–3 lines. Link to a file/commit for detail instead of pasting walls of text.
- Before adding, scan the section for an existing entry on the same subject — **update it** rather than duplicating.
- If an entry turns out to be wrong or obsolete, fix or delete it. A wrong "learning" is worse than none.
- A skill whose Learnings section grows past ~30 entries should be reorganized: promote stable knowledge into the skill's body, keep Learnings for recent findings.
- Never store secrets, tokens, connection strings, or patient information in a skill.

## Learnings

(Meta-learnings about the capture process itself go here.)
