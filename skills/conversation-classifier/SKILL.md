---
name: conversation-classifier
description: Use when asked to "classify this conversation", "judge how this chat went", "score the transcript", "run the conversation classifier", "label conversations for the health pipeline", "build the gold set", to detect negative / errored / no_data experiences, or to "build a conversation diagnostics / health report for [account]" from the classified conversations. Classifies one or more customer<->AI-analyst conversations into a structured judgement (outcome, sentiment, frustration_level, use_case, use_case_raw, friction_type, expected_for_stage, recovered, defect_suspected, nudge_signal, confidence, evidence) for the account-health pipeline's Experience axis, and (via the Customer-Facing Reporting section) turns those classifications into an account-safe diagnostics report. Rubric v2.3.5. Zoë classifies directly by applying the rubric — no external API or script needed.
---

# Conversation Classifier (rubric v2.3.5)

Classifies customer↔AI-analyst conversations into structured, auditable judgements.
Stateless and single-responsibility: classify only. Account scoring, health storage,
and nudging belong to the pipeline.

**Zoë classifies directly** by reading the rubric and applying it turn-by-turn.
No external LLM call, no script, no API key required.

## Rubric

The canonical rubric lives at:
`/data_model/skills/conversation-classifier/assets/rubric_v2.3.5.md`

Read it in full before classifying. It is the system prompt / scoring authority.
Key rules are summarised below for quick reference — the asset is the source of truth.

## Output Schema

Return one JSON object per conversation, in order, echoing `id`.

```json
{
  "results": [
    {
      "id": "<conversation_id>",
      "outcome":            "resolved | partial | no_data | errored | abandoned",
      "sentiment":          "positive | neutral | negative",
      "frustration_level":  "none | mild | high",
      "use_case":           "dashboard_build | ad_hoc_analysis | sql_enablement | enablement | product_usage_analytics | support_kpi | nps_cs_analytics | data_exploration | data_modeling | other",
      "use_case_raw":       "<free-text label>",
      "friction_type":      "value_blocking | setup_learning_curve | environment_client_side | process_gating | user_clarity | null",
      "expected_for_stage": true,
      "recovered":          true,
      "defect_suspected":   false,
      "nudge_signal":       null,
      "confidence":         0.9,
      "evidence":           "<short quote or reason>"
    }
  ]
}
```

## Key Rules (summary — rubric asset is authoritative)

### Zero-human events
Handled deterministically by the runner BEFORE classification — never sent to Zoë.
Every conversation Zoë sees has at least one human turn.

