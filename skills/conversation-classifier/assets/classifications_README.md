# Conversation Classification Tracking DB

SQLite database tracking conversation-classifier results per account and per workspace.
Designed to be **appended to daily** — each run adds the latest completed conversations idempotently.

> **Note:** the populated database is workspace-local and is intentionally **not** committed to this
> community repo, because it contains real customer conversation content and internal triage flags.
> This README documents the schema and procedure so any workspace can create and maintain its own DB
> at `skills/conversation-classifier/assets/classifications.db`.

## ⚠️ Environment note
Some sandbox `python3` builds have a **broken sqlite3 binding**. If so, use **`/usr/bin/python3`** for
ALL operations against this DB. The `sqlite3` CLI may not be installed.

## Location (Git-backed, inside the skill)
The canonical DB lives at `skills/conversation-classifier/assets/classifications.db`. Each run
**retrieves** it (via `sync_context`), copies it to `/mnt/data/classifications.db`, **updates** it,
copies it back, and **pushes** it (`save_context`). Do not store it as a separate artifact.

## File
- `classifications.db` — SQLite DB (5 tables)

## Schema
- **accounts** — `account_name` (PK), `first_tracked_at`, `last_run_at`
- **workspaces** — `workspace_id` (PK), `workspace_name`, `account_name` (FK), `first_tracked_at`, `last_run_at`
- **runs** — `run_id` (autoinc PK), `account_name`, `run_at`, `window_start`, `window_end`, `conversations_new`, `rubric_version`
- **classifications** — composite PK **(conversation_id, workspace_id)**:
  `workspace_name, account_name, conversation_started_at, conversation_last_msg_at, conversation_url,`
  `outcome, sentiment, frustration_level, use_case, use_case_raw, friction_type,`
  `expected_for_stage, recovered, defect_suspected, nudge_signal, confidence, evidence,`
  `rubric_version, classified_at, run_id, is_experience_scored`
  - `is_experience_scored` = 1 for real human conversations; **0** for scheduled/auto-refresh runs
    (first human turn is empty/None → excluded from experience scoring per rubric). Scheduled rows
    carry `use_case='scheduled_refresh'` and NULL experience fields.
  - Indexes: workspace_id, account_name, outcome, friction_type, conversation_last_msg_at.

## Accounts tracked
One row per account (a HubSpot org / `PROD.ORGANIZATIONS.NAME`). Each account maps to one or more
workspaces via `PROD.ORGANIZATIONS.NAME` → `PROD.WORKSPACES.ORGANIZATION_ID`. Resolve and store an
account's workspaces before classifying so every dataset can be scoped to them.

## Daily append procedure
1. Pull conversations whose **last message** falls in the new window (default: past 7 days, or since
   `MAX(conversation_last_msg_at)`), from PROD.MESSAGES, filtered to conversations with ≥1 human turn,
   excluding internal emails (e.g. `@zenlytic.com` and any other internal domains).
2. Reconstruct transcripts, split scheduled vs. real.
3. Classify real conversations with the current rubric; mark scheduled as `is_experience_scored=0`.
4. `INSERT OR IGNORE` into `classifications` (composite PK makes re-runs idempotent).
5. Write one `runs` row per account; update `accounts`/`workspaces` `last_run_at`.
