# Color Standards

Core doctrine: **color is for meaning, not decoration.** Gray is the default state of everything; saturated color is spent only on what the viewer must see first. A chart where everything is colored highlights nothing.

## 1. Deriving a palette from a user-specified base color

When the user asks for a visualization "in blue", "using our brand green #1A7F5C", etc., generate the palette with this procedure:

### Step A - Adjust the base for chart use
Brand colors are designed for logos, not charts. Test the base:
- Too saturated/bright for large areas (bars, areas, map fills)? Darken slightly and reduce saturation for the "large area" variant. Keep a more saturated variant for thin marks (lines, dots, small points). Colors read as less intense at small sizes, so small marks may use higher saturation than fills. The viewer should perceive both variants as "the same color".
- Too light to meet ~3:1 contrast on white? Darken until it does.

### Step B - Build shades of the base
Create 2 lighter and 2 darker steps (roughly equal lightness increments, ~12-15 points in HSL/Lch). Increase saturation as you darken, decrease as you lighten, shifting hue slightly if needed to keep the color recognizable. Uses: subcategories, emphasized vs de-emphasized, sequential-ish ordering within one concept.

### Step C - Add companion hues (only as many as needed)
If the chart needs more than one hue, pick companions that:
- sit at **clearly different lightness levels** than the base (grayscale test),
- share the base's "vibe" (temperature and saturation level: a muted base gets muted companions, a vivid base gets vivid ones),
- avoid red-green as the only distinction,
- are nameable colors (blue, orange, teal, purple...), which helps when people present or discuss the chart.
Practical default: base + a hue roughly opposite in temperature (blue base → orange/amber companion; green base → purple/magenta; red base → blue/teal). Third and fourth hues fill remaining lightness slots.
Reserve the exact base/brand color for the most important category or single-series charts; companion hues carry the rest.

### Step D - Grays matched to the base
Define at least: a data-gray (de-emphasized series, "Other", missing data) and 3 UI grays (gridlines lightest, axis labels mid, titles darkest). Tint the grays toward the base's temperature: warm base → warm grays, cool base → cool/silver grays. Keep saturation low enough that gray never reads as a category.

### Step E - Sequential gradient from the base
For heatmaps/choropleths: interpolate from a very light tint (~95% lightness) to the darkest usable version of the base. Requirements:
- Total lightness range ≥60 percentage points (well-designed reference gradients average ~69).
- If the base hue can't be dark while staying saturated (yellows, light greens, magentas), **shift the hue at the dark end** toward a neighbor that can (yellow-green → green; magenta → purple/blue). A subtle hue shift also improves discriminability.
- Steps must be perceptually even; work in Lch/Lab-like terms, not naive RGB interpolation.

### Step F - Diverging gradient
Two sequential scales glued at a light neutral midpoint. One side is the base; the other side is a hue-opposed companion at matched lightness/saturation. Center on the meaningful midpoint (0, target, average) - never let the neutral drift off the semantic middle.

## 2. Default palette (no base color specified)

Categorical (in usage order, max before forcing reduction tactics):
1. `#2563EB` blue (primary; single-series charts use only this)
2. `#F59E0B` amber
3. `#0F766E` teal
4. `#9333EA` purple
5. `#DC2626` red (avoid as a "just another category" color; it signals alarm - prefer it for negative/alert semantics)
6. `#4B5563` slate

Grays: data-gray `#9CA3AF`; gridlines `#E5E7EB`; axis labels `#6B7280`; titles/values `#111827`.
Sequential default: `#EFF6FF` → `#1E3A8A`. Diverging default: `#B45309` ↔ `#F5F5F4` ↔ `#1D4ED8` (orange-blue, colorblind-safe; use red-blue only when negative/positive semantics demand red).
Background: white or near-white; all palette colors are tuned for light backgrounds. For dark backgrounds, raise lightness and saturation of each hue and invert the gray ramp.

## 3. Fixed semantic colors (override everything)

- Negative / decline / alert: red family. Positive / growth: green family, or blue when paired against red (colorblind-safe pairing).
- Missing data / N-A / "Other": gray, always. Never a hue.
- Likert/agreement scales: diverging, two hues + neutral gray middle.
- Warm/cold, up/down, pro/con: keep intensity symmetric across the pair so neither side looks visually "louder" unless the emphasis is intentional.
- Known-entity colors (customer brand colors in a competitive chart, party colors, product-line colors already established in the org) beat palette order.
- Cultural check: if the audience is not the designer's culture, verify red/green/white connotations before shipping.

## 4. The fewer-colors checklist (run before adding any hue beyond the second)

In order of preference:
1. Does the chart work with a single color? (Bars separated by position don't need per-bar colors. Charts with one series get exactly one color.)
2. Shades of one hue instead of new hues? (Shifts focus to totals over parts - use only when that's correct.)
3. Emphasize 1-3 key categories in color, gray the rest? (Best default for "so what"-driven charts.)
4. Direct labels letting same-colored series coexist?
5. Merge tail categories into gray "Other"?
6. Same color + white strokes to group but keep parts visible?
7. Different chart type that encodes category by position instead of color (split bars, transpose)?
8. Small multiples?
9. Non-color indicators (dash patterns, line width, shape, opacity - max 3-4 distinct)?
10. Tooltips for minor categories (never for the key ones)?

Hard cap: 6-7 simultaneous hues in one view. If the data "needs" more, the chart is wrong - go back to the checklist.

## 5. Accessibility gates (all must pass)

1. **Grayscale test**: all simultaneous hues distinguishable by lightness alone.
2. **Colorblind test**: no red-green-only distinctions; check deuteranopia mentally or with a simulator; supplement color with position, labels, or pattern where stakes are high ("no use of color alone").
3. **Contrast**: essential marks and text ≥3:1 against background (text ≥4.5:1). Light hues (yellow, light orange) get darker outlines or are kept off white backgrounds.
4. **Size test**: palette must work at the smallest mark size used (2px lines need more saturation/hue contrast than 40px bars).
5. **Overlap**: for scatter/symbol overlaps, use opacity ~0.6-0.8 with full-opacity outlines, or multiply blending.
