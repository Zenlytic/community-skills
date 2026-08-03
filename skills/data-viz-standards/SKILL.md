---
name: data-viz-standards
description: >-
  Use whenever Zoë is about to produce something that visually presents data: a dashboard, a
  single chart, an interactive HTML artifact, a static SVG or diagram, or a report containing
  charts. Triggers on "make a chart", "build a dashboard", "visualize this", "show me this as
  a graph", "chart this over time", "create an HTML report", "put this in a dashboard", "which
  chart should I use for this?", and on any request to restyle, declutter, recolor, or improve
  an existing visualization. Also triggers when the user names a brand or base color for a
  visual ("use our brand blue", "make it in #1A7F5C"). Do NOT trigger when the user only wants
  the number, a plain answer, or a raw result table with no visual intent; do NOT trigger for
  data-model or semantic-layer configuration questions (field definitions, joins, YAML views),
  which are a different skill's job; do NOT trigger for slide copy, written narrative, or
  general document formatting that contains no data visual. When another skill ships its own
  mandatory report layout, that skill's layout rules win and this one governs only the data
  layer (chart choice, encodings, palette, annotations).
enabled: true
---

# Data Visualization Standards

## Purpose

Defines the standards for any output that visually presents data: dashboards, single charts,
interactive HTML artifacts, static SVG or text-based visuals, and reports containing charts.
It encodes a repeatable method (understand intent, profile the data, pick the encoding, apply
color, tell the story, self-check) so visuals are consistent and defensible rather than
improvised per request.

The core rule: a good visualization is **trustworthy, accessible, and elegant, in that
order**. Never sacrifice accuracy for beauty. Every design decision below serves those three
in priority order.

## When to use / when not to

- **Use when:** the deliverable includes a chart, dashboard, diagram, or any visual encoding of
  data; the user asks which chart fits a question; the user asks to improve, declutter, restyle,
  or recolor an existing visual; the user names a brand or base color for a visual; or a written
  report will embed charts.
- **Do NOT use when:** the user wants only a value, a short answer, or a raw result table with no
  visual intent; the request is about data-model configuration (metric definitions, dimensions,
  joins, YAML views) rather than presentation; or the deliverable is prose, slide copy, or
  document formatting with no data visual in it.
- **Defer when:** another skill defines a mandatory report or dashboard layout for its specific
  deliverable. That skill's layout, naming, and disclosure rules take precedence; this skill
  still governs the data layer (chart choice, encodings, palette, annotations, honesty rules).

## Instructions

Work through the steps in order. Do not jump to a chart type before Steps 1 and 2 are answered.

### Step 1 - Understand the intent of the analysis

Before choosing anything visual, answer these. If the user's request or the conversation
doesn't make them clear, ask rather than guess.

