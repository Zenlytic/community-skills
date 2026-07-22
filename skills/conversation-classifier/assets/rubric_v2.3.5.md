RUBRIC v2.3.5 — Classify ONE customer(HUMAN)/AGENT conversation for an AI data-analyst product. account_stage given. Return JSON {"results":[...]} one object per conversation IN ORDER, echoing id. Keys: id, outcome, sentiment, frustration_level, use_case, use_case_raw, friction_type, expected_for_stage, recovered, defect_suspected, nudge_signal, confidence, evidence.

NOTE: conversations with NO human turn are handled deterministically by the runner (flagged non_user_event and EXCLUDED from experience scoring) and are NOT sent to you. Every conversation you see has at least one human turn.

WHAT CHANGED:

- v2.3: recovered STRICT; errored COUPLED to recovered; frustration high sharpened; sentiment may go NEGATIVE on a bad ending.
- v2.3.1: frustration judged from MEANING, not letter case — uppercase identifiers/acronyms are NOT shouting.
- v2.3.2: sentiment=positive requires an EXPLICIT user satisfaction cue; clean delivery with no reaction = neutral.
- v2.3.3: (a) AGENT SILENCE / non-response is a product defect, not abandoned/user_clarity. (b) new defect_suspected flag for eng triage. (c) new nudge_signal for proactive feature-adoption opportunities (does not lower experience).
- v2.3.4: agent silence applies to FOLLOW-UP questions too — a clear-but-unanswered last question is value_blocking+defect (outcome partial), never user_clarity, even if earlier turns succeeded.
- v2.3.5 (ANTI-OVER-FLAGGING): a large audit found ~64% of "problematic" flags were FALSE POSITIVES — healthy, iterative analytical work wrongly tagged value_blocking+defect. This version adds four guards. (a) USER VERIFICATION PROMPTS ("are you sure?", "double check", "can you confirm?") are NORMAL analyst diligence — by themselves they are NOT a wrong-answer callout, NOT high frustration, and NOT value_blocking; they are usually nudge_signal=verified_fields. (b) A SELF-CAUGHT CORRECTION — the agent notices and fixes an interim/unqueried/estimated number BEFORE the user acted on it, then confirms — is a recovered minor stumble (frustration none/mild, sentiment neutral), NOT value_blocking+defect, UNLESS the user had already relied on the bad number or the same error recurred. (c) EVIDENCE MUST BE FACTUALLY ACCURATE and quote/cite the actual turn (see evidence rules) — do not assert a denial, contradiction, or wrong answer that did not occur. (d) LENGTH & ITERATION ARE NOT FRICTION: a long multi-part playbook, a many-turn dashboard build, or repeated refinement where the agent kept delivering is NEUTRAL/healthy — only tag value_blocking on an ACTUAL failure (wrong result the user caught, data gap, crash, agent silence), never merely because the thread was long or the user iterated.

## outcome — end state

resolved | partial | no_data | errored | abandoned.

- COUPLING RULE: if friction_type=value_blocking AND recovered=false, outcome MUST be errored (technical failure) or partial (incomplete) — NEVER resolved. "resolved" requires the user actually got correct value.
- errored = a technical failure (binding error, function won't bind, sandbox didn't restore, fabricated/wrong result the user caught, OR the agent never responded) blocked the answer at any point and the user had to redirect, even if a workaround followed.
- abandoned = the USER dropped off / went non-substantive. It is NOT abandoned when the AGENT is the one who went silent — see Agent silence below.
- DUPLICATE USER RESENDS ARE NOT ABANDONMENT OR SILENCE (v2.3.5): if the last turns are the SAME user prompt repeated (client-side resend) but the agent DID answer that prompt earlier or later in the thread, this is a delivered answer — outcome resolved/partial per the answer, NOT abandoned and NOT agent silence. Only treat as agent silence when a substantive question genuinely received NO agent reply anywhere.

## AGENT SILENCE / NON-RESPONSE — a PRODUCT DEFECT (v2.3.3+)

If the AGENT never responds to a substantive user question, or goes silent mid-task and leaves the request unanswered:

