// ============================================================================
// Conversation Diagnostics Dashboard — reference build template
// Part of the `conversation-diagnostics-dashboard` skill (BUILD half of the
// assess -> build flow). Copy to /mnt/data/source/app.jsx and adapt:
//   1. {{ACCOUNT_NAME}} placeholders in the hero (below)
//   2. the customer subdomain used in deep links
//   3. the two window.loadData("question-...") dataset ids
//   4. playbook copy + any account-specific root-cause labels
// See SKILL.md for the full procedure and the 7 non-negotiable customer-safe rules.
// ============================================================================
const { useState, useEffect, useMemo } = React;

// ---------- shadcn-style primitives ----------
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-[#3D5A47] text-[#FAF3E0] hover:bg-[#2D3B30]",
        outline: "border border-[#3D5A47]/30 bg-transparent text-[#2D3B30] hover:bg-[#3D5A47]/10",
        ghost: "text-[#2D3B30] hover:bg-[#3D5A47]/10",
      },
      size: { default: "h-9 px-4 py-2", sm: "h-8 rounded-md px-3 text-xs" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
));
const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("flex h-9 w-full rounded-md border border-[#3D5A47]/25 bg-white px-3 py-2 text-sm text-[#2D3B30] placeholder:text-[#A69F95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A7A62]/40", className)} {...props} />
));

