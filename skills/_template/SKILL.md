---
name: Template Skill
description: >-
  TEMPLATE — not a real skill. Replace this with a specific description of when Zoë should
  load the skill: the exact questions, phrasings, and request types that should trigger it,
  plus what should NOT trigger it. This directory is a starting point; copy it to
  skills/<your-skill-name>/ and edit.
enabled: false
---

# Template Skill

> Delete this note when you start editing. This file shows the structure every skill in the
> library follows. Keep `enabled: false` on the template so Zoë never loads it directly.

## Purpose

One or two sentences on what this skill helps Zoë do and why it exists — the analysis
pattern, calendar, style guide, or workflow it encodes.

## When to use / when not to

- **Use when:** list the concrete situations, metrics, or phrasings that should activate it.
- **Do NOT use when:** list look-alike requests that a different skill (or no skill) should
  handle, so this one doesn't misfire.

## Instructions

Detailed, step-by-step directions for Zoë. Be as specific as needed — skills have no hard
length limit.

- If the skill relies on governed metrics or dimensions, tell Zoë to resolve them through
  `search_fields` first and to build queries on the returned `sql`, never on remembered
  column names.
- Include worked examples where they help.
- Note any assumptions about the workspace's data model so someone pulling the skill knows
  whether it fits their schema.

## Supporting files (optional)

Reference up to 5 files placed alongside this `SKILL.md` (e.g. `example.csv`, `logo.png`).
Describe what each is and how Zoë should use it.
