---
name: self-diagnosis
description: >
  Trigger when the user questions Zoe's own skill/measure/metric selection in a PRIOR turn of
  this conversation — e.g. "why didn't you use a skill", "why didn't you use the [X] skill",
  "why didn't you read the skill", "why did that happen", "why did this happen", "why didn't
  you use a metric", "why didn't you use that measure", "why did it pick [wrong field/table]",
  "you used the wrong definition", "why wasn't [skill] triggered", "how can we fix this", "how
  do we fix this", "can we prevent this", or any request to explain/audit/root-cause a moment
  where the wrong (or no) skill, measure, or field definition was applied. This is a
  self-diagnostic, conversation-forensics skill — it does not answer a data question and does
  not produce a number. Do NOT trigger for a first-time data question, or for "why is revenue
  down" style business questions about the DATA itself rather than about Zoe's own reasoning.
---

# Skill / measure selection diagnosis

## Purpose

When the user challenges a routing decision Zoe already made — asking why a skill wasn't
triggered, why the wrong measure was used, why a definition was missed, or how to stop it from
recurring — this skill runs a **structured, step-by-step forensic diagnosis** of that decision.
It never guesses at what went wrong: every claim about "what the skill says" or "what field
exists" must be verified live against the actual skill files and data model, not recalled from
memory or assumed.

**Do not skip to a conclusion.** Work through every step below in order, state a finding for
each step before moving to the next, and only then synthesize the root cause and fix. This
mirrors how a human analyst debugs a wrong answer: reconstruct intent, reconstruct what was
available, reconstruct what was chosen, then find the gap.

---

## Step-by-step diagnostic procedure (run all steps, in order)

For each step, write a short, explicit finding — a sentence or two — before moving to the next
step. Do not merge steps or jump ahead. Do not present a final verdict before Step 8.

### Step 1 — Reconstruct user intent
Reread the flagged turn(s) in the conversation. State, in the user's own words as closely as
possible, what metric, dimension, entity, or outcome they were actually asking for. Note any
ambiguity in their original phrasing (e.g. a term that could map to more than one field or
skill).

**Answer this step with:** a one-line restatement of the request, plus any ambiguous terms
flagged.

### Step 2 — Enumerate every skill that could plausibly apply
Read the full current **`Git-Backed Skills — when to trigger`** section of `system_prompt.md`
and the frontmatter `description` of every file under `/data_model/skills/*/SKILL.md` (read the
live files — do not rely on memory of what a skill says, skill wording changes over time). List
every skill whose trigger description textually or semantically overlaps the Step 1 request,
even partially. Note any two skills whose trigger language overlaps or conflicts for this
request.

**Answer this step with:** the candidate skill list (including "none matched") and any
overlapping/competing triggers found.

### Step 3 — Enumerate every governed field/measure that could plausibly apply
Run `search_fields` with keywords drawn from Step 1 (and re-run with synonyms if the first pass
looks thin — don't rely on a single keyword set). List every field/measure returned that could
plausibly answer the request, including its `field_id` and view. If a candidate skill from Step
2 references specific governed measures by `field_id`, open that skill file and confirm those
measures still exist and still match what the skill claims about them.

**Answer this step with:** the candidate field/measure list and confirmation (or contradiction)
of what the relevant skill claimed about them.

### Step 4 — Verify the query path works through the PARSER, not just as admin
Explore users and Zoë-in-chat for non-admins **always** run queries through the SQL parser
(parsed mode), which is stricter than the direct/admin execution path. A query pattern that
succeeds for an admin can fail for explore users — the parser rejects raw command batches
(e.g. `EXEC('...')` → "Statement type Command is not allowed"), cannot resolve table-valued
functions or objects it can't see at parse time (surfaced as "Invalid object name" or
"column does not exist"), and enforces the governed layer more tightly. **This is required
because an issue invisible to an admin will still break every explore user.**

For the query pattern implicated in the flagged turn (whether it came from a skill's documented
SQL or was hand-written), do the following:
- Re-run the exact pattern through `sql_query` and record whether it succeeds in parsed mode.
- If a candidate skill from Step 2 documents a specific invocation form (e.g. an `EXEC` wrapper,
  a TVF call, a specific `FROM` shape), test that documented form specifically — do not assume
  the skill's claim that it "works" is still true. Quote the skill's claim and state whether the
  parser confirms or contradicts it.
- Prefer a governed-field path (from Step 3) that is parse-mode-valid over any raw pattern that
  only works in admin/direct mode. If the governed path answers the request, that is the path an
  explore user can actually run.

**Answer this step with:** whether the implicated query pattern passes the parser, whether any
skill-documented invocation form is contradicted by the parser, and which path is parse-mode-safe.

### Step 5 — Check the underlying database table for schema drift
A field referenced by a skill or defined in the data model can silently break if the underlying
warehouse table/column was renamed, retyped, dropped, or moved. Verify the physical objects
behind the fields implicated in Steps 2–4 still exist and still match what the skill/model
claims. This is the add-data / discovery path (not the answering path), so a direct catalog
query is sanctioned here.