### `outcome`
| Value | When |
|-------|------|
| `resolved` | User actually got the correct value; no outstanding blocker. |
| `partial` | Some progress but core need unmet. |
| `no_data` | Agent confirmed data doesn't exist or is unavailable. |
| `errored` | Technical failure (binding error, wrong result user caught, sandbox failure, **or agent never responded**) blocked the answer at any point — even if a workaround followed. |
| `abandoned` | **The USER** left without resolution. NOT when the agent went silent (that's a defect — see below). |

**Coupling rule:** `friction_type=value_blocking AND recovered=false` → outcome MUST be `errored` or `partial`, NEVER `resolved`.

### Agent silence / non-response = PRODUCT DEFECT
If the **agent** never responds to a substantive question or goes silent mid-task: `friction_type=value_blocking`, `recovered=false`, `expected_for_stage=false`, `outcome=errored` (or `partial`), `defect_suspected=true`. Do NOT call it `abandoned` or `user_clarity`. **This includes follow-up questions:** if earlier turns were answered but the user's LAST clear question gets no agent reply, it's still agent silence → `value_blocking + defect_suspected=true + outcome=partial`, never `user_clarity`.

### `sentiment` — end-state only
- `negative`: thread ends on unresolved complaint, unanswered question, user giving up, or expressed dissatisfaction.
- `positive`: **ONLY if the user EXPLICITLY signals satisfaction in their own words** ("thanks", "perfect", "great", "exactly what I needed", "love it"). A clean/successful delivery with NO user reaction is `neutral`, not positive. Do NOT infer positive from task success, agent confidence, or a smooth multi-turn build.
- `neutral`: matter-of-fact close; a stumble that is fully fixed and ends calmly is `neutral` (stumble lives in `frustration_level`). This is the default when there is no explicit user cue either way.

### `frustration_level` — PEAK moment, independent of outcome
- `high`: ALL-CAPS as a demand/rebuke ("NO", "STOP", "DO NOT", "YOU NEED TO"); "are you still there" / "why aren't you responding"; user calls out wrong/fabricated answer; same error corrected ≥2×; explicit anger.
- `mild`: single correction or mild impatience, no escalation.
- `none`: smooth, or calm polite repeats.
- **CRITICAL:** Do NOT apply a mechanical all-caps rule. Uppercase technical identifiers, acronyms, SQL keywords, column names, product/skill names (SQL, KPI, ARR, NDR, NGINX, OWNER_NAME, etc.) are NORMAL technical language — they MUST NOT raise `frustration_level`. Score from the user's INTENT and MEANING, not letter case.

### `use_case`
Pick the nearest enum. `enablement` = product how-to / "how do I" / skill-writing (distinct from `sql_enablement` which is SQL-specific). Use `other` sparingly.

### `use_case_raw`
Always the most accurate free-text label, even when it matches the enum exactly.

### `friction_type`
- `value_blocking`: product couldn't deliver — data gap, wrong/fabricated result, real failure/bug, or agent non-response. **Only type that lowers experience score.** Tag even if fixed in-thread.
- `setup_learning_curve`: learning the product in trial/onboarding/pilot — EXPECTED, positive signal.
- `environment_client_side`: browser/sandbox/network/SSO — route to support, excluded from experience.
- `process_gating`: needs human approval or process step.
- `user_clarity`: request was ambiguous; friction from clarification overhead.
- `null`: no friction.

### `expected_for_stage`
`false` if and only if `friction_type=value_blocking`. Otherwise `true`.

### `recovered` — STRICT
Only meaningful when `friction_type=value_blocking`.
- `true`: user **explicitly** received the correct value or confirmed the fix in-thread.
- `false`: user never got the answer, abandoned, kept correcting, or left frustrated. **Default to `false` when in doubt.**
- `null`: `friction_type ≠ value_blocking`.

Worked example: agent hit TVF errors, sandbox didn't restore, user never got the count → `value_blocking`, `recovered=false`, `outcome=errored`. Do NOT mark `recovered=true` just because the agent explained the failure.

### `defect_suspected` — eng-triage flag (independent of experience score)
`true` when the conversation shows a likely **product defect**: agent silence/non-response (including on follow-up questions), an unrecoverable crash/error, a wrong result traced to a product bug, or an inaccessible/broken feature (e.g. SEMANTIC_DEFINITION unreadable). Default `false`. Can be `true` even when `recovered=true` (defect occurred but was worked around).

### `nudge_signal` — proactive-enablement opportunity (does NOT lower experience)
`null`, or a short snake_case label when the user got a correct result but is **missing/not using an advanced feature** or doing it the hard way — so CS can later push a gentle tip. Most common: `verified_fields` (user manually re-verifies numbers the product could guarantee, e.g. "are you 100% sure this is correct?"). Others: `governed_metrics`, `skills`, `scheduled_refresh`, `drilldown`. The product worked, so `friction_type` stays `null` and outcome `resolved`.

### `confidence`
| Band | When |
|------|------|
| ≥0.85 | Clear outcome, unambiguous use_case, no edge cases. |
| 0.5–0.7 | Mixed signals; ambiguity in one or more fields. |
| ≤0.4 | Low-signal, very short, or truncated transcript. |

### `evidence`
Short quote or reason (1–2 sentences) citing the specific turn(s) that drove the classification.

## Overarching Rules
- **PROSE BEATS FLAGS** — what the user actually wrote overrides any boolean flag in the data.
- **LEARNING IS HEALTHY ADOPTION** — iteration and how-to questions in onboarding are positive, not friction.
- **ITERATION ISN'T FRICTION** unless the agent kept failing on the same thing.
- **CONFIRMATION-GATING = process_gating**, not value_blocking.
- **AGENT SILENCE = value_blocking + defect**, not abandoned or user_clarity — even on follow-up questions.
- `sentiment` = how the thread ENDS; `frustration_level` = the WORST moment; `recovered` = did the user actually get value.

## Classification Workflow

1. Read the rubric: `cat /data_model/skills/conversation-classifier/assets/rubric_v2.3.5.md`
2. For each conversation (in order):
   a. Check for zero human turns → deterministic `abandoned` (but runner handles this before sending to Zoë).
   b. Read all turns. Identify the worst frustration moment, the end-state sentiment, and whether value was delivered.
   c. Apply the coupling rule before finalising `outcome`.
   d. Set `recovered` strictly — default `false` when in doubt.
   e. Set `sentiment=positive` ONLY on an explicit user satisfaction cue — otherwise `neutral`.
   f. If the AGENT went silent / never responded (including on a follow-up) → `value_blocking` + `recovered=false` + `defect_suspected=true` (NOT `abandoned`/`user_clarity`).
   g. If the user got a correct result but is missing an advanced feature → set `nudge_signal` (e.g. `verified_fields`); leave `friction_type=null`.
   h. Write a concrete `evidence` quote.
3. Return `{"results": [...]}` in input order, one object per conversation.

## Persistence — SQLite tracking DB (per-account, append-only)

Classifications are persisted to a **SQLite database** so results accumulate across runs and
can be referenced/queried later. This is the canonical store for the account-health pipeline's
Experience axis.

### Environment note (IMPORTANT)
The default conda `python3` in the sandbox has a **broken `sqlite3` binding**
(`undefined symbol: sqlite3_deserialize`). Use **`/usr/bin/python3`** for ALL database
operations — it ships a working `sqlite3` (v3.40.1). The `sqlite3` CLI is not installed.

### Location — the DB lives IN this skill folder (Git-backed)
The canonical database is committed to Git **inside this skill**:
```
skills/conversation-classifier/assets/classifications.db
```
This makes the skill self-contained: the DB travels with the skill and persists across
conversations automatically. Do **not** store it as a separate artifact — the skill folder IS
the store. (Note: the community-repo copy of this skill intentionally omits the populated `.db`,
which holds real customer content — each workspace creates and maintains its own.)

### Retrieve → update → push (do this EVERY run)
The DB must be pulled from Git, updated in the sandbox, and pushed back on every run:

1. **Retrieve.** Refresh the skill from Git so you have the latest committed DB:
   run `sync_context`, then confirm `/data_model/skills/conversation-classifier/assets/classifications.db`
   exists. (On the very FIRST run this file will not exist yet — that's expected; skip to step 2
   and create it fresh.) SQLite cannot be edited in place inside `/data_model` reliably, so copy it
   into the working dir first:
   ```
   cp /data_model/skills/conversation-classifier/assets/classifications.db /mnt/data/classifications.db
   ```
2. **Update.** Open `/mnt/data/classifications.db` with `/usr/bin/python3`, classify the new
   window, and `INSERT OR IGNORE` the new rows (see idempotent-append below). On the first run,
   create the schema first.
3. **Push.** Copy the updated DB back into the skill assets folder and commit it to Git:
   ```
   cp /mnt/data/classifications.db /data_model/skills/conversation-classifier/assets/classifications.db
   ```
   then run `validate_context` and `save_context` (commit message e.g.
   `"conversation-classifier: append <N> classifications for <window>"`). Committing the `.db`
   binary is intentional — it is the persistent store.

### Schema (5 tables)
- **`accounts`** — one row per account (organization level). `account_name` PK, `first_tracked_at`, `last_run_at`.
- **`workspaces`** — the specific workspaces belonging to an account. `workspace_id` PK, `workspace_name`, `account_name` FK. An account maps to MANY workspaces (e.g. one org → several workspaces). Always resolve an account's workspaces via `PROD.ORGANIZATIONS.NAME` → `PROD.WORKSPACES.ORGANIZATION_ID`.
- **`runs`** — one row per classification run (audit): `run_id`, `account_name`, `run_at`, `window_start`, `window_end`, `conversations_new`, `rubric_version`.
- **`classifications`** — core table, one row per conversation. **Composite PK `(conversation_id, workspace_id)`** (guards against duplicate conversation ids across regions/workspaces). Carries the FULL rubric schema plus `workspace_id`, `workspace_name`, `account_name`, `conversation_started_at`, `conversation_last_msg_at`, `conversation_url`, `rubric_version`, `classified_at`, `run_id`. Booleans (`expected_for_stage`, `recovered`, `defect_suspected`) stored as 0/1/NULL; `confidence` as REAL.

### Idempotent append (dedup on re-run)
Every conversation captures its **specific workspace** (not just the account). Insert with
`INSERT OR IGNORE INTO classifications ...` keyed on `(conversation_id, workspace_id)` so
re-runs append only genuinely NEW conversations and never double-count.

### Sourcing transcripts (Snowflake)
Pull turns from `PROD.MESSAGES`, ordered by `CONVERSATION_ID, MESSAGE_POSITION_IN_CONVERSATION`.
Use `MESSAGE_TEXT_CLEAN` for turn text, `GENERATED_BY` (`HUMAN`/`AGENT`) for role, and
`CONVERSATION_URL` for the deep link. Classify a conversation only if its **last message**
falls inside the run window. Apply the standard workspace exclusions (internal emails / test
workspaces) from the workspace guidelines.

### Daily incremental run (going forward)
The intended cadence is a **daily append** of the latest COMPLETED conversations:
1. **Retrieve** the committed DB from the skill folder (see Retrieve → update → push above).
2. For each tracked account, resolve its workspaces.
3. Pull conversations whose last message is within the window AND that are not already in
   `classifications` (anti-join on `(conversation_id, workspace_id)`). Prefer a window that
   starts at `MAX(conversation_last_msg_at)` already in the DB (fall back to past 7 days if empty).
4. Classify with rubric v2.3.5, `INSERT OR IGNORE`, then write a `runs` row and update
   `accounts.last_run_at` / `workspaces.last_run_at`.
5. **Push** the updated DB back into the skill folder and `save_context` to commit it.

## Customer-Facing Reporting (account diagnostics report)

When asked to turn the classified conversations into a **report for a customer/account** (a
"conversation diagnostics", "health", or "how is Zoë doing" report), build a self-contained
React/HTML dashboard from the DB. These rules are MANDATORY and account-agnostic — they encode
lessons from the first real account build so the report is safe to send to any account.

### 1. Scope strictly to the account's own workspaces
- Resolve the account → its workspaces via `PROD.ORGANIZATIONS.NAME` → `PROD.WORKSPACES.ORGANIZATION_ID`, and filter every dataset to those `workspace_id`s (and the account's `workspace_name`). NEVER let another account's rows leak into the report. Verify with a `GROUP BY workspace_name` before building.
- Apply the standard internal exclusions (internal emails / test workspaces) as always.

### 2. Show ALL conversations, not just the problematic ones
- The explorer must load the FULL classified population for the account, with a **Show** toggle: **All / With concerns / Healthy**. Leading with a problems-only view makes a healthy account look broken (the whole population is mostly `resolved`/`neutral`/`frustration=none`). Give a balanced view and let the reviewer filter.
- Derive an `is_problematic` flag per row for the toggle: problematic = `friction_type` is a real concern (`value_blocking`, `environment_client_side`, `process_gating`, `user_clarity`) OR `sentiment=negative` OR `frustration_level` in (`mild`,`high`) OR `outcome` in (`partial`,`abandoned`,`errored`,`no_data`) OR `defect_suspected=1`. Healthy rows get a green "Healthy — no issue" root-cause label and hide the frustration badge when `none`.

### 3. Rename outcomes for a customer audience
- Display `resolved` as **"Completed"** (KPI, chart axis, filter, badges, glossary). Keep the underlying value `resolved` in the DB and in the data the app filters on — map to the display label at the render layer only (e.g. an `OUTCOME_LABEL` lookup). Do not rename the stored value.

### 4. NEVER surface `defect_suspected` in a customer-facing report
- `defect_suspected` is an internal eng-triage flag. Strip it from every visible surface: no "Defect suspected" badge on cards or in the detail modal, no glossary entry, and don't name it in chart subtitles. It stays in the DB and may still feed the internal `is_problematic` calculation, but must never be shown or labeled to the customer.

### 5. Build correct deep-link URLs on the customer's own subdomain
- The DB `conversation_url` points at `app.zenlytic.com/chat/conversation-thread-…`, which is WRONG for a customer report. Build links as `https://<account-subdomain>.zenlytic.com/chat/<CONVERSATION_METADATA_ID>` — the customer's subdomain and the **metadata id**, not the thread id.
- Pull `CONVERSATION_METADATA_ID` from `PROD.MESSAGES` (`SELECT DISTINCT CONVERSATION_ID, CONVERSATION_METADATA_ID WHERE CONVERSATION_METADATA_ID IS NOT NULL`). Some conversations have no metadata id — for those, fall back to the thread id on the same subdomain (still a valid link). Confirm the account's actual subdomain before building (e.g. `acme` for "Acme Capital").

### 6. Enrich detail from the warehouse, not just the DB
- The DB has `outcome/sentiment/…/evidence/confidence/conversation_metadata`, but the report cards/modal also want **turn count**, the **opening human message**, and the **user name/email**. Pull these from `PROD.MESSAGES` (+ `PROD.USERS`): `turns=COUNT(*)`, `first_human` = `MESSAGE_TEXT_CLEAN` at the min `MESSAGE_POSITION_IN_CONVERSATION` where `GENERATED_BY='HUMAN'`, and the user via `USER_ID → PROD.USERS`. For healthy rows (empty `evidence`), show the opening request instead and an "Assessment: no issues detected" note.

### 7. Report hygiene
- Include a **glossary** modal (linked from the hero) defining every term the report shows — but only terms that ARE shown (omit `defect_suspected`). Definitions must match rubric v2.3.5 nuances (verification ≠ frustration, length ≠ friction, correctly-reported unavailability = a correct answer).
- Use the workspace brand palette and follow the **lean-html-build** skill (move unrelated CSVs to `/mnt/data/tmp/` before `build-react.js`, restore after) so the HTML stays small and email-safe (<25 MB). Validate with `validate-webapp.py` and check the runtime-error section before presenting.
- Do NOT `save_artifact` unless the user explicitly asks — build and `present_files` only.

## Gold-Set Bootstrap

After classifying a corpus, the action-item population is:
`friction_type=value_blocking AND recovered=false`

Gold candidates for human review = any predicted `no_data` / `errored` / `sentiment=negative` / `value_blocking`. These are the rare, high-stakes classes. Human confirms/corrects → real gold rows.

## Validation Gate

Before output drives a nudge: ≥0.85 F1 on action-triggering classes (`negative` + `errored` + `no_data`) AND correct friction-typing. Below the gate → advisory only (human reviews).

## Resources

| Path | Purpose |
|------|---------|
| `assets/rubric_v2.3.5.md` | Canonical rubric — read before every classification session |
| `assets/classifications.db` | **Canonical SQLite tracking DB (Git-backed, append-only) — workspace-local, NOT shipped in this community repo** because it holds real customer conversation content. Each workspace creates/maintains its own. Retrieve → copy to `/mnt/data/classifications.db` → update with `/usr/bin/python3` → copy back → `save_context`. |
| `assets/classifications_README.md` | Schema + daily-append procedure reference for the tracking DB. |