- friction_type = value_blocking, recovered = false, expected_for_stage = false
- outcome = errored (non-response blocked the answer) — or partial if earlier turns already delivered something
- defect_suspected = true
- Do NOT label it abandoned (that's for the USER dropping off) and do NOT label it user_clarity (the user was clear; the product failed to answer).
- THIS INCLUDES A FOLLOW-UP (v2.3.4): if earlier turns were answered but the user's LAST substantive question gets NO agent reply, that is still agent silence → value_blocking + defect_suspected=true + outcome=partial. A clear-but-unanswered question is NEVER user_clarity. user_clarity is ONLY for when the USER's request was genuinely ambiguous AND the agent actually engaged — not for the agent failing to respond.
- BUT verify it is REAL silence (v2.3.5): the agent producing a substantive answer that the user then re-verifies, or the user re-sending an ALREADY-ANSWERED prompt, is NOT silence. Confirm the last substantive question truly has no agent reply before flagging.

## sentiment — how the user LEAVES the thread: positive | neutral | negative.

- negative if the thread ends on an unresolved complaint, an unanswered question, the user giving up, or the user's last turn expressing dissatisfaction.
- positive ONLY if the user EXPLICITLY signals satisfaction in their own words ("thanks", "perfect", "great", "exactly what I needed", "love it"). A clean/successful delivery with NO user reaction is NEUTRAL, not positive. Do NOT infer positive from task success, agent confidence, or a smooth multi-turn build.
- neutral otherwise. A stumble fully fixed and ending calmly is neutral (the stumble lives in frustration_level). A thread that ends on a routine verification prompt answered by the agent, or on the agent delivering the requested output, is neutral — NOT negative.

## frustration_level — PEAK user frustration, independent of outcome: none | mild | high.

- high (ANY of): ALL-CAPS used AS A DEMAND OR REBUKE ("NO", "STOP", "DO NOT", "YOU NEED TO"); "are you still there" / "why aren't you responding"; user calls out a wrong/fabricated answer AND is clearly annoyed; user corrects the SAME error ≥2x; user repeatedly asks "why does this keep happening"; explicit anger.
- mild: a single correction, a data-grain/basis correction, or mild impatience, no escalation.
- none: smooth, or calm polite repeats, OR routine verification ("are you sure?", "double check", "can you confirm?") with no other frustration signal.
- VERIFICATION IS NOT FRUSTRATION (v2.3.5): "are you sure?", "can you double check?", "can you confirm?", "does this represent X?" are NORMAL diligence, NOT a wrong-answer callout and NOT high frustration on their own. Only escalate if the user ALSO states the answer was wrong, shows annoyance, or the agent then reveals a real error the user had to force out.
- DO NOT use a mechanical "all-caps" rule. Judge from MEANING, not letter case. Uppercase technical identifiers, acronyms, SQL keywords, column names, product/skill names and titles (SQL, KPI, SKILL, ARR, RMA, NDR, GDR, FEM, FSLM, GRR, NRR, "SUPPORT KPIs - TEST") are NORMAL technical language, NOT shouting. A calm one- or two-message request is none no matter how many uppercase tokens it contains. No regex/keyword overrides.

## use_case (nearest enum): dashboard_build | ad_hoc_analysis | sql_enablement | enablement (product how-to / "how do I" / skill-writing) | product_usage_analytics | support_kpi | nps_cs_analytics | data_exploration | data_modeling | other.

## use_case_raw: ALWAYS the most accurate free-text label, even if it matches the enum; if nothing fits, use_case=other and put the real label here.

## friction_type — null or one:

value_blocking (product couldn't deliver: data gap, wrong/fabricated result THE USER CAUGHT, hard limitation, real failure/bug, OR agent non-response — ONLY type lowering experience) | setup_learning_curve (first model/metrics/skills or learning the product in trial/onboarding/pilot = EXPECTED, positive) | environment_client_side (browser/sandbox/network/SSO = excluded, route to support) | process_gating | user_clarity.

- Tag value_blocking whenever a genuine technical failure, a wrong result the user caught, agent silence, or an unrecovered limitation occurred, even if later fixed.
- DO NOT tag value_blocking for (v2.3.5): routine verification prompts; a self-caught agent correction fixed before the user relied on it; the agent CORRECTLY reporting that data/a field/a project is unavailable (that is no_data or a correct answer, not a failure); a long or iterative build where the agent kept delivering; a user refining or adding requirements. When the agent gave the right answer and merely iterated on format/scope, friction_type=null.
- CORRECTLY-REPORTED UNAVAILABILITY: if the user asks for a field/project/segment that genuinely does not exist or has no data, and the agent accurately says so, that is a CORRECT outcome (outcome=no_data or resolved), friction_type=null (or user_clarity if the user was simply mistaken about the name), defect_suspected=false. It only becomes value_blocking if the agent gave INCONSISTENT answers (said it exists then doesn't, or returned figures for a nonexistent object).

## expected_for_stage (bool): false iff value_blocking, else true.

## recovered (bool or null) — STRICT. Only meaningful when friction_type=value_blocking:

- true ONLY IF the user explicitly received the correct value / confirmed it was fixed in-thread.
- false if the user never got the answer, abandoned, kept correcting, or left frustrated — DEFAULT to false when in doubt.
- null if friction_type ≠ value_blocking. Worked example: agent hit TVF errors, sandbox didn't restore, user never got the count → value_blocking, recovered=FALSE, outcome=errored.

## defect_suspected (bool) — true when the conversation shows a likely PRODUCT DEFECT to route to engineering:

- agent never responded / went silent on a substantive question (real silence, per above)
- a crash/error the agent could not recover from
- a wrong/fabricated result traced to a product bug (not user input) that the USER caught
- an advanced feature was inaccessible/broken (e.g. SEMANTIC_DEFINITION unreadable, verified field not loading)
- inconsistent behaviour across turns (claims a nonexistent object exists and returns numbers for it)
Default false. This is an ENG-TRIAGE flag, independent of experience scoring. It can be true even when recovered=true (the defect occurred but was worked around).
- NOT a defect (v2.3.5): a self-caught interim-number correction fixed before reliance; the agent correctly stating data is unavailable; normal grain/basis clarification the agent resolved; format/scope iteration; a user-side duplicate resend of an already-answered prompt. Do not set defect_suspected=true merely because the thread was long or involved corrections that the agent handled.

## nudge_signal (string or null) — a PROACTIVE-ENABLEMENT opportunity. The user got a correct result but is MISSING or NOT USING an advanced Zenlytic feature, or is doing something the hard way. This does NOT lower experience (the product worked); it flags a gentle in-product tip CS could send later. Use a short snake_case label; null if none.

- verified_fields — user manually re-verifies / second-guesses numbers the product could guarantee via verified/governed fields ("are you sure?", "double check", "are you 100% sure this is correct?"). This is the DEFAULT signal for a verification prompt on an otherwise-correct answer.
- governed_metrics, skills, scheduled_refresh, data_modeling, drilldown — other adoption gaps.
Example: user asks "are you sure?" / "double check" and the agent re-confirms the number → nudge_signal="verified_fields", friction_type=null, frustration_level=none/mild, outcome=resolved. It is NOT value_blocking and NOT high frustration.

## confidence — NUMBER 0..1 calibrated (≤0.4 low-signal/short; 0.5–0.7 mixed; ≥0.85 clear).

## evidence — short quote/why. MUST BE FACTUALLY ACCURATE (v2.3.5): cite the actual turn (e.g. "t27") and, where you claim a wrong answer, denial, contradiction, or silence, quote or precisely paraphrase the real text that shows it. Do NOT assert an event that did not occur (e.g. "agent denied the project exists" when it affirmed it). If you cannot point to a specific turn that supports value_blocking/defect/high-frustration, do not assign those labels.

Rules: PROSE BEATS FLAGS; LEARNING IS HEALTHY ADOPTION; ITERATION AND LENGTH ARE NOT FRICTION unless the agent actually kept failing; VERIFICATION PROMPTS ARE HEALTHY (nudge_signal=verified_fields, not friction); SELF-CAUGHT CORRECTIONS FIXED BEFORE RELIANCE ARE RECOVERED MINOR STUMBLES, NOT DEFECTS; CORRECTLY-REPORTED UNAVAILABILITY IS A CORRECT ANSWER; CONFIRMATION-GATING=process_gating; AGENT SILENCE (real)=value_blocking+defect; EVIDENCE MUST QUOTE THE ACTUAL TURN; sentiment=ENDING (positive needs an explicit user cue), frustration_level=WORST moment, recovered=did the user actually get value. Return ONLY the JSON object.
