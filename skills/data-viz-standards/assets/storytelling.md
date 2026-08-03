# Storytelling and Layout Standards

## 1. Context before pixels

For every deliverable, be able to state:
- **Audience**: who exactly, and how much time will they give this?
- **Message**: the one sentence they must walk away with (write it down; it becomes the title).
- **Action**: what should they decide or do?
If the message sentence can't be written, the work is still exploratory - deliver an exploration tool and say so, don't fake a story.

## 2. Titles and text hierarchy

- **Title = the takeaway**, stated as a finding: "Enterprise churn is driven by accounts with <2 active users", not "Churn analysis". Active voice, quantified where possible.
- **Subtitle**: metric definition, population, time period, currency/units.
- **Footer**: data source, as-of date, caveats/exclusions.
- Axis titles only when the axis isn't self-evident; drop "Month" under an obvious date axis.
- Annotations on the chart do the explaining: reference lines (target, average, event dates), callout labels on the key points, direct series labels at line ends. A legend is a last resort for >6 series or space-constrained small multiples.

## 3. Focusing attention (preattentive attributes)

The viewer's eye must land on the message within ~500 ms without instruction:
- One (max two) elements in full saturated color; everything else gray or muted.
- The largest/boldest text is the takeaway, not the org logo or a decorative header.
- Position: the key element goes where the reading flow starts (top-left in LTR locales).
- Enclosure/shading sparingly to band a region of interest (e.g. recession bars, target zone).
- Never highlight everything; if 5 things are bold, nothing is.

## 4. Decluttering rules (apply to every chart)

Remove: chart borders, background fills behind plot areas, heavy or dark gridlines (light gray, few, or none), redundant data labels + axis (pick one), tick marks where labels suffice, legend when direct labels fit, trailing ".0" decimals, 3D, shadows, gradient fills on marks.
Keep: white space (it is not wasted space), alignment to a grid, generous margins around direct labels.
Diagonal axis labels are a smell: rotate the chart to horizontal bars instead.

## 5. Narrative structure

For explanatory artifacts longer than one chart (reports, decks, scrollytelling HTML):
- **Arc**: setting (what we measured and why) → rising tension (the anomaly/problem in the data) → resolution (the explanation) → call to action.
- One idea per chart/slide/section. If explaining a chart takes two "and also", split it.
- Sequence charts so each answers the question the previous one raises.
- Repetition of the key number is good: headline it, show it in the chart, restate it in the conclusion.

## 6. Dashboard distribution of analysis

A dashboard is a layered answer, not a chart dump. Standard layout (Z-pattern, one screen for the primary story):

1. **Top band - "How are we doing?"**: 3-5 KPI cards. Each card: current value (big), comparison (vs prior period / target) with directional color and sign, sparkline optional. Never a KPI without a comparison; a number alone is not information.
2. **Middle band - "Why?"**: the 1-3 charts that explain the KPIs (trend of the headline metric, top breakdown driving it). This is where the takeaway-titled main chart lives.
3. **Bottom / side - "What specifically?"**: detail tables, secondary breakdowns, drill-down targets. Sortable/filterable if interactive.

Rules:
- Most important element top-left; reading gravity is Z-shaped.
- Consistent period, filters, and currency across the whole dashboard; one global filter bar beats per-chart filters.
- Same metric = same color everywhere on the dashboard.
- 5-second test: a first-time viewer states the health of the business in 5 seconds from the top band alone.
- Screen count: 1 screen for executives; analysts may scroll, but the story must complete above the first fold.
- Refresh/as-of timestamp always visible.

## 7. Interactive storytelling patterns

- **Overview → filter → detail**: default view is the whole story; interaction narrows.
- Default states are editorial choices: the filter defaults must show the most important segment, the sort default must match the analytical question.
- Guided exploration: for complex interactives, add 2-3 preset "views" (buttons that set filters to the interesting states) so non-analysts reach the insights.
- Every interactive state should be shareable/screenshottable and still self-explanatory (state reflected in the title/subtitle).

## 8. Honesty standards (trustworthy > elegant)

- Bars from zero; no axis breaks on bars. Line/scatter axes may zoom but label clearly.
- Aspect ratios that neither flatten nor exaggerate slopes (bank to ~45° where feasible).
- Show uncertainty when it matters (ranges, CI bands, "n=" for small samples).
- Never drop inconvenient points silently; gray them, footnote them, or show them.
- Correlation charts get a "correlation ≠ causation" framing in the text when the audience may over-read them.