- For each implicated view/field, get the underlying object from the `sql` property returned by
  `search_fields` (database.schema.table and the physical column name in its exact bracket/quote
  form).
- Confirm the table exists and the column exists with the expected name and type via a direct
  metadata query against `INFORMATION_SCHEMA.COLUMNS` (or `INFORMATION_SCHEMA.TABLES` /
  `sys.objects` for a TVF), run in direct/non-parsed mode on the correct model/connection. Match
  on the exact physical name — a snake_case vs. spaced/bracketed mismatch is itself a finding.
- If a skill hard-codes a physical column, table, or function name, confirm that literal name
  still resolves in the database. A name that appears in the skill or model but not in
  `INFORMATION_SCHEMA` is drift and is the likely root cause.

**Answer this step with:** for each implicated field, whether the underlying table/column/function
still exists and matches (name + type); flag any drift found, or state "no drift detected."

### Step 6 — Reconstruct what Zoe actually did
From the conversation transcript, state plainly: which skill (if any) was read/applied, which
measure/field/table was actually used, and what SQL logic or definition was actually run. If no
skill was triggered at all, say so explicitly rather than inferring one was used.

**Answer this step with:** the actual skill/measure/definition applied (or "none").

### Step 7 — Compare what Zoe did against what was available to locate the gap
Identify precisely where the actual behavior (Step 6) diverged from the available correct
options (Steps 2–5). Classify the gap into one (or more) of these categories:
- **Missing/weak trigger language** — the correct skill exists but its description didn't
  contain a keyword/phrasing that matched the user's actual wording.
- **Overlapping/competing skills** — two skills' descriptions both plausibly matched, and the
  wrong one won.
- **Missing governed field** — no measure/field existed yet for the requested concept, so one
  had to be improvised.
- **Field existed but wasn't surfaced** — `search_fields` should have returned it but didn't
  (bad keywords) or it was returned but not selected.
- **Skill existed and matched but was not read** — the trigger should have fired on the plain
  language used, and did not.
- **Skill was read but its instructions were not followed** — e.g. a required confirmation
  question was skipped, or the wrong table/column pairing from the skill was used anyway.
- **Parser-incompatible query path** — the pattern used (or documented by the skill) works in
  admin/direct mode but is rejected by the parser, so it fails for every explore user even if it
  succeeded for the admin (evidence from Step 4).
- **Underlying schema drift** — a table/column/function referenced by the skill or data model was
  renamed, retyped, dropped, or moved in the warehouse, so the field no longer resolves (evidence
  from Step 5).
- **Correct all along** — Zoe's original choice was actually right; the user's expectation, not
  Zoe's routing, was the mismatch (state this plainly if true — do not manufacture a gap that
  doesn't exist).

**Answer this step with:** the specific gap category (or categories) and the evidence for it.

### Step 8 — State the root cause
In one or two sentences, state the single most likely root cause — not a list of possibilities.
If Step 7 identified multiple contributing gaps, name the primary one and note the secondary one
separately.

**Answer this step with:** one root-cause sentence.

### Step 9 — Propose the minimal, verified fix
Propose the smallest concrete change that would have prevented the miss, and route it correctly
per this workspace's standing rule (**"Meta-rule: routing 'save this' requests"** in
`system_prompt.md`): numeric/definitional truth → a view measure; routing, disambiguation, or
trigger wording → a skill description or SKILL.md body; always-on behavioral rules → the system
prompt. Before proposing the fix, re-open the exact file(s) you intend to change and quote the
current wording you'd replace or add to — never propose a fix against wording you haven't just
re-read.

Then ask the user whether to apply the fix now (this skill diagnoses; it does not silently edit
the data model). If the user confirms, follow the normal context-editing workflow: `sync_context`
→ edit → `validate_context` → `save_context`.

**Answer this step with:** the proposed fix, the exact file/section it targets, and a question
confirming whether to apply it.

---

## Hard rules

- **Never assert what a skill or field says from memory.** Every reference to skill wording or
  field/measure availability in this diagnosis must come from a fresh read of the actual file or
  a fresh `search_fields` call in this turn, not from earlier context that may be stale.
- **Don't conflate "Zoe was wrong" with "the user's expectation differs from the governed
  definition."** Step 5 explicitly allows for the finding that the original behavior was correct.
- **This skill produces a diagnosis and a proposed fix — not a live data answer.** Do not fetch
  or restate business numbers as part of running this skill; if the user separately wants the
  corrected figure re-pulled, do that as a normal follow-up after the diagnosis.
- **One step, one finding, in order.** Do not compress the nine steps into a single paragraph
  or skip to Step 8/9 without showing Steps 1–7.
- **Always test the parser path and the underlying table (Steps 4–5).** An admin-only check is
  incomplete: explore users always go through the parser, and a field can silently drift in the
  warehouse. Never conclude a diagnosis without a fresh parser test of the implicated query and a
  fresh `INFORMATION_SCHEMA`/catalog check of the implicated physical objects.