1. **What is the analytical question?** Reduce it to one sentence ("Is revenue growing faster in
   region A than B?", "Where are users dropping off?").
2. **Which of the 8 analysis intents does it map to?** (comparison, trend/change over time,
   part-to-whole, distribution, correlation/relationship, ranking, flow/process, geospatial).
   Most requests are one primary intent plus at most one secondary.
3. **Explanatory or exploratory?**
   - *Explanatory*: the insight is known; the visual's job is to communicate it. Declutter
     aggressively, highlight one thing, add a takeaway title.
   - *Exploratory*: the user needs to poke at the data themselves. Favor interactivity, filters,
     tooltips, and denser layouts, but still apply the same encoding and color rules.
4. **Who is the audience and what should they do after seeing it?** Executives scanning for 5
   seconds need different density than analysts who will live in the dashboard.

### Step 2 - Profile the data

**Resolve the fields through the semantic layer first.** Whenever the visual is built on
governed metrics or dimensions, call `search_fields` to find the real fields and build the query
on the returned `sql`. Never chart a number derived from a remembered or invented column name,
and never relabel a governed metric to something friendlier without saying so in the subtitle or
footer. If a needed metric doesn't exist in the model, say so instead of approximating it.

Then determine, before picking a chart:

- Variable types: quantitative, ordinal, nominal, temporal, geospatial
- Cardinality: how many categories/series? (This drives most chart and color decisions. >7 series
  is a forcing function: group, filter, small-multiply, or emphasize+gray.)
- Number of data points and time granularity
- Is there a meaningful zero? Negative values? Wide value ranges (log scale candidate)?
- Missing data / nulls (must be shown honestly, usually in gray, never silently dropped)

### Step 3 - Select the visualization

Read `assets/chart-selection.md` and use the intent × data matrix there. Non-negotiable encoding
rules (perceptual accuracy ranking):

- Position and length are decoded most accurately; angle, area, and color intensity least. Prefer
  position/length encodings for the primary quantitative comparison.
- Bar charts start at zero, always. Line charts need not.
- Pie/donut only for part-to-whole with ≤5 slices and one clear dominant slice; otherwise use a
  bar or stacked bar.
- One chart, one job. If a chart is trying to answer two questions, split it into two charts or
  small multiples.
- Use preattentive attributes (color, size, position) to make the key point pop within ~500 ms;
  everything else recedes.
- Interactivity is a supplement, never a substitute: the main insight must be visible without
  hovering or clicking. Tooltips carry detail, not the message.

### Step 4 - Apply the color standards

Read `assets/color-standards.md`. Summary of the system:

- **If the user names a base/brand color**: derive the full palette from it using the rules there
  (adjusted base for large areas, shades for subcategories, 2-4 complementary hues chosen at
  distinct lightness levels, warm/cool grays matched to the base's temperature, sequential
  gradient built from the base with lightness range ≥60 points and a hue shift if the base can't
  go dark while staying saturated).
- **If no base color is given**: use the workspace's own brand palette when one is defined,
  otherwise the default palette in that file.
- Gray is the most important color: all context, axes, gridlines, de-emphasized series, "Other",
  and missing data are gray. Saturated color is reserved for the data that carries the message.
- Fewer colors beats more colors. Before adding a hue, run the fewer-colors checklist in the
  reference (same color + direct labels, shades not hues, emphasize one + gray the rest, merge
  categories, change chart type, small multiples).
- Every palette must pass: distinguishable in grayscale (different lightnesses), colorblind-safe
  (never red vs green as the only signal), ≥3:1 contrast against background for essential marks.
- Semantic colors are fixed: negative/down = red family, positive/up = green or blue family
  (prefer blue+red or orange+blue when colorblindness matters), missing = gray. Never invert
  these.

### Step 5 - Storytelling and layout

Read `assets/storytelling.md`. Summary:

- Every explanatory visual gets a **takeaway title** (the finding, e.g. "Churn concentrated in
  accounts onboarded without training"), not a label title ("Churn by cohort"). Subtitle carries
  the metric definition and period.
- Dashboards follow the narrative Z: top-left answers "how are we doing" (KPIs with comparison vs
  target/prior period), middle explains "why" (trends, breakdowns), bottom/right carries "what
  specifically" (detail tables, drill-down). One screen, one story; don't make users scroll to
  get the main answer.
- Annotate directly on the chart (direct labels, reference lines, callouts) instead of relying on
  legends when there are ≤6 series.
- Declutter by default: no chart borders, no heavy gridlines, no redundant axis titles, no 3D, no
  decorative gradients or shadows on data marks. Every pixel of ink must earn its place
  (data-ink ratio).
- End with the "so what": explanatory artifacts include a one-line insight or recommended action
  near the chart, not just the picture.

### Step 6 - Build

- Prefer a single self-contained HTML file. Charts via SVG or a charting library already
  available in the environment; no external font or CDN dependencies that break offline sharing
  or email.
- If the workspace has its own front-end, branding, or HTML-build skill, follow it for typography
  and page chrome; this skill governs the data layer (marks, encodings, palette, annotations).
- Number formatting: humanize (1.2M not 1200000), consistent decimals, thousands separators,
  explicit units and currency, and state the timezone/period for time data.
- Attribution: state the data source, the period covered, and the as-of timestamp on every
  delivered visual.
- Static or plain-text outputs (markdown tables, ASCII summaries) follow the same intent logic:
  lead with the answer, order rows by the analytical question (ranked, not alphabetical, unless
  lookup is the intent), and bold or mark the key row instead of coloring everything.

### Step 7 - Self-check before delivering

Run this checklist; fix anything that fails:

1. Can a first-time viewer state the main takeaway in 5 seconds?
2. Does the chart type match the intent from Step 1 (not just "what the data allows")?
3. Would the chart still work printed in grayscale?
4. Is anything colored that doesn't need to be?
5. Do all bars start at zero; are axes and scales honest (no truncation tricks, dual axes only
   with strong justification and clear labeling)?
6. Are units, period, and data source stated?
7. Were the underlying metrics resolved through `search_fields` rather than assumed?
8. If interactive: does it degrade gracefully, i.e. is the insight visible with zero interaction?

## Portability notes

This skill is schema-agnostic. It hard-codes no table, column, or metric names, so it can be
pulled into any workspace as-is. The only workspace-specific assumptions are:

- A brand palette, if the workspace has one, overrides the default palette in
  `assets/color-standards.md`. If it doesn't, the default palette is used unchanged.
- Governed metrics and dimensions are expected to be resolvable via `search_fields`. In a
  workspace without a semantic layer, skip that instruction and label the raw source explicitly
  in the chart footer instead.

## Supporting files

| Path | Purpose |
|------|---------|
| `assets/chart-selection.md` | Intent × data matrix for all 8 analysis intents, interactivity decision rules, and the anti-pattern list. Read at Step 3. |
| `assets/color-standards.md` | Palette derivation from a base/brand color, default palette, fixed semantic colors, the fewer-colors checklist, and the accessibility gates. Read at Step 4. |
| `assets/storytelling.md` | Titling, decluttering, narrative structure, dashboard layout, interactive storytelling patterns, and honesty standards. Read at Step 5. |
