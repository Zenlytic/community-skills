# Contributing a skill

Skills in this library must be usable **as-is** when copied into a workspace's `skills/`
directory, so they follow Zenlytic's skill format exactly.

## Add a new skill

1. Copy the template into a new directory named after your skill (kebab-case):

   ```bash
   cp -r skills/_template skills/my-skill-name
   ```

2. Edit `skills/my-skill-name/SKILL.md`:
   - Set `name` to the skill's display name.
   - Write a **specific** `description` — Zoë uses it to decide when to load the skill, so
     spell out the questions/requests that should trigger it, and note what should *not*.
   - Set `enabled: true` (or remove the line — omitted means enabled).
   - Write the instructions below the front matter.
3. Add up to 5 supporting files (logos, examples, reference tables) in the same directory if
   the skill needs them.
4. Add a row for the skill in [CATALOG.md](CATALOG.md).
5. Open a pull request.

## SKILL.md format

```yaml
---
name: My Skill Name
description: >-
  Trigger when the user asks ... Also triggers for "...". Do NOT trigger for ...
enabled: true
---

# My Skill Name

## Purpose
...

## Instructions
...
```

- **`name`** (required) — display name.
- **`description`** (required) — when Zoë should load it. Be concrete about triggers.
- **`enabled`** (optional) — `false` hides the skill from Zoë. Omitted = enabled.

## Authoring guidance

- **One skill, one job.** Narrow, well-triggered skills beat broad catch-alls.
- **Be explicit about data access.** If a skill depends on governed fields, instruct Zoë to
  resolve metrics/dimensions via `search_fields` rather than inventing column names.
- **State negatives.** "Do NOT trigger for X" prevents a skill from firing on the wrong
  questions.
- **Keep it portable.** Don't hard-code a single workspace's table names unless the skill is
  meant only for workspaces that share that schema — note the assumption if so.
- **Test after pulling.** When a skill is pulled into a workspace, verify it loads (check the
  tool-call details for skill usage) and produces correct results before relying on it.
