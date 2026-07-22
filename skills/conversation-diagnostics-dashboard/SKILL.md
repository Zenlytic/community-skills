---
name: conversation-diagnostics-dashboard
description: >
  Use when a user asks to build, create, generate, or refresh a conversation
  diagnostics / health / quality dashboard or report for a specific customer
  account from classified conversations — e.g. "build a conversation diagnostics
  dashboard for [account]", "create a Zoë health report for [account]", "how is
  Zoë doing at [account], put it in a dashboard", "evaluate our conversations at
  [account]", "make the conversation-quality report for [account]". This skill is
  the BUILD half of a two-step flow: (1) assess/classify conversations with the
  `conversation-classifier` skill, then (2) build the review dashboard with THIS
  skill. Produces a self-contained, interactive, brand-styled HTML dashboard that
  shows ALL classified conversations (not just problematic ones), scoped strictly
  to the account's own workspaces, with correct customer-subdomain deep links,
  "Completed" outcome labeling, a glossary, and NO internal defect labeling —
  i.e. safe to send to the customer. Present only; do not save as an artifact
  unless the user explicitly asks.
---

# Conversation Diagnostics Dashboard

Turns the classified conversations for a customer account into a polished, self-contained
HTML dashboard for reviewing how the AI analyst (Zoë) is performing — safe to send to the
customer.

**This is step 2 of a two-step flow.** Step 1 is assessment: classify the account's
conversations with the **`conversation-classifier`** skill, which writes them to its
Git-backed SQLite DB (`skills/conversation-classifier/assets/classifications.db`). This skill
reads that DB and builds the dashboard. If the account has not been classified yet, run the
classifier first (or tell the user), then build.

> The customer-safe reporting rules also live in the `conversation-classifier` skill under
> its **"Customer-Facing Reporting"** section. This skill is the detailed, reproducible build
> procedure for that report. Keep the two consistent.

---

## Inputs you need before building

1. **Account name** and its **Zenlytic subdomain** (e.g. account "Acme Capital" → subdomain
   `acme` → links on `https://acme.zenlytic.com`). Confirm the subdomain — do not
   guess it. If unsure, ask the user or look it up.
2. **Classified rows** for that account in the classifier DB. Confirm they exist and note the
   `run_id` / `rubric_version`.

---

## Data preparation (SQL + SQLite)

Build TWO datasets. Use `/usr/bin/python3` for ALL SQLite work (the conda `python3` has a
broken `sqlite3` binding).

### A. Resolve the account's workspaces (scope guard)
Resolve the account → its workspaces via `PROD.ORGANIZATIONS.NAME` →
`PROD.WORKSPACES.ORGANIZATION_ID`. Every dataset MUST be filtered to those `workspace_id`s.
Apply the standard internal exclusions (internal emails / test workspaces). **Verify scope with
a `GROUP BY workspace_name` before building — no other account's rows may appear.**

### B. Summary dataset (drives KPIs + overview charts) — one row per conversation
From the classifier DB, for the account's workspaces:
`started_at, outcome, sentiment, frustration_level, use_case, friction_type, recovered,
defect_suspected, workspace_name`.

### C. Detail dataset (drives the explorer cards + modal) — one row per conversation
Join the DB classification with warehouse enrichment. Columns:
`conversation_id, workspace_name, workspace_id, started_at, last_msg_at, outcome, sentiment,
frustration_level, use_case, use_case_raw, friction_type, recovered, defect_suspected,
nudge_signal, confidence, evidence, conversation_url, turns, first_human, root_cause, user,
user_email, is_problematic`.

Enrichment (NOT in the DB) comes from `PROD.MESSAGES` (+ `PROD.USERS`), keyed on
`CONVERSATION_ID`:
- `turns` = `COUNT(*)` of messages in the conversation.
- `first_human` = `MESSAGE_TEXT_CLEAN` at the min `MESSAGE_POSITION_IN_CONVERSATION` where
  `GENERATED_BY='HUMAN'`.
- `user` / `user_email` = via `USER_ID → PROD.USERS`.
- `conversation_url` — see **Deep links** below (do NOT use the DB `conversation_url`).