function Select({ value, onValueChange, options, placeholder }) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="flex h-9 min-w-[150px] items-center justify-between gap-2 rounded-md border border-[#3D5A47]/25 bg-white px-3 py-2 text-sm text-[#2D3B30] focus:outline-none focus:ring-2 focus:ring-[#5A7A62]/40">
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>▾</SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="z-50 overflow-hidden rounded-md border border-[#3D5A47]/20 bg-white shadow-lg" position="popper" sideOffset={4}>
          <SelectPrimitive.Viewport className="p-1">
            {options.map((o) => (
              <SelectPrimitive.Item key={o.value} value={o.value} className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-3 text-sm text-[#2D3B30] outline-none data-[highlighted]:bg-[#3D5A47]/10">
                <SelectPrimitive.ItemIndicator className="absolute left-2">✓</SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function MultiSelect({ options, selected, onChange, allLabel = "All users" }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const allSelected = selected.length === options.length;
  const label = allSelected ? allLabel : selected.length === 0 ? "None selected" : selected.length === 1 ? selected[0] : `${selected.length} selected`;
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex h-9 min-w-[170px] items-center justify-between gap-2 rounded-md border border-[#3D5A47]/25 bg-white px-3 py-2 text-sm text-[#2D3B30] focus:outline-none focus:ring-2 focus:ring-[#5A7A62]/40">
        <span className="truncate">{label}</span>
        <span>▾</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-72 w-56 overflow-y-auto rounded-md border border-[#3D5A47]/20 bg-white p-1 shadow-lg">
          <div className="flex gap-1 border-b border-[#3D5A47]/10 px-1 pb-1.5 pt-1">
            <button type="button" onClick={() => onChange(options.slice())} className="flex-1 rounded-sm px-2 py-1 text-[11px] font-medium text-[#3D5A47] hover:bg-[#3D5A47]/10">Select all</button>
            <button type="button" onClick={() => onChange([])} className="flex-1 rounded-sm px-2 py-1 text-[11px] font-medium text-[#3D5A47] hover:bg-[#3D5A47]/10">Clear</button>
          </div>
          {options.map((o) => (
            <label key={o} className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-[#2D3B30] hover:bg-[#3D5A47]/10">
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} className="h-3.5 w-3.5 accent-[#3D5A47]" />
              <span className="truncate">{o}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#3D5A47]/20 bg-[#FDFBF7] p-0 shadow-2xl focus:outline-none max-h-[88vh] overflow-hidden flex flex-col">
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ---------- helpers ----------
const SERIF = "Source Serif Pro, serif";
const SANS = "Inter, sans-serif";
const PALETTE = ["#3D5A47", "#C17F59", "#5A7A62", "#7A9BA8", "#E8DDB5", "#A69F95", "#B85450", "#D4A853"];

const OUTCOME_COLOR = { resolved: "#4A7C59", partial: "#D4A853", abandoned: "#A69F95", no_data: "#B85450", errored: "#8B3A36" };
const FRUST_COLOR = { none: "#5A7A62", mild: "#D4A853", high: "#B85450" };
const SENT_COLOR = { positive: "#4A7C59", neutral: "#7A9BA8", negative: "#B85450" };

// ---------- glossary (rubric v2.3.5) ----------
const GLOSSARY = [
  {
    title: "Outcome — how the conversation ended",
    items: [
      { term: "Completed", color: OUTCOME_COLOR.resolved, desc: "The user actually got correct value — a working answer, chart, or build they could use." },
      { term: "Partial", color: OUTCOME_COLOR.partial, desc: "The user got some value but the request was left incomplete — e.g. a clear follow-up question went unanswered." },
      { term: "No data", color: OUTCOME_COLOR.no_data, desc: "The answer required data that isn't available, and the agent correctly reported that. A correct answer, not a failure." },
      { term: "Errored", color: OUTCOME_COLOR.errored, desc: "A technical failure blocked the answer — a binding error, a crash, a wrong/fabricated result the user caught, or the agent never responding — forcing the user to redirect." },
      { term: "Abandoned", color: OUTCOME_COLOR.abandoned, desc: "The user dropped off or went non-substantive. Not used when it was the agent that went silent." },
    ],
  },
  {
    title: "Sentiment — the user's expressed tone",
    items: [
      { term: "Positive", color: SENT_COLOR.positive, desc: "The user gave an explicit satisfaction cue (thanks, praise, clear delight). Clean delivery with no reaction stays neutral." },
      { term: "Neutral", color: SENT_COLOR.neutral, desc: "Ordinary working tone — including normal diligence like asking the agent to double-check or confirm a number." },
      { term: "Negative", color: SENT_COLOR.negative, desc: "The user expressed genuine dissatisfaction, typically after a bad ending or repeated failure." },
    ],
  },
  {
    title: "Frustration level",
    items: [
      { term: "None", color: FRUST_COLOR.none, desc: "No signs of irritation. Long threads, iteration, and verification prompts on their own are not frustration." },
      { term: "Mild", color: FRUST_COLOR.mild, desc: "Some friction the user had to work through — a stumble the agent recovered from, or minor back-and-forth to get to the answer." },
      { term: "High", color: FRUST_COLOR.high, desc: "Clear, meaning-level frustration — repeated failures, the user visibly stuck or giving up. Judged from meaning, not capitalization." },
    ],
  },
  {
    title: "Friction type — what got in the way",
    items: [
      { term: "Value blocking", color: "#B85450", desc: "An actual failure prevented value: a wrong result the user caught, a data gap, a crash, or agent silence. Not applied merely because a thread was long or the user iterated." },
      { term: "User clarity", color: "#D4A853", desc: "The request was ambiguous and needed clarification before the agent could answer well." },
      { term: "(none)", color: "#A69F95", desc: "No meaningful friction — a healthy, productive exchange." },
    ],
  },
  {
    title: "Flags",
    items: [
      { term: "Recovered", color: "#4A7C59", desc: "After a stumble the agent got back on track and delivered correct value in the same conversation." },
      { term: "Nudge signal", color: "#5A7A8A", desc: "A proactive adoption opportunity (e.g. verified-fields prompts suggest the user wants to trust field definitions). Does not lower the experience score." },
    ],
  },
];

function titleCase(s) { return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
const OUTCOME_LABEL = { resolved: "Completed", partial: "Partial", abandoned: "Abandoned", no_data: "No data", errored: "Errored" };
function outcomeLabel(o) { return OUTCOME_LABEL[o] || titleCase(o); }
function fmtDate(iso) { if (!iso) return "—"; return iso.slice(0, 10); }
function fmtDateTime(iso) { if (!iso) return "—"; return iso.replace("T", " ").slice(0, 16); }

function Badge({ children, color }) {
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: color + "22", color: color, border: `1px solid ${color}55` }}>{children}</span>;
}

// ---------- chart card ----------
function ChartCard({ title, subtitle, options, height = 280 }) {
  return (
    <div className="rounded-xl border border-[#3D5A47]/15 bg-white p-4 shadow-sm">
      <h3 className="mb-0.5 text-[15px] font-semibold text-[#2D3B30]" style={{ fontFamily: SERIF }}>{title}</h3>
      {subtitle && <p className="mb-2 text-xs text-[#7A857C]" style={{ fontFamily: SANS }}>{subtitle}</p>}
      <HighchartsReact highcharts={Highcharts} options={options} containerProps={{ style: { width: "100%", height: height + "px" } }} />
    </div>
  );
}

const baseChart = (extra) => ({
  chart: { backgroundColor: "#FFFFFF", style: { fontFamily: SANS }, spacing: [8, 8, 8, 8], ...(extra?.chart || {}) },
  title: { text: null },
  credits: { enabled: false },
  exporting: { enabled: false },
  legend: { itemStyle: { fontFamily: SANS, fontSize: "11px", color: "#2D3B30" } },
  plotOptions: { series: { label: { enabled: false } }, ...(extra?.plotOptions || {}) },
  ...extra,
});

// ---------- main ----------
function App() {
  const [all, setAll] = useState([]);
  const [prob, setProb] = useState([]);
  const [loading, setLoading] = useState(true);

  // GLOBAL time filter (drives KPIs, charts, and the explorer)
  // ADAPT: set to this account's data range.
  const DATA_MIN = "2026-01-12";
  const DATA_MAX = "2026-07-15";
  const [gFrom, setGFrom] = useState("");
  const [gTo, setGTo] = useState("");

  // filters (problematic explorer)
  const [q, setQ] = useState("");
  const [ws, setWs] = useState("all");
  const [rc, setRc] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [users, setUsers] = useState(null); // null = not yet initialized; array = selected users
  const [sort, setSort] = useState("date_desc");
  const [selected, setSelected] = useState(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [show, setShow] = useState("all"); // all | concerns | healthy

  const inWindow = React.useCallback((iso) => {
    const d = (iso || "").slice(0, 10);
    if (gFrom && d < gFrom) return false;
    if (gTo && d > gTo) return false;
    return true;
  }, [gFrom, gTo]);

  const setPreset = (preset) => {
    if (preset === "all") { setGFrom(""); setGTo(""); return; }
    if (preset === "q1") { setGFrom("2026-01-01"); setGTo("2026-03-31"); return; }
    if (preset === "early") { setGFrom("2026-01-01"); setGTo("2026-02-29"); return; }
    if (preset === "recent") { setGFrom("2026-05-01"); setGTo(DATA_MAX); return; }
  };

  useEffect(() => {
    // ADAPT: replace with THIS account's two dataset question-ids (summary, detail)
    Promise.all([window.loadData("question-SUMMARY_ID"), window.loadData("question-DETAIL_ID")]).then(([a, p]) => {
      setAll(a.map((r) => ({ ...r, recovered: Number(r.recovered) || 0, defect_suspected: Number(r.defect_suspected) || 0 })));
      const pRows = p.map((r) => ({ ...r, turns: Number(r.turns) || 0, confidence: Number(r.confidence) || 0, recovered: Number(r.recovered) || 0, defect_suspected: Number(r.defect_suspected) || 0, is_problematic: Number(r.is_problematic) || 0 }));
      setProb(pRows);
      setUsers(Array.from(new Set(pRows.map((r) => r.user).filter(Boolean))).sort());
      setLoading(false);
    });
  }, []);

  // ---- window-filtered base sets (drive KPIs + all charts) ----
  const allW = useMemo(() => all.filter((r) => inWindow(r.started_at)), [all, inWindow]);
  const probW = useMemo(() => prob.filter((r) => inWindow(r.started_at)), [prob, inWindow]);
  const windowLabel = (!gFrom && !gTo) ? "all dates" : `${gFrom || DATA_MIN} → ${gTo || DATA_MAX}`;

  // ---- overview aggregates (windowed) ----
  const kpis = useMemo(() => {
    const n = allW.length;
    const byOutcome = {};
    allW.forEach((r) => (byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + 1));
    const highFrust = allW.filter((r) => r.frustration_level === "high").length;
    const valueBlock = allW.filter((r) => r.friction_type === "value_blocking").length;
    const noData = allW.filter((r) => r.outcome === "no_data").length;
    const abandoned = allW.filter((r) => r.outcome === "abandoned").length;
    const defects = allW.filter((r) => r.defect_suspected === 1).length;
    return { n, resolved: byOutcome.resolved || 0, partial: byOutcome.partial || 0, abandoned, no_data: noData, highFrust, valueBlock, defects };
  }, [allW]);

  // count of conversations with any concern, in the active window (from the detail set)
  const concernsN = useMemo(() => probW.filter((r) => r.is_problematic === 1).length, [probW]);

  const outcomeChart = useMemo(() => {
    const order = ["resolved", "partial", "abandoned", "no_data"];
    const counts = order.map((o) => allW.filter((r) => r.outcome === o).length);
    return baseChart({
      chart: { type: "bar", height: 210 },
      xAxis: { categories: order.map(outcomeLabel), labels: { style: { fontFamily: SANS, fontSize: "11px", color: "#2D3B30" } } },
      yAxis: { title: { text: "Conversations", style: { fontFamily: SANS, fontSize: "12px" } }, gridLineColor: "rgba(45,59,48,0.08)" },
      tooltip: { pointFormat: "<b>{point.y}</b> conversations" },
      series: [{ name: "Conversations", data: order.map((o, i) => ({ y: counts[i], color: OUTCOME_COLOR[o] })), dataLabels: { enabled: true, style: { fontFamily: SANS, fontWeight: "600" } } }],
    });
  }, [allW]);

  const useCaseChart = useMemo(() => {
    const m = {};
    allW.forEach((r) => (m[r.use_case] = (m[r.use_case] || 0) + 1));
    const rows = Object.entries(m).sort((a, b) => b[1] - a[1]);
    return baseChart({
      chart: { type: "bar", height: 250 },
      xAxis: { categories: rows.map((r) => titleCase(r[0])), labels: { style: { fontFamily: SANS, fontSize: "11px", color: "#2D3B30" } } },
      yAxis: { title: { text: "Conversations", style: { fontFamily: SANS, fontSize: "12px" } }, gridLineColor: "rgba(45,59,48,0.08)" },
      tooltip: { pointFormat: "<b>{point.y}</b> conversations" },
      series: [{ name: "Conversations", data: rows.map((r, i) => ({ y: r[1], color: PALETTE[i % PALETTE.length] })), dataLabels: { enabled: true, style: { fontFamily: SANS, fontWeight: "600" } } }],
    });
  }, [allW]);

  const rootCauseChart = useMemo(() => {
    const m = {};
    probW.filter((r) => r.is_problematic === 1).forEach((r) => (m[r.root_cause] = (m[r.root_cause] || 0) + 1));
    const rows = Object.entries(m).sort((a, b) => b[1] - a[1]);
    return baseChart({
      chart: { type: "bar", height: 300 },
      xAxis: { categories: rows.map((r) => r[0]), labels: { style: { fontFamily: SANS, fontSize: "11px", color: "#2D3B30" } } },
      yAxis: { title: { text: "Problematic conversations", style: { fontFamily: SANS, fontSize: "12px" } }, gridLineColor: "rgba(45,59,48,0.08)" },
      tooltip: { pointFormat: "<b>{point.y}</b> conversations" },
      series: [{ name: "Conversations", data: rows.map((r) => ({ y: r[1], color: r[0].includes("grain") || r[0].includes("Grain") ? "#B85450" : r[0].includes("name") ? "#C17F59" : "#3D5A47" })), dataLabels: { enabled: true, style: { fontFamily: SANS, fontWeight: "600" } } }],
    });
  }, [probW]);

  // monthly trend of problematic vs all — always full timeline, with the active window shaded
  const trendChart = useMemo(() => {
    const monthKey = (iso) => (iso || "").slice(0, 7);
    const monthsAll = {}, monthsProb = {}, monthsNoData = {};
    all.forEach((r) => { const k = monthKey(r.started_at); if (k) monthsAll[k] = (monthsAll[k] || 0) + 1; });
    prob.filter((r) => r.is_problematic === 1).forEach((r) => { const k = monthKey(r.started_at); if (k) monthsProb[k] = (monthsProb[k] || 0) + 1; });
    all.forEach((r) => { if (r.outcome === "no_data" || r.outcome === "abandoned") { const k = monthKey(r.started_at); if (k) monthsNoData[k] = (monthsNoData[k] || 0) + 1; } });
    const keys = Array.from(new Set([...Object.keys(monthsAll), ...Object.keys(monthsProb)])).sort();
    // shade active window
    const bands = [];
    if (gFrom || gTo) {
      const fromM = (gFrom || DATA_MIN).slice(0, 7);
      const toM = (gTo || DATA_MAX).slice(0, 7);
      let fi = keys.indexOf(fromM), ti = keys.indexOf(toM);
      if (fi < 0) fi = 0;
      if (ti < 0) ti = keys.length - 1;
      bands.push({ from: fi - 0.5, to: ti + 0.5, color: "rgba(193,127,89,0.14)", label: { text: "Selected window", style: { color: "#8A5A3C", fontSize: "10px", fontFamily: SANS } } });
    }
    return baseChart({
      chart: { type: "column", height: 260 },
      xAxis: { categories: keys, plotBands: bands, labels: { style: { fontFamily: SANS, fontSize: "11px", color: "#2D3B30" } } },
      yAxis: { title: { text: "Conversations", style: { fontFamily: SANS, fontSize: "12px" } }, gridLineColor: "rgba(45,59,48,0.08)" },
      legend: { enabled: true, itemStyle: { fontFamily: SANS, fontSize: "11px" } },
      tooltip: { shared: true },
      plotOptions: { column: { grouping: false, borderWidth: 0 } },
      series: [
        { name: "All conversations", data: keys.map((k) => monthsAll[k] || 0), color: "#D8E0D5", pointPadding: 0.06 },
        { name: "Problematic", data: keys.map((k) => monthsProb[k] || 0), color: "#B85450", pointPadding: 0.2 },
        { name: "Abandoned / no-data", type: "line", data: keys.map((k) => monthsNoData[k] || 0), color: "#8B3A36", marker: { enabled: true, radius: 3 }, lineWidth: 2 },
      ],
    });
  }, [all, prob, gFrom, gTo]);

  // ---- problematic explorer filtering ----
  const wsOptions = useMemo(() => [{ value: "all", label: "All workspaces" }, ...Array.from(new Set(prob.map((r) => r.workspace_name))).map((w) => ({ value: w, label: w }))], [prob]);
  const rcOptions = useMemo(() => [{ value: "all", label: "All root causes" }, ...Array.from(new Set(prob.filter((r) => r.is_problematic === 1).map((r) => r.root_cause))).sort().map((w) => ({ value: w, label: w }))], [prob]);
  const userList = useMemo(() => Array.from(new Set(prob.map((r) => r.user).filter(Boolean))).sort(), [prob]);
  const outcomeOptions = [{ value: "all", label: "All outcomes" }, { value: "partial", label: "Partial" }, { value: "abandoned", label: "Abandoned" }, { value: "no_data", label: "No data" }, { value: "resolved", label: "Completed" }];
  const sortOptions = [{ value: "date_desc", label: "Newest first" }, { value: "date_asc", label: "Oldest first" }, { value: "turns_desc", label: "Most turns" }, { value: "frust_desc", label: "Highest frustration" }];

  const filtered = useMemo(() => {
    const frustRank = { high: 3, mild: 2, none: 1 };
    let rows = probW.filter((r) => {
      if (show === "concerns" && r.is_problematic !== 1) return false;
      if (show === "healthy" && r.is_problematic === 1) return false;
      if (ws !== "all" && r.workspace_name !== ws) return false;
      if (rc !== "all" && r.root_cause !== rc) return false;
      if (outcome !== "all" && r.outcome !== outcome) return false;
      if (users && r.user && !users.includes(r.user)) return false;
      if (q) {
        const hay = (r.use_case_raw + " " + r.first_human + " " + r.evidence + " " + r.root_cause + " " + (r.user || "") + " " + (r.user_email || "")).toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    rows.sort((a, b) => {
      if (sort === "date_desc") return b.started_at.localeCompare(a.started_at);
      if (sort === "date_asc") return a.started_at.localeCompare(b.started_at);
      if (sort === "turns_desc") return b.turns - a.turns;
      if (sort === "frust_desc") return (frustRank[b.frustration_level] - frustRank[a.frustration_level]) || (b.turns - a.turns);
      return 0;
    });
    return rows;
  }, [probW, ws, rc, outcome, users, q, sort, show]);

  if (loading) return <div className="flex h-screen items-center justify-center text-[#2D3B30]" style={{ fontFamily: SANS }}>Loading report…</div>;

  return (
    <div className="min-h-screen bg-[#F7F3E8] text-[#2D3B30]" style={{ fontFamily: SANS }}>
      {/* Header */}
      <header className="bg-[#062810] px-5 py-7 md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-[#7CB77F]">Zenlytic · Conversation Health Report</p>
          <h1 className="text-2xl font-bold text-[#F7F3E8] md:text-3xl" style={{ fontFamily: SERIF }}>{{ACCOUNT_NAME}} — Conversation Diagnostics</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#C7D3C2]">
            {{N}} conversations classified in the {{ACCOUNT_NAME}} workspace. Every conversation is reviewable below — filter to all, only those with concerns, or the healthy ones. Use the time window to focus a period; the KPIs, charts and conversation list all respond to it. This report gives a balanced view of how Zoë is performing and an actionable path for auditing and improving the underlying data model.
          </p>
          <button
            type="button"
            onClick={() => setGlossaryOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#7CB77F] underline decoration-[#7CB77F]/40 underline-offset-4 transition-colors hover:text-[#F7F3E8] hover:decoration-[#F7F3E8]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            What do these terms &amp; classifications mean?
          </button>
        </div>
      </header>

      {/* GLOBAL time filter */}
      <div className="sticky top-0 z-30 border-b border-[#3D5A47]/15 bg-[#EFEAD9]/95 backdrop-blur px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A7A62]">Time window</span>
          <div className="flex items-center gap-1.5">
            {[
              { k: "all", label: "All" },
              { k: "early", label: "Early (Jan–Feb)" },
              { k: "q1", label: "Q1" },
              { k: "recent", label: "Recent (May+)" },
            ].map((p) => {
              const active =
                (p.k === "all" && !gFrom && !gTo) ||
                (p.k === "early" && gFrom === "2026-01-01" && gTo === "2026-02-29") ||
                (p.k === "q1" && gFrom === "2026-01-01" && gTo === "2026-03-31") ||
                (p.k === "recent" && gFrom === "2026-05-01" && gTo === DATA_MAX);
              return (
                <Button key={p.k} size="sm" variant={active ? "default" : "outline"} onClick={() => setPreset(p.k)}>{p.label}</Button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[#7A857C]">From</label>
            <Input type="date" min={DATA_MIN} max={DATA_MAX} className="h-8 w-[150px]" value={gFrom} onChange={(e) => setGFrom(e.target.value)} />
            <label className="text-[11px] text-[#7A857C]">To</label>
            <Input type="date" min={DATA_MIN} max={DATA_MAX} className="h-8 w-[150px]" value={gTo} onChange={(e) => setGTo(e.target.value)} />
          </div>
          <span className="ml-auto text-xs text-[#7A857C]">Showing <b className="text-[#2D3B30]">{kpis.n}</b> conversations · {windowLabel}</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {/* KPI row */}
        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Conversations", value: kpis.n, sub: "classified (rubric v2.3.5)", color: "#3D5A47" },
            { label: "Completed", value: kpis.resolved, sub: kpis.n ? `${Math.round((kpis.resolved / kpis.n) * 100)}% of total` : "—", color: "#4A7C59" },
            { label: "With concerns", value: concernsN, sub: kpis.n ? `${Math.round((concernsN / kpis.n) * 100)}% of total` : "—", color: "#D4A853" },
            { label: "High frustration", value: kpis.highFrust, sub: "urgent to review", color: "#B85450" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-[#3D5A47]/15 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#7A857C]">{k.label}</p>
              <p className="mt-1 text-3xl font-bold" style={{ fontFamily: SERIF, color: k.color }}>{k.value}</p>
              <p className="mt-0.5 text-xs text-[#7A857C]">{k.sub}</p>
            </div>
          ))}
        </section>

        {/* Overview charts */}
        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Outcomes" subtitle={`How conversations ended · ${kpis.n} in window`} options={outcomeChart} height={210} />
          <ChartCard title="What users work on" subtitle="Use-case mix" options={useCaseChart} height={250} />
          <ChartCard title="Monthly volume vs. conversations with concerns" subtitle="Concerns = value-blocking friction, negative sentiment, elevated frustration, or an incomplete/abandoned outcome" options={trendChart} height={260} />
          <ChartCard title="Root causes among conversations with concerns" subtitle={`${concernsN} conversations with concerns in window, grouped by underlying cause`} options={rootCauseChart} height={300} />
        </section>

        {/* Problematic explorer */}
        <section className="mb-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-[#2D3B30]" style={{ fontFamily: SERIF }}>Conversation explorer</h2>
            <span className="text-sm text-[#7A857C]">{filtered.length} of {probW.length} shown</span>
          </div>

          {/* Show toggle */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {[
              { k: "all", label: `All (${probW.length})` },
              { k: "concerns", label: `With concerns (${concernsN})` },
              { k: "healthy", label: `Healthy (${probW.length - concernsN})` },
            ].map((s) => (
              <Button key={s.k} size="sm" variant={show === s.k ? "default" : "outline"} onClick={() => setShow(s.k)}>{s.label}</Button>
            ))}
          </div>


          {/* Filters */}
          <div className="mb-4 rounded-xl border border-[#3D5A47]/15 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1">
                <label className="mb-1 block text-[11px] font-medium text-[#7A857C]">Search</label>
                <Input placeholder="Search prompts, evidence, root cause…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#7A857C]">User</label>
                <MultiSelect options={userList} selected={users || userList} onChange={setUsers} allLabel="All users" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#7A857C]">Root cause</label>
                <Select value={rc} onValueChange={setRc} options={rcOptions} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#7A857C]">Outcome</label>
                <Select value={outcome} onValueChange={setOutcome} options={outcomeOptions} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#7A857C]">Sort</label>
                <Select value={sort} onValueChange={setSort} options={sortOptions} />
              </div>
              <Button variant="outline" size="sm" onClick={() => { setQ(""); setWs("all"); setRc("all"); setOutcome("all"); setUsers(userList.slice()); setSort("date_desc"); setShow("all"); }}>Reset</Button>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r) => (
              <button key={r.conversation_id} onClick={() => setSelected(r)} className="group flex flex-col rounded-xl border border-[#3D5A47]/15 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#3D5A47]/40 hover:shadow-md">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-[#7A857C]">{fmtDate(r.started_at)}{r.user ? ` · ${r.user}` : ""}</span>
                  <span className="text-[11px] text-[#A69F95]">{r.turns} turns</span>
                </div>
                <p className="mb-2 line-clamp-2 text-sm font-semibold text-[#2D3B30]">{r.use_case_raw}</p>
                <p className="mb-3 line-clamp-2 text-xs text-[#6B756D]">{r.evidence || r.first_human || "—"}</p>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  <Badge color={r.is_problematic === 1 ? "#C17F59" : "#4A7C59"}>{r.root_cause}</Badge>
                  <Badge color={OUTCOME_COLOR[r.outcome] || "#A69F95"}>{outcomeLabel(r.outcome)}</Badge>
                  {r.frustration_level !== "none" && <Badge color={FRUST_COLOR[r.frustration_level]}>{titleCase(r.frustration_level)} frust.</Badge>}
                </div>
              </button>
            ))}
          </div>
          {filtered.length === 0 && <div className="rounded-xl border border-dashed border-[#3D5A47]/25 bg-white p-10 text-center text-sm text-[#7A857C]">No conversations match the current filters.</div>}
        </section>

        {/* How to assess the data model */}
        <section className="mb-10 rounded-xl border border-[#3D5A47]/15 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-xl font-bold text-[#2D3B30]" style={{ fontFamily: SERIF }}>How to assess &amp; improve the data model</h2>
          <p className="mb-5 text-sm text-[#6B756D]">A staged playbook that maps each recurring failure above to a concrete change in the semantic layer. ADAPT the six cards below to this account's actual root-cause mix.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { n: "1", t: "Audit project resolution", d: "Build a canonical registry of every project/view users can reference, with aliases & synonyms (e.g. a short name → its canonical project). Have Zoë fuzzy-match then confirm against the live list instead of guessing or looping. This alone addresses the largest cluster of unrecovered failures.", tag: "Name resolution" },
              { n: "2", t: "Encode grain explicitly", d: "Tag each project/view with its cadence (monthly / QoQ / LTM / YoY / annual). Most value-blocking friction comes from summing LTM movement columns against a point-in-time BoP. Grain metadata lets Zoë refuse invalid aggregations.", tag: "Grain / movements" },
              { n: "3", t: "Ship governed retention measures", d: "Define GRR, NRR, and the snowball bridge (BoP → churn/downsell/product-churn → cross-sell/upsell/new-customer → EoP) as first-class measures with correct aggregation baked in — so Zoë never hand-rolls waterfall isSum or customer-count logic.", tag: "Measures" },
              { n: "4", t: "Fix null-handling & column mapping", d: "Stop implicit exclusion of null dimensions (e.g. silently dropping a null dimension can drop material ARR). Standardise ARR column naming (TOTAL_ARR vs ARR) so wrong-prefix zeros can't occur.", tag: "Data correctness" },
              { n: "5", t: "Make field availability authoritative", d: "Expose per-project column availability from SEMANTIC_DEFINITION so Zoë trusts it (win-back, upsell price, industry). Removes the \"it's not available\" → \"it's enabled though\" back-and-forth.", tag: "Availability" },
              { n: "6", t: "Route platform how-tos to docs", d: "Upload/share/RLS/import questions were answered from memory. Point these at documentation, and separate genuine environment bugs (dashboard-edit persistence reverts) for engineering.", tag: "Enablement / bugs" },
            ].map((c) => (
              <div key={c.n} className="rounded-lg border border-[#3D5A47]/12 bg-[#FDFBF7] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3D5A47] text-xs font-bold text-[#F7F3E8]">{c.n}</span>
                  <h3 className="text-[15px] font-semibold text-[#2D3B30]" style={{ fontFamily: SERIF }}>{c.t}</h3>
                </div>
                <p className="mb-2 text-sm leading-relaxed text-[#4A544C]">{c.d}</p>
                <Badge color="#5A7A62">{c.tag}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-[#C17F59]/30 bg-[#C17F59]/8 p-4">
            <p className="text-sm text-[#4A544C]"><span className="font-semibold text-[#2D3B30]">Suggested cadence:</span> re-run the classifier monthly, track the problematic count and the root-cause mix over time, and treat a rising "grain" or "name resolution" bar as a signal that a specific model change is needed. Prioritise the top root-cause clusters first.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#3D5A47]/15 bg-[#F7F3E8] py-5 text-center">
        <p className="text-xs" style={{ color: "#5A7A62", fontFamily: SANS }}>Powered by Zenlytic</p>
      </footer>

      {/* Detail modal */}
      {/* Glossary modal */}
      <Dialog open={glossaryOpen} onOpenChange={setGlossaryOpen}>
        <div className="border-b border-[#3D5A47]/15 bg-[#062810] px-6 py-4">
          <DialogPrimitive.Title className="text-lg font-bold text-[#F7F3E8]" style={{ fontFamily: SERIF }}>Terms &amp; classifications</DialogPrimitive.Title>
          <p className="mt-1 text-xs text-[#7CB77F]">How each conversation is scored — rubric v2.3.5</p>
        </div>
        <div className="overflow-y-auto px-6 py-5 text-sm text-[#2D3B30]">
          {GLOSSARY.map((section) => (
            <div key={section.title} className="mb-5 last:mb-1">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#5A7A62]">{section.title}</p>
              <div className="space-y-2">
                {section.items.map((it) => (
                  <div key={it.term} className="rounded-lg bg-[#FDFBF7] px-3 py-2">
                    <div className="flex items-baseline gap-2">
                      {it.color ? (
                        <span className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: it.color }} />
                      ) : null}
                      <span className="font-semibold text-[#2D3B30]">{it.term}</span>
                    </div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[#454547]">{it.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="mt-3 text-center text-[11px] text-[#A69F95]">Definitions from the conversation-classifier rubric (v2.3.5).</p>
        </div>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <React.Fragment>
            <div className="border-b border-[#3D5A47]/15 bg-[#062810] px-6 py-4">
              <DialogPrimitive.Title className="text-lg font-bold text-[#F7F3E8]" style={{ fontFamily: SERIF }}>{selected.use_case_raw}</DialogPrimitive.Title>
              <p className="mt-1 text-xs text-[#7CB77F]">{selected.user ? `${selected.user} · ` : ""}{fmtDateTime(selected.started_at)} → {fmtDateTime(selected.last_msg_at)} · {selected.workspace_name} · {selected.turns} turns</p>
            </div>
            <div className="overflow-y-auto px-6 py-5">
              <div className="mb-4 flex flex-wrap gap-1.5">
                <Badge color={selected.is_problematic === 1 ? "#C17F59" : "#4A7C59"}>{selected.root_cause}</Badge>
                <Badge color={OUTCOME_COLOR[selected.outcome] || "#A69F95"}>{outcomeLabel(selected.outcome)}</Badge>
                <Badge color={SENT_COLOR[selected.sentiment]}>{titleCase(selected.sentiment)}</Badge>
                <Badge color={FRUST_COLOR[selected.frustration_level]}>{titleCase(selected.frustration_level)} frustration</Badge>
                {selected.recovered === 1 && <Badge color="#4A7C59">Recovered</Badge>}
                {selected.is_problematic === 1 && selected.recovered === 0 && <Badge color="#B85450">Not recovered</Badge>}
              </div>

              <div className="mb-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7A857C]">Opening request</p>
                <p className="rounded-lg bg-[#FDFBF7] p-3 text-sm text-[#2D3B30]">{selected.first_human || "—"}</p>
              </div>

              <div className="mb-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7A857C]">{selected.is_problematic === 1 ? "What went wrong" : "Assessment"}</p>
                <p className="rounded-lg bg-[#FDFBF7] p-3 text-sm text-[#2D3B30]">{selected.evidence || (selected.is_problematic === 1 ? "—" : "No issues detected — the conversation completed cleanly.")}</p>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                <div><p className="text-[11px] text-[#7A857C]">User</p><p className="font-medium text-[#2D3B30]">{selected.user || "—"}</p></div>
                <div><p className="text-[11px] text-[#7A857C]">Use case</p><p className="font-medium text-[#2D3B30]">{titleCase(selected.use_case)}</p></div>
                <div><p className="text-[11px] text-[#7A857C]">Friction type</p><p className="font-medium text-[#2D3B30]">{titleCase(selected.friction_type)}</p></div>
                <div><p className="text-[11px] text-[#7A857C]">Confidence</p><p className="font-medium text-[#2D3B30]">{(selected.confidence * 100).toFixed(0)}%</p></div>
              </div>

              <a href={selected.conversation_url} target="_blank" rel="noreferrer">
                <Button className="w-full">Open conversation in Zenlytic ↗</Button>
              </a>
              <p className="mt-2 break-all text-center text-[11px] text-[#A69F95]">{selected.conversation_id}</p>
            </div>
          </React.Fragment>
        )}
      </Dialog>
    </div>
  );
}
