# Chart Selection: Intent × Data Matrix

Selection is driven by intent first, data shape second, aesthetics last. Editorial thinking ("what do I want people to see?") precedes chart choice. Perceptual constraint: encode the primary quantity on the most accurate perceptual channel available (position > length > slope > angle > area > color intensity).

## 1. Comparison (compare values across categories)

| Data shape | Best choice | Notes |
|---|---|---|
| 1 measure, ≤12 categories | Horizontal bar, sorted by value | Horizontal wins when labels are long. Sort by value unless categories have natural order. |
| 1 measure, >12 categories | Sorted bar with top-N + "Other", or dot plot | Or make it searchable/filterable if exploratory. |
| 2 measures per category | Grouped bar (≤2 groups) or dot plot / dumbbell | Dumbbell is best for before/after or gap emphasis. |
| Comparison vs target/budget | Bullet chart or bar + reference line | Never gauge charts; they waste space and encode poorly. |
| Many categories × many measures | Heatmap or table with inline bars | Heatmap for pattern-spotting, table for lookup. |

## 2. Trend / change over time

| Data shape | Best choice | Notes |
|---|---|---|
| 1-6 series, regular intervals | Line chart, direct-labeled at line ends | No legend if labels fit. |
| >6 series | Small multiples of lines, or emphasize 1-2 + gray the rest | Never a 12-line confetti chart. |
| Magnitude over time (volume matters) | Area chart (single series only) | Stacked area only if totals matter more than parts; parts are hard to read in stacks. |
| Discrete periods, few points | Column chart | Columns for ≤~12 periods; lines for more. |
| Change between exactly two periods | Slope chart or dumbbell | Great for "who moved" questions. |
| Time + category composition | Stacked column (≤5 parts) or streamgraph (long series, casual audience) | Put the most important part at the baseline of the stack. |
| Seasonality/cycles | Line with cycle overlays or heatmap calendar | Heatmap calendar for daily-grain intensity. |

## 3. Part-to-whole (composition)

| Data shape | Best choice | Notes |
|---|---|---|
| ≤5 parts, static, one dominant part | Pie/donut acceptable | Sort slices largest-first from 12 o'clock; label directly with % values. |
| >5 parts | Sorted horizontal bar of shares, or treemap | Merge the tail into "Other" (gray). |
| Composition over time | 100% stacked column/area | ≤5 parts; more than that, small-multiply. |
| Hierarchical composition | Treemap (2 levels max for general audiences) | Sunburst only for expert audiences. |

## 4. Distribution

| Data shape | Best choice | Notes |
|---|---|---|
| 1 variable | Histogram | Choose bin width deliberately; show n. |
| 1 variable, compare 2-5 groups | Overlaid density / ridgeline, or boxplots | Boxplots only for statistically literate audiences; otherwise histograms in small multiples. |
| Small n (<~50 points) | Strip/jitter or dot plot | Show the actual points; don't summarize away small data. |
| Distribution + individual outliers matter | Box + jittered points overlay | |

## 5. Correlation / relationship

| Data shape | Best choice | Notes |
|---|---|---|
| 2 quantitative variables | Scatterplot | Add a trend line only if the relationship is the message; annotate outliers by name. |
| 2 quantitative + 1 category | Scatter with color (≤5 categories) or small multiples | |
| 2 quantitative + magnitude | Bubble chart | Encode magnitude as area correctly (radius ∝ √value). |
| Many variable pairs | Correlation heatmap | Diverging palette centered on 0. |
| >1000 points | Density/hexbin scatter or sampled scatter with opacity | Overplotting hides the story. |

## 6. Ranking

Sorted horizontal bar is the default. For rank *changes* over time: bump chart (≤10 entities, direct-labeled). For rank + magnitude: bar with rank numbers as labels.

## 7. Flow / process

| Data shape | Best choice | Notes |
|---|---|---|
| Sequential conversion (funnel intent) | Ordered bar/funnel with explicit drop-off % between stages | Label the drop, not just the stage totals; the drop is the story. |
| Many-to-many flows | Sankey | Emphasize one flow path in color, gray the rest. |
| State transitions / journeys | Sankey or chord (chord only for expert audiences) | |
| Process/system logic (not quantities) | Flow diagram / node-link | This is a diagram, not a chart: layout left-to-right or top-to-bottom, one visual grammar for node types. |

## 8. Geospatial

| Data shape | Best choice | Notes |
|---|---|---|
| Rates/ratios by region | Choropleth | NEVER map raw counts on a choropleth (population bias); use rates, or a symbol map for counts. |
| Counts/magnitudes at locations | Symbol map (area ∝ √value) | Light desaturated basemap, saturated markers. |
| Ask first: is geography actually the message? | If regions are just categories, a sorted bar beats a map | Maps encode geography well and quantity poorly. |

## Interactivity decision rules

Add interactivity only when it serves the intent:
- **Tooltips**: always fine as detail-on-demand; never the only place the key value appears.
- **Filters/toggles**: for exploratory dashboards where the audience legitimately needs different slices. Default state must show the most important slice.
- **Drill-down**: overview first, zoom and filter, then details on demand. The overview must stand alone.
- **Animation**: only for transitions that preserve object constancy (e.g. sorting a bar chart) or time playback where change itself is the story. Never decorative.
- Skip interactivity entirely when the artifact will be screenshotted, pasted into slides, or emailed; make the static frame carry everything.

## Anti-patterns (refuse and propose the better option)

- 3D anything; pie with >5 slices or similar-sized slices; dual y-axes without explicit need; truncated bar axes; rainbow categorical palettes; gauges; word clouds for quantitative claims; stacked bars where middle-segment comparison is the actual question (use grouped/dot plot); radar charts for ordinary comparisons.