Derived fields:
- **`is_problematic`** (1/0) drives the Show toggle. A row is problematic if ANY of:
  `friction_type` in (`value_blocking`,`environment_client_side`,`process_gating`,`user_clarity`)
  OR `sentiment='negative'` OR `frustration_level` in (`mild`,`high`) OR `outcome` in
  (`partial`,`abandoned`,`errored`,`no_data`) OR `defect_suspected=1`.
- **`root_cause`** — a short human label of the underlying cause for problematic rows
  (e.g. "Project/field name resolution", "Data grain / movement aggregation", "Waterfall /
  measure logic", "Null-filtering / wrong column", "Dashboard build/persistence bug", "Field
  availability confusion", "Abandoned / no agent response", "Other"). For healthy rows use
  **"Healthy — no issue"**. Derive from `friction_type` + `evidence` + `nudge_signal`; when a
  verification nudge drove a value_blocking flag, root_cause = "Project/field name resolution".

### Deep links (CRITICAL — customer subdomain + metadata id)
The DB `conversation_url` points at `app.zenlytic.com/chat/conversation-thread-…`, which is
WRONG for a customer report. Build links as:
```
https://<subdomain>.zenlytic.com/chat/<CONVERSATION_METADATA_ID>
```
Pull the metadata id from `PROD.MESSAGES`:
```sql
SELECT DISTINCT CONVERSATION_ID, CONVERSATION_METADATA_ID
FROM PROD.MESSAGES
WHERE WORKSPACE_ID IN (<account workspaces>)
  AND CONVERSATION_METADATA_ID IS NOT NULL
```
Map each conversation to its metadata id. Some conversations have no metadata id — for those,
**fall back to the thread id** on the same subdomain (still a valid link). Verify after build
that every link starts with `https://<subdomain>.zenlytic.com/chat/`.

Write both datasets as `question-*.csv` in `/mnt/data/` (the build embeds them). Keep a copy in
`/mnt/data/tmp/` for the lean-build restore step.

---

## The dashboard (React/HTML)

Read `react-artifact` + `chart-design` (and follow `style-guide`) before writing JSX. Build a
single `App` component in `/mnt/data/source/app.jsx`; the `.html` is a build OUTPUT only.

**Start from the reference build.** `assets/dashboard.template.jsx` is the proven, customer-safe
implementation (from a real account build) — all shadcn-style primitives, helpers, colors, the
glossary modal, the Show toggle, the four overview charts, the detail modal, and the deep-link
handling are already correct in it. Copy it to `/mnt/data/source/app.jsx` and adapt: the account
name + subdomain, the two dataset `question-*` ids in `window.loadData(...)`, the playbook copy,
and any account-specific root-cause labels. Do NOT rebuild it from scratch — you will re-introduce
the mistakes this skill exists to prevent:
```
cp /data_model/skills/conversation-diagnostics-dashboard/assets/dashboard.template.jsx /mnt/data/source/app.jsx
```

### Brand
Header/hero background `#062810`; page background `#F7F3E8`; ink `#2D3B30`; accent greens
`#3D5A47` / `#5A7A62` / `#7CB77F`; Zenlytic data-viz palette for series. Source Serif Pro for
headings/KPI numbers, Inter for everything else. Include a subtle "Powered by Zenlytic" style
per the style guide.

### Layout (top → bottom)
1. **Hero** — account name + "Conversation Diagnostics", one-line balanced framing ("Every
   conversation is reviewable below…"), and a **glossary link** that opens a modal.
2. **Global time-window filter** (sticky) — presets (All / Early / Q1 / Recent) + from/to date
   inputs. Everything below responds to it.
3. **KPI strip** (4 cards) — Conversations, **Completed** (= resolved, %), With concerns (%),
   High frustration. Lead with the positives; do NOT lead with defects.
4. **Overview charts** — Outcomes (bar), Use-case mix (bar), Monthly volume vs. conversations
   with concerns (column+line trend with the active window shaded), Root causes among
   conversations with concerns (bar).
5. **Conversation explorer** — a **Show toggle (All / With concerns / Healthy)**, filters
   (Search, User multi-select, Root cause, Outcome, Sort), and a responsive grid of clickable
   cards. Each card → a **detail modal** (opening request, assessment/what-went-wrong, badges,
   metadata grid, and an "Open conversation in Zenlytic ↗" deep link).
6. **Playbook section** (optional) — maps recurring root causes to concrete data-model changes.

### Non-negotiable report rules (customer-safe)
These are the lessons the report MUST encode. Getting any of them wrong makes the report unsafe
to send.

1. **Show ALL conversations**, not just problematic. The explorer loads the FULL detail set and
   defaults the Show toggle to **All**. A problems-only view makes a healthy account look broken
   — most conversations are `resolved`/`neutral`/`frustration=none`.
2. **"Completed", not "Resolved".** Display `outcome='resolved'` as **"Completed"** everywhere
   (KPI, chart axis, filter option, card + modal badges, glossary). Map at the RENDER layer via
   an `OUTCOME_LABEL` lookup — keep the stored value `resolved` (filters, colors, DB unchanged).
3. **NEVER surface `defect_suspected`.** It is an internal eng-triage flag. No "Defect
   suspected" badge on cards or in the modal, no glossary entry, and never name it in a chart
   subtitle. It may still feed `is_problematic` internally, but must be invisible to the
   customer. (The field can remain in the embedded data; just never render or label it.)
4. **Correct deep links** on the customer subdomain with the metadata id (see Deep links).
5. **Scope strictly** to the account's workspaces (see Data preparation A).
6. **Healthy rows read as healthy** — green "Healthy — no issue" root-cause badge, hide the
   frustration badge when `none`, and in the modal show the opening request + an "Assessment: no
   issues detected — the conversation completed cleanly" note instead of "What went wrong".
7. **Glossary shows only terms the report shows** — define outcome (Completed/Partial/No
   data/Errored/Abandoned), sentiment, frustration, friction type, and flags (Recovered, Nudge
   signal) — but OMIT defect. Definitions must match rubric v2.3.5 nuances (verification ≠
   frustration; length/iteration ≠ friction; correctly-reported unavailability = a correct
   answer).

### Implementation notes (from the reference build)
- **All React hooks unconditionally, before any early return** (prevents "rendered more hooks"
  crashes). Put a loading early-return AFTER all `useState`/`useMemo`.
- CSV values load as **strings** — coerce numbers on load (`turns`, `confidence`, `recovered`,
  `defect_suspected`, `is_problematic` → `Number(...) || 0`).
- Column names are case-sensitive; the detail CSV uses lowercase snake_case headers.
- The Show toggle filters the explorer only; KPIs/charts respond to the time window. Compute a
  `concernsN` = count of `is_problematic===1` in the window for the toggle labels + KPI.
- Root-cause chart + options and the monthly "concerns" trend series must count only
  `is_problematic===1` rows.

---

## Build, validate, deliver

Follow the **lean-html-build** skill so the HTML stays small and email-safe:
1. Move every `question-*.csv` NOT used by the app into `/mnt/data/tmp/` before building.
2. `node /scripts/build-react.js /mnt/data/source/app.jsx /mnt/data/outputs/<account>-conversation-report.html`
3. Restore the moved CSVs.
4. Read the build's `--- Runtime error check ---`; fix and rebuild until clean.
5. `python /scripts/validate-webapp.py /mnt/data/outputs/<account>-conversation-report.html`
   (expect "Validation PASSED"). Confirm file size < 25 MB with `ls -lh`.
6. Verify (decode the embedded dataset) that every deep link starts with
   `https://<subdomain>.zenlytic.com/chat/` and that only the account's workspace appears.
7. `present_files` the HTML with a friendly display name. **Do NOT `save_artifact` unless the
   user explicitly asks.**

---

## Two-step flow recap

1. **Assess** → `conversation-classifier` skill: classify the account's conversations with
   rubric v2.3.5, append to the Git-backed DB, `save_context`.
2. **Build** → THIS skill: read the DB, prepare the two datasets (scoped + enriched + correct
   links), build the customer-safe dashboard, validate, present.

## Resources

| Path | Purpose |
|------|---------|
| `assets/dashboard.template.jsx` | The proven reference build — copy to `/mnt/data/source/app.jsx` and adapt. Start here. |
| `conversation-classifier` skill | Step-1 assessment + the canonical Customer-Facing Reporting rules and the classifications DB. |
| `lean-html-build` skill | Keeps the built HTML small/email-safe. |
| `react-artifact`, `chart-design`, `style-guide` skills | Build + design standards for the dashboard. |
