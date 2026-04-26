# Revised Build Plan: Professional-Grade Marimo Operator Surface

## What Was Wrong With v1

The first plan was a form-over-a-CLI — flat dropdowns, dump-to-table, done. No visual hierarchy, no spatial reasoning about a pipeline, no interactive exploration, no progressive disclosure. It read like a 2019 Jupyter wrapper, not something an operator would actually want open on a second monitor.

---

## Design Philosophy

This is an **operator cockpit for a staged trading pipeline**. The UX model is closer to a Bloomberg Launchpad panel or a Grafana dashboard than a notebook. Key principles:

- **Dark theme by default** — `theme = "dark"` in script metadata, custom CSS for trading-floor color language (green/red/amber/neutral)
- **Spatial layout** — sidebar nav + main content area, not a vertical scroll of cells
- **KPI stat cards** at the top of every view — instant read on state before drilling in
- **Progressive disclosure** — summary first, click to expand detail, never dump raw JSON unprompted
- **Pipeline as visual flow** — a horizontal stage progression bar (A → B → C → D) with color-coded status, not a list of booleans
- **Form-gated execution** — batch+form pattern so nothing fires until the operator deliberately submits
- **Rich styled HTML** — `mo.Html()` with inline CSS for custom cards, badges, and the pipeline flow visualization. `.style()` on every layout element for spacing, borders, radius, shadows.

---

## Layer 1: Engine (Untouched)

| Module | Role | Key Entrypoints |
|---|---|---|
| `schemas/` | Pydantic input/output/trigger models | `HistoricalPacket`, `SufficiencyGateOutput`, `ContractAnalysis`, `ProposedSetup`, `RiskAuthorization`, `ReadinessEngineOutput` |
| `runtime.py` | Prompt execution, contract enforcement, boundary validation | `execute_prompt()`, `run_readiness()` |
| `pipeline.py` | Stage A→D orchestration | `run_pipeline()` → `PipelineExecutionResult` |
| `gemini_adapter.py` | Gemini structured-output adapter with bounded retry | `GeminiResponsesAdapter` |
| `audit.py` / `audit_report.py` | JSONL append + aggregate summary | `append_audit_record()`, `build_audit_summary()` |
| `execution_facade.py` | High-level wrappers (sweep, run+log) | `sweep_watchman()`, `run_pipeline()`, `run_pipeline_and_log()` |
| `view_models.py` | Readiness cards, pipeline result views, watchman diffs | `ReadinessCard`, `PipelineResultView`, `LogHistoryRow` |
| `logging_record.py` | Run-history JSONL read/write | `RunHistoryRecord`, `read_log_records()` |
| `config.py` | Env-var-driven Gemini startup config | `load_gemini_startup_config()` |
| `watchman.py` | Watchman context builder | `WatchmanReadinessContext` |

Existing marimo notebook: `notebooks/readiness_matrix.py` — already uses `sweep_watchman`, `readiness_cards_from_sweep`, and `read_log_records`. This becomes one tab/section of the new app.

---

## Folder Layout

```
notebooks/
├── app.py                    # marimo.App(width="full") — the operator surface
├── theme.css                 # custom CSS: trading color palette, card styles, pipeline bar
└── _components/              # pure-Python helper functions (no marimo imports)
    ├── __init__.py
    ├── cards.py              # HTML-generating functions for styled stat cards, badges
    ├── pipeline_flow.py      # HTML generator for the horizontal stage progression bar
    ├── stage_renderers.py    # per-stage detail renderers (returns mo.Html fragments)
    ├── fail_panel.py         # extracts fail-closed reasons into structured view
    └── formatters.py         # number formatting, color logic, icon selection
```

`src/` is **never modified**. `_components/` contains **zero marimo imports** — they return raw HTML strings or dicts. Only `app.py` imports `marimo`.

---

## Script Metadata

```python
# /// script
# [tool.marimo.display]
# theme = "dark"
# custom_css = ["theme.css"]
# [tool.marimo.runtime]
# on_cell_change = "lazy"
# ///
```

`on_cell_change = "lazy"` so the pipeline doesn't auto-fire when inputs change — operator must submit the form.

---

## `theme.css` — Trading Color Palette

```css
:root {
  --ntb-green: #00c853;
  --ntb-red: #ff1744;
  --ntb-amber: #ffc400;
  --ntb-neutral: #90a4ae;
  --ntb-bg-card: rgba(255,255,255,0.04);
  --ntb-border: rgba(255,255,255,0.08);
  --ntb-radius: 10px;
  --ntb-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* Stat card overrides */
.ntb-card {
  background: var(--ntb-bg-card);
  border: 1px solid var(--ntb-border);
  border-radius: var(--ntb-radius);
  padding: 16px 20px;
  box-shadow: var(--ntb-shadow);
}

/* Pipeline flow bar */
.ntb-flow { display: flex; align-items: center; gap: 0; width: 100%; }
.ntb-flow-stage {
  flex: 1; text-align: center; padding: 12px 0;
  font-weight: 600; font-size: 0.85rem; letter-spacing: 0.03em;
  border-bottom: 3px solid var(--ntb-neutral);
  transition: border-color 0.3s, color 0.3s;
}
.ntb-flow-stage.reached { border-color: var(--ntb-green); color: var(--ntb-green); }
.ntb-flow-stage.terminated { border-color: var(--ntb-amber); color: var(--ntb-amber); }
.ntb-flow-stage.failed { border-color: var(--ntb-red); color: var(--ntb-red); }
.ntb-flow-stage.pending { opacity: 0.35; }
.ntb-flow-connector { width: 32px; text-align: center; color: var(--ntb-neutral); font-size: 1.1rem; }

/* Decision badges */
.ntb-badge {
  display: inline-block; padding: 4px 14px; border-radius: 20px;
  font-weight: 700; font-size: 0.8rem; letter-spacing: 0.05em;
}
.ntb-badge-approved { background: var(--ntb-green); color: #000; }
.ntb-badge-rejected { background: var(--ntb-red); color: #fff; }
.ntb-badge-reduced { background: var(--ntb-amber); color: #000; }
.ntb-badge-no-trade { background: var(--ntb-neutral); color: #000; }
.ntb-badge-blocked { background: var(--ntb-red); color: #fff; }
.ntb-badge-caution { background: var(--ntb-amber); color: #000; }
.ntb-badge-ready { background: var(--ntb-green); color: #000; }

/* Risk check rows */
.ntb-check-pass { color: var(--ntb-green); }
.ntb-check-fail { color: var(--ntb-red); font-weight: 700; }

/* JSON viewer */
.ntb-json-viewer {
  background: rgba(0,0,0,0.3); border-radius: 8px;
  padding: 16px; font-family: var(--marimo-monospace-font);
  font-size: 0.82rem; max-height: 500px; overflow: auto;
}

/* Price ladder */
.ntb-price-ladder {
  display: flex; flex-direction: column; gap: 2px;
  font-family: var(--marimo-monospace-font); font-size: 0.82rem;
}
.ntb-price-ladder .resistance { color: var(--ntb-red); }
.ntb-price-ladder .support { color: var(--ntb-green); }
.ntb-price-ladder .pivot { color: var(--ntb-amber); font-weight: 700; }

/* Chip / pill tags */
.ntb-chip {
  display: inline-block; padding: 2px 10px; border-radius: 12px;
  font-size: 0.75rem; font-weight: 600; margin: 2px 4px 2px 0;
  background: var(--ntb-bg-card); border: 1px solid var(--ntb-border);
}
.ntb-chip-warn { border-color: var(--ntb-amber); color: var(--ntb-amber); }
.ntb-chip-danger { border-color: var(--ntb-red); color: var(--ntb-red); }
```

---

## Cell-by-Cell Architecture

### Cell 0 — Sidebar Navigation

```python
mo.sidebar(
    [
        mo.md("# ⚡ NinjaTradeBuilder"),
        mo.md("**Operator Console**").style(opacity="0.6", font_size="0.85rem"),
        mo.nav_menu({
            "#pipeline":  f"{mo.icon('lucide:git-branch')} Pipeline",
            "#readiness": f"{mo.icon('lucide:shield-check')} Readiness Matrix",
            "#audit":     f"{mo.icon('lucide:file-text')} Audit & History",
            "#validate":  f"{mo.icon('lucide:check-circle')} Local Validation",
        }, orientation="vertical"),
    ],
    footer=mo.md(f"`v0.1.0` · marimo {mo.__version__}").style(opacity="0.4"),
    width="220px",
)
```

The sidebar stays on-screen. Each nav item anchors to a named section in the main content flow.

### Cell 1 — Imports (hidden cell, no visual output)

All imports from `ninjatradebuilder.*` and `_components.*`. Returns everything downstream cells need.

```python
import marimo as mo
import json
import os
import time
from pathlib import Path

from ninjatradebuilder.execution_facade import (
    sweep_watchman, run_pipeline, run_pipeline_and_log,
    summarize_pipeline_result,
)
from ninjatradebuilder.view_models import (
    readiness_cards_from_sweep, pipeline_result_view,
    ReadinessCard, PipelineResultView, StageProgressionRow,
)
from ninjatradebuilder.config import (
    load_gemini_startup_config, GeminiStartupConfig,
    DEFAULT_GEMINI_MODEL, DEFAULT_GEMINI_TIMEOUT_SECONDS,
    DEFAULT_GEMINI_MAX_RETRIES,
    DEFAULT_GEMINI_RETRY_INITIAL_DELAY_SECONDS,
    DEFAULT_GEMINI_RETRY_MAX_DELAY_SECONDS,
)
from ninjatradebuilder.gemini_adapter import GeminiResponsesAdapter
from ninjatradebuilder.cli import load_packet_input, serialize_pipeline_result
from ninjatradebuilder.audit import append_audit_record
from ninjatradebuilder.audit_report import (
    load_audit_records, build_audit_summary, render_audit_summary,
)
from ninjatradebuilder.logging_record import read_log_records, DEFAULT_LOG_PATH
from ninjatradebuilder.schemas.triggers import validate_readiness_trigger
from ninjatradebuilder.validation import validate_historical_packet

from _components.cards import badge_html, stat_card_data
from _components.pipeline_flow import render_pipeline_flow_html
from _components.stage_renderers import (
    render_stage_a, render_stage_b, render_stage_c, render_stage_d,
)
from _components.fail_panel import extract_fail_reasons
from _components.formatters import (
    format_price, format_risk, format_duration,
    decision_color, status_icon,
)
```

### Cell 2 — Input Configuration Form (batch + form pattern)

A **single gated form** with rich HTML template — nothing executes until **Submit** is clicked:

```python
config_form = mo.md("""
<div class="ntb-card">
<h3>{icon} Execution Configuration</h3>

| | |
|---|---|
| **Packet File** | {packet_path} |
| **Contract** | {contract} |
| **Execution Mode** | {mode} |
| **Trigger Family** | {trigger_family} |
| **Trigger Value** | {trigger_value} |

<details><summary style="cursor:pointer; opacity:0.6">⚙ Model & Retry Policy</summary>

| | |
|---|---|
| **Model** | {model} |
| **Timeout (s)** | {timeout} |
| **Max Retries** | {retries} |
| **Initial Delay** | {init_delay} |
| **Max Delay** | {max_delay} |

</details>
</div>
""").batch(
    icon=mo.icon("lucide:settings-2"),
    packet_path=mo.ui.text(value="tests/fixtures/packets.valid.json", full_width=True),
    contract=mo.ui.dropdown(options=["ES","NQ","CL","ZN","6E","MGC"], value="ES"),
    mode=mo.ui.radio(
        options={
            "watchman_only": "🔭 Watchman Only",
            "full_pipeline": "🚀 Full Pipeline",
            "local_validation": "🧪 Local Validation",
        },
        value="watchman_only"
    ),
    trigger_family=mo.ui.dropdown(
        options=["recheck_at_time","price_level_touch"],
        value="recheck_at_time"
    ),
    trigger_value=mo.ui.text(value="2026-01-14T15:15:00Z", full_width=True),
    model=mo.ui.dropdown(
        options=["gemini-3.1-pro-preview"],
        value="gemini-3.1-pro-preview"
    ),
    timeout=mo.ui.slider(start=10, stop=60, value=20, show_value=True),
    retries=mo.ui.number(start=0, stop=5, value=1),
    init_delay=mo.ui.number(start=0, stop=10, value=1, step=0.5),
    max_delay=mo.ui.number(start=0, stop=30, value=4, step=0.5),
).form(
    submit_button_label="▶ Execute",
    show_clear_button=True,
    clear_button_label="Reset",
    bordered=False,
    validate=lambda v: (
        "GEMINI_API_KEY environment variable is required for Full Pipeline mode"
        if v and v.get("mode") == "full_pipeline" and not os.getenv("GEMINI_API_KEY")
        else None
    ),
)
```

The policy knobs are in a `<details>` collapse — visible but not in-your-face. The whole thing is **form-gated**: no execution until Submit.

### Cell 3 — Execution Engine

Reads `config_form.value`, branches on mode, catches all exceptions. Returns `result`, `error`, `execution_meta` (timing, mode, contract).

Uses `mo.status.progress_bar()` during execution.

```python
result = None
error = None
elapsed_seconds = 0.0

if config_form.value is not None:
    v = config_form.value
    repo_root = Path(__file__).resolve().parent.parent
    packet_path = repo_root / v["packet_path"]
    mode = v["mode"]
    contract = v["contract"]

    # Build trigger
    if v["trigger_family"] == "recheck_at_time":
        trigger = {"trigger_family": "recheck_at_time", "recheck_at_time": v["trigger_value"]}
    else:
        trigger = {"trigger_family": "price_level_touch", "price_level": float(v["trigger_value"])}

    start = time.monotonic()
    try:
        if mode == "watchman_only":
            packet_bundle = json.loads(packet_path.read_text())
            result = sweep_watchman(packet_bundle, trigger)

        elif mode == "full_pipeline":
            config = GeminiStartupConfig(
                api_key=os.getenv("GEMINI_API_KEY", ""),
                model=v["model"],
                timeout_seconds=int(v["timeout"]),
                max_retries=int(v["retries"]),
                retry_initial_delay_seconds=float(v["init_delay"]),
                retry_max_delay_seconds=float(v["max_delay"]),
            )
            adapter = GeminiResponsesAdapter.from_startup_config(config)
            packet_bundle = json.loads(packet_path.read_text())
            result = run_pipeline(packet_bundle, contract, model_adapter=adapter)

        elif mode == "local_validation":
            packet = load_packet_input(packet_path, contract=contract)
            result = {"validation": "passed", "contract": packet.market_packet.contract}

    except Exception as exc:
        error = exc

    elapsed_seconds = time.monotonic() - start
```

### Cell 4 — KPI Stat Cards Header Bar

A horizontal bar of `mo.stat()` cards styled with `.style()`:

```python
mo.hstack([
    mo.stat(contract, label="Contract", bordered=True),
    mo.stat(termination_stage, label="Terminated At", bordered=True),
    mo.stat(
        final_decision,
        label="Decision",
        bordered=True,
        direction="increase" if "APPROVED" in final_decision else "decrease",
        caption=decision_caption,
    ),
    mo.stat(f"{stages_reached}/{stages_total}", label="Stages Reached", bordered=True),
    mo.stat(f"{elapsed_seconds:.2f}s", label="Execution Time", bordered=True),
], justify="start", gap=1.0, widths="equal")
```

Dynamic values sourced from `PipelineResultView`. Color and direction respond to the decision (green ↑ for approved, red ↓ for rejected).

### Cell 5 — Pipeline Flow Visualization

A custom `mo.Html()` horizontal stage progression bar built by `_components/pipeline_flow.py`:

```
 ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 │  STAGE A     │ ──▸ │  STAGE B     │ ──▸ │  STAGE C     │ ──▸ │  STAGE D     │
 │ Sufficiency  │     │ Analysis     │     │ Setup        │     │ Risk Auth    │
 │   🟢 READY   │     │ 🟢 COMPLETE  │     │ 🟢 PROPOSED  │     │ 🟢 APPROVED  │
 └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

Each stage box is color-coded:

- **Green** → reached + passed through
- **Amber** → this is where pipeline terminated (with label showing why)
- **Gray/dim** → not reached

This is rendered as styled `<div>` elements with CSS classes from `theme.css`, not a table.

```python
flow_html = render_pipeline_flow_html(view.stages, view.termination_stage)
mo.Html(flow_html)
```

### Cell 6 — Stage Detail Tabs

`mo.ui.tabs()` with one tab per reached stage. Each tab uses rich `mo.Html()` cards:

**Stage A tab:**

- Status badge (pill-shaped, color-coded)
- `mo.hstack` of `mo.stat` cards: packet_age_seconds, stale (bool→icon), threshold_seconds, challenge_state_valid
- If event_lockout: styled callout with event_name, event_time, minutes_until, lockout_type
- `mo.ui.table()` for missing_inputs and disqualifiers (if any) — selectable rows

**Stage B tab:**

- `mo.hstack` top row: regime badge, bias badge, evidence_score gauge, confidence band
- Key levels rendered as a **mini price ladder** (custom HTML): support in green below, resistance in red above, pivot marked
- Value context as a 4-cell grid: prior_value_area, developing_value, vwap, prior_day_range — each with colored position indicator
- structural_notes in a styled blockquote
- conflicting_signals as amber-highlighted chips
- assumptions as a collapsible list

**Stage C tab:**

- Trade direction arrow (▲ LONG green / ▼ SHORT red) as large styled badge
- Two-column layout: left = trade parameters table (entry, stop, T1, T2, size, risk, R:R, class, hold time), right = sizing_math breakdown table
- rationale in a styled card
- disqualifiers as warning chips

**Stage D tab:**

- Decision as large centered badge
- 13-check table with `mo.ui.table()`: columns = `#`, `Check`, `Result` (✅/❌ styled), `Detail`
- Failed checks highlighted with red row background via `.style()`
- If REJECTED: `mo.callout(kind="danger")` with rejection_reasons
- If REDUCED: stat cards showing adjusted_position_size, adjusted_risk_dollars, remaining budgets

```python
tab_contents = {}
if view.stages[0].reached:
    tab_contents[f"{mo.icon('lucide:shield')} Stage A: Sufficiency Gate"] = render_stage_a(
        result.sufficiency_gate_output
    )
if view.stages[1].reached:
    tab_contents[f"{mo.icon('lucide:bar-chart-3')} Stage B: Contract Analysis"] = render_stage_b(
        result.contract_analysis
    )
if view.stages[2].reached:
    tab_contents[f"{mo.icon('lucide:crosshair')} Stage C: Setup Construction"] = render_stage_c(
        result.proposed_setup
    )
if view.stages[3].reached:
    tab_contents[f"{mo.icon('lucide:shield-check')} Stage D: Risk Authorization"] = render_stage_d(
        result.risk_authorization
    )

mo.ui.tabs(tab_contents)
```

### Cell 7 — Fail-Closed Reasons Panel

**Always rendered**, not hidden on success. Uses `mo.callout()` with appropriate `kind`:

- `kind="success"` → TRADE_APPROVED/TRADE_REDUCED with green icon
- `kind="danger"` → rejection, insufficient data, event lockout
- `kind="warn"` → NO_TRADE from analysis or setup stage
- `kind="info"` → local validation mode summary

Content is a structured summary, not a JSON dump:

- **Headline:** "Pipeline terminated at {stage} with decision {decision}"
- **Reason block:** extracted from the terminating stage's specific fields
- **Provider errors:** timeout details, retry count, model name — in a separate sub-callout

```python
fail_data = extract_fail_reasons(result, error)

mo.callout(
    mo.md(f"""
### {fail_data['headline']}

{chr(10).join(f"- {r}" for r in fail_data['reasons'])}

{"" if not fail_data['provider_error'] else f"> **Provider:** {fail_data['provider_error']}"}
"""),
    kind=fail_data['kind'],
)
```

### Cell 8 — Readiness Matrix (absorbed from existing notebook)

Exact same data from `sweep_watchman()` + `readiness_cards_from_sweep()`, but rendered as:

- KPI bar: `mo.hstack` of `mo.stat` cards — total contracts, ready count, blocked count, caution count
- Readiness grid: `mo.ui.table()` with colored status badges per row (not plain text "ready"/"blocked")
- **Click a row** → the table's `.value` (selected rows) drives the detail card below
- Detail card: the existing card from `readiness_matrix.py` but with styled layout — status icon, `mo.hstack` of metric pairs, chip lists for lockouts/awareness/missing

```python
# KPI bar
ready_count = sum(1 for c in readiness_cards if c.status == "ready")
blocked_count = sum(1 for c in readiness_cards if c.status == "blocked")
caution_count = sum(1 for c in readiness_cards if c.status == "caution")

mo.hstack([
    mo.stat(len(readiness_cards), label="Total Contracts", bordered=True),
    mo.stat(ready_count, label="Ready", bordered=True, direction="increase"),
    mo.stat(blocked_count, label="Blocked", bordered=True,
            direction="decrease" if blocked_count > 0 else None,
            target_direction="decrease"),
    mo.stat(caution_count, label="Caution", bordered=True),
], justify="start", gap=1.0, widths="equal")

# Table with badge-styled status
rows = []
for card in readiness_cards:
    rows.append({
        "Contract": card.contract,
        "Status": mo.Html(badge_html(card.status, card.status)),
        "Session": card.session_state,
        "VWAP": card.vwap_posture,
        "Value Loc": card.value_location,
        "Level Prox": card.level_proximity,
        "Trigger": card.trigger_state,
        "Macro": card.macro_state,
        "Event Risk": card.event_risk,
    })
readiness_table = mo.ui.table(rows, label="Readiness Matrix", selection="single")
```

### Cell 9 — Audit & History Panel

Two sub-sections via `mo.ui.tabs({"Audit Artifacts": ..., "Run History": ...})`:

**Audit Artifacts tab:**

- `mo.ui.switch()` — "Write to disk" toggle
- Formatted JSON preview in a `mo.Html()` block with `.ntb-json-viewer` CSS class and syntax-highlighted (using `mo.json()`)
- `mo.download()` button for artifact file
- If audit log exists: `build_audit_summary()` rendered as `mo.hstack` of `mo.stat` cards (total, success, failure) + `mo.ui.table` for breakdown by contract/stage/decision

**Run History tab:**

- Contract filter dropdown
- `mo.ui.table()` with selectable rows, colored status badges
- Empty state: styled `mo.callout(kind="info")` with instructions

```python
mo.ui.tabs({
    f"{mo.icon('lucide:file-json')} Audit Artifacts": mo.vstack([
        write_toggle,
        mo.json(serialized_result) if result else mo.md("*No result to preview.*"),
        mo.download(
            data=json.dumps(serialized_result, indent=2).encode(),
            filename=f"audit_{contract}_{timestamp}.json",
            label="⬇ Download Artifact",
        ) if result else mo.md(""),
        audit_summary_section,
    ]),
    f"{mo.icon('lucide:history')} Run History": mo.vstack([
        history_contract_filter,
        history_table if filtered_rows else mo.callout(
            mo.md("No run history found. Execute a pipeline or watchman sweep to generate log entries."),
            kind="info",
        ),
    ]),
})
```

### Cell 10 — Local Validation Runner

- `mo.ui.dropdown()` auto-populated from `tests/fixtures/*.json` files
- Run button → exercises `validate_historical_packet()`, schema round-trips for each output model
- Results as a checklist table: step name, status (✅/❌ pill badge), duration, error detail (expandable)
- Summary stat cards: passed/total, any schema violations

```python
fixture_dir = repo_root / "tests" / "fixtures"
fixture_files = sorted(str(f.relative_to(repo_root)) for f in fixture_dir.glob("*.json"))

fixture_dropdown = mo.ui.dropdown(options=fixture_files, label="Select Fixture")

# After validation run:
validation_rows = [
    {
        "Step": step_name,
        "Status": mo.Html(badge_html("PASS" if passed else "FAIL", "ready" if passed else "blocked")),
        "Duration": f"{duration_ms:.1f}ms",
        "Detail": error_detail or "—",
    }
    for step_name, passed, duration_ms, error_detail in validation_results
]

mo.vstack([
    mo.hstack([
        mo.stat(f"{pass_count}/{total_count}", label="Checks Passed", bordered=True),
        mo.stat(
            "VALID" if pass_count == total_count else "INVALID",
            label="Overall",
            bordered=True,
            direction="increase" if pass_count == total_count else "decrease",
        ),
    ], justify="start", gap=1.0, widths="equal"),
    mo.ui.table(validation_rows, label="Validation Results"),
])
```

---

## `notebooks/_components/` Specifications

### `cards.py`

```python
def badge_html(text: str, variant: str) -> str:
    """Returns <span class="ntb-badge ntb-badge-{variant}">{text}</span>."""
    return f'<span class="ntb-badge ntb-badge-{variant}">{text.upper()}</span>'


def stat_card_data(result, elapsed_seconds: float) -> list[dict]:
    """Returns list of dicts for the KPI bar stat cards."""
    ...
```

### `pipeline_flow.py`

```python
def render_pipeline_flow_html(
    stages: list,  # list of StageProgressionRow
    termination_stage: str,
) -> str:
    """Returns HTML string for the horizontal 4-stage flow bar.

    Each stage gets a CSS class:
    - .reached — green, stage was passed through
    - .terminated — amber, pipeline stopped here
    - .failed — red, error occurred here
    - .pending — dimmed, not reached

    Stages are connected by arrow dividers using .ntb-flow-connector.
    """
    stage_labels = {
        "sufficiency_gate": ("A", "Sufficiency Gate"),
        "contract_market_read": ("B", "Contract Analysis"),
        "setup_construction": ("C", "Setup Construction"),
        "risk_authorization": ("D", "Risk Authorization"),
    }
    ...
```

### `stage_renderers.py`

```python
def render_stage_a(output) -> object:
    """Render SufficiencyGateOutput as rich HTML fragments.

    Returns dict with keys for the tab cell to compose:
    - status_badge: HTML string
    - staleness_stats: list of dicts for mo.stat
    - event_lockout: HTML string or None
    - missing_inputs: list[str]
    - disqualifiers: list[str]
    """
    ...

def render_stage_b(output) -> object:
    """Render ContractAnalysis as rich HTML fragments.

    Returns dict with keys:
    - regime_badge, bias_badge: HTML strings
    - evidence_score, confidence_band: values for mo.stat
    - price_ladder_html: HTML string for key_levels mini ladder
    - value_context_grid: list of dicts for 2x2 layout
    - structural_notes: str
    - conflicting_signals_chips: HTML string
    - assumptions: list[str]
    """
    ...

def render_stage_c(output) -> object:
    """Render ProposedSetup as rich HTML fragments.

    Returns dict with keys:
    - direction_badge: HTML string (▲ LONG / ▼ SHORT)
    - trade_params: list of dicts for params table
    - sizing_math: list of dicts for sizing table
    - rationale: str
    - disqualifier_chips: HTML string
    """
    ...

def render_stage_d(output) -> object:
    """Render RiskAuthorization as rich HTML fragments.

    Returns dict with keys:
    - decision_badge: HTML string
    - checks_table: list of 13 dicts with check_id, check_name, passed, detail
    - rejection_reasons: list[str]
    - adjusted_stats: list of dicts for mo.stat (if REDUCED)
    """
    ...
```

### `fail_panel.py`

```python
def extract_fail_reasons(result, error) -> dict:
    """Extract fail-closed reasons into structured view.

    Returns:
        {
            "headline": str,        # e.g. "Pipeline terminated at sufficiency_gate → INSUFFICIENT_DATA"
            "reasons": list[str],   # stage-specific reason strings
            "kind": str,            # "success" | "danger" | "warn" | "info"
            "provider_error": str | None,  # GeminiAdapterError details
        }
    """
    ...
```

### `formatters.py`

```python
def format_price(value: float) -> str:
    """Format price with appropriate decimal places."""
    ...

def format_risk(value: float) -> str:
    """Format dollar risk values."""
    ...

def format_duration(seconds: float) -> str:
    """Format execution duration."""
    ...

def decision_color(decision: str) -> str:
    """Map decision to CSS color variable name."""
    ...

def status_icon(status: str) -> str:
    """Map status to emoji icon."""
    ...
```

---

## Acceptance Criteria

| # | Criterion |
|---|---|
| AC-1 | `marimo run notebooks/app.py` launches in dark theme with sidebar nav, no errors, no Gemini key required for non-pipeline modes |
| AC-2 | Config form renders as a single gated card with collapsed policy knobs; nothing executes until ▶ Execute is clicked |
| AC-3 | Contract dropdown dynamically populates from loaded bundle; single-packet files auto-select |
| AC-4 | Policy knobs enforce bounds (timeout ≥ 10, max_delay ≥ init_delay); form validation rejects invalid combos inline |
| AC-5 | KPI stat bar shows contract, termination stage, decision, stages reached, and execution time — all color-coded |
| AC-6 | Pipeline flow bar renders 4 stages with correct color states (green/amber/gray) for any termination point |
| AC-7 | Stage detail tabs only show reached stages; each tab has rich structured rendering (not JSON dumps) |
| AC-8 | Stage B key_levels render as a visual price ladder, not a flat list |
| AC-9 | Stage D 13-check table highlights failed checks with red styling |
| AC-10 | Fail-closed panel always visible, uses callout colors, extracts stage-specific reasons |
| AC-11 | Readiness matrix table has colored status badges; row selection drives detail card |
| AC-12 | Audit preview uses `mo.json()` / styled viewer; download button works; write toggle appends valid JSONL |
| AC-13 | Local validation runner works offline with zero Gemini dependency, reports pass/fail per schema |
| AC-14 | No files modified under `src/ninjatradebuilder/`. `_components/` has zero marimo imports. |
| AC-15 | `pip install -e '.[notebook]'` + `marimo run notebooks/app.py` works from clean venv |

---

## Coding-Agent Prompt

```
Task: Build a professional-grade marimo operator console for the NinjaTradeBuilder-v2 package.
This is a trading-domain app — it must look and feel like a modern operations dashboard, not a notebook.

Hard constraints:
- Do NOT modify any file under src/ninjatradebuilder/. Import only.
- The app lives at notebooks/app.py. Helper rendering functions go in notebooks/_components/
  (pure Python, no marimo imports — they return HTML strings or dicts).
- Custom CSS goes in notebooks/theme.css.
- Use only marimo>=0.8,<1 (already in pyproject.toml[notebook]). No new dependencies.
- Script metadata must set theme = "dark", custom_css = ["theme.css"], and on_cell_change = "lazy".

Architecture:

1. Sidebar cell — mo.sidebar() with mo.nav_menu() using lucide icons.
   Sections: Pipeline, Readiness Matrix, Audit & History, Local Validation.
   Footer shows version.

2. Imports cell — hidden, no output. Import from ninjatradebuilder.execution_facade,
   .view_models, .config, .gemini_adapter, .cli, .audit_report, .logging_record,
   .schemas.triggers, .validation. Import _components.cards, _components.pipeline_flow,
   _components.stage_renderers, _components.fail_panel, _components.formatters.
   Standard lib: json, pathlib.Path, os, time.

3. Config form cell — Use mo.md(...).batch(...).form() pattern. Single styled card
   containing: packet file path (text, default tests/fixtures/packets.valid.json),
   contract dropdown (ES/NQ/CL/ZN/6E/MGC), execution mode radio
   (watchman_only / full_pipeline / local_validation with emoji labels),
   trigger family dropdown + trigger value text field. Policy knobs (model dropdown,
   timeout slider 10-60, retries number 0-5, init_delay number 0-10, max_delay number 0-30)
   inside a <details> collapse. The form has submit_button_label="▶ Execute",
   show_clear_button=True. Form validation: reject if full_pipeline selected and
   GEMINI_API_KEY env var is empty.

4. Execution cell — Reads config_form.value. Branches on mode. Catches all exceptions.
   Records start/end time. For watchman_only: sweep_watchman() or single-contract watchman.
   For full_pipeline: construct GeminiStartupConfig directly (not from env), build
   GeminiResponsesAdapter.from_startup_config(), call execution_facade.run_pipeline().
   For local_validation: load_packet_input() + validate_historical_packet() round-trip only.
   Returns result, error, elapsed_seconds.

5. KPI stat bar cell — mo.hstack() of 5 mo.stat() cards with bordered=True:
   Contract, Terminated At, Decision (with direction="increase" for approved,
   "decrease" for rejected), Stages Reached (e.g. "3/4"), Execution Time.
   All values derived from PipelineResultView or watchman result.
   Wrap in conditional: only render when result exists.

6. Pipeline flow cell — Call _components.pipeline_flow.render_pipeline_flow_html(stages, termination_stage)
   which returns an mo.Html() horizontal bar. Four stage boxes connected by arrow dividers.
   Each box gets a CSS class: .reached (green), .terminated (amber, this is where it stopped),
   .failed (red, if error), .pending (dimmed). Show stage name, stage label, and outcome
   inside each box. The HTML uses the .ntb-flow / .ntb-flow-stage / .ntb-flow-connector
   CSS classes from theme.css.

7. Stage detail tabs cell — mo.ui.tabs() with one tab per reached stage.
   Use _components.stage_renderers to build each tab's content:
   - Stage A renderer: status pill badge (HTML), mo.hstack of mo.stat for staleness fields,
     mo.callout for event_lockout_detail if present, mo.ui.table for missing_inputs/disqualifiers.
   - Stage B renderer: mo.hstack of regime badge + bias badge + evidence_score mo.stat +
     confidence band. Key levels as a custom HTML mini price ladder (support green, resistance red,
     pivot marked). Value context as a 2x2 mo.hstack/mo.vstack grid of labeled values with
     position color. structural_notes as styled blockquote. conflicting_signals as amber HTML
     pill chips. assumptions as collapsible list.
   - Stage C renderer: Large direction badge (▲/▼ with color). Two-column mo.hstack:
     left = trade params table, right = sizing_math table. rationale card. disqualifiers
     as warning chips.
   - Stage D renderer: Large centered decision badge. mo.ui.table of 13 checks with ✅/❌ icons,
     failed rows get .ntb-check-fail styling. mo.callout(kind="danger") for rejection_reasons.
     mo.stat cards for adjusted values and remaining budgets if REDUCED.
   Tabs dict should only include keys for stages where PipelineResultView.stages[i].reached is True.

8. Fail-closed panel cell — Always visible. mo.callout() with kind mapped from decision:
   "success" for TRADE_APPROVED/TRADE_REDUCED, "danger" for rejected/insufficient/lockout,
   "warn" for NO_TRADE, "info" for local validation. Content: headline
   "Pipeline terminated at {stage} → {decision}", then stage-specific extracted reasons
   (gate missing_inputs, analysis conflicting_signals, setup no_trade_reason, risk rejection_reasons).
   If exception: show error type, message, and provider details in a sub-callout.
   Build this with _components.fail_panel.extract_fail_reasons().

9. Readiness matrix cell — mo.hstack of mo.stat KPI cards (total/ready/blocked/caution counts).
   mo.ui.table with rows from readiness_cards_from_sweep(), status column uses HTML badge strings.
   Table .value (selected rows) drives a detail card below: styled mo.Html card with mo.hstack
   metric pairs, chip lists for lockouts/awareness/missing.
   Port data logic from existing notebooks/readiness_matrix.py.

10. Audit panel cell — mo.ui.tabs({"Audit Artifacts": ..., "Run History": ...}).
    Artifacts tab: mo.ui.switch for write toggle, mo.json() for preview, mo.download() button,
    mo.hstack of mo.stat summary cards if audit log exists.
    History tab: contract filter dropdown, mo.ui.table with badge-styled status column,
    empty-state mo.callout(kind="info").

11. Local validation cell — mo.ui.dropdown listing tests/fixtures/*.json.
    Run button. Results as mo.ui.table checklist: step, status badge, error detail.
    Summary mo.stat cards.

notebooks/_components/ spec:
- cards.py: badge_html(text, variant) → returns <span class="ntb-badge ntb-badge-{variant}">text</span>.
  stat_card_data(result) → returns list of dicts for the KPI bar.
- pipeline_flow.py: render_pipeline_flow_html(stages, termination_stage) → returns HTML string
  for the flow bar.
- stage_renderers.py: render_stage_a(output), render_stage_b(output), render_stage_c(output),
  render_stage_d(output) → each returns a dict of HTML fragments and data suitable for the tab
  cell to compose with mo.* layout functions.
- fail_panel.py: extract_fail_reasons(result, error) → returns
  {"headline": str, "reasons": list[str], "kind": str, "provider_error": str|None}.
- formatters.py: format_price(v), format_risk(v), format_duration(s), decision_color(d), status_icon(s).

notebooks/theme.css: Trading-domain dark theme. CSS classes: .ntb-card, .ntb-flow,
.ntb-flow-stage (with .reached/.terminated/.failed/.pending variants), .ntb-flow-connector,
.ntb-badge (with decision/status variants), .ntb-check-pass/.ntb-check-fail, .ntb-json-viewer,
.ntb-price-ladder, .ntb-chip, .ntb-chip-warn, .ntb-chip-danger. Use CSS variables for the
color palette. Support light-dark() fallback but optimize for dark.

Testing: Verify AC-1 through AC-15 from the build plan. At minimum: marimo run notebooks/app.py
launches dark-themed with sidebar nav without import errors when GEMINI_API_KEY is unset.
Config form gates execution. Flow bar renders correctly for each termination stage.
Stage tabs show rich formatted content. Fail panel always visible with correct callout kind.
```

---

## Summary: v1 vs v2

| First Plan | This Plan |
|---|---|
| Vertical cell scroll | Sidebar + nav_menu sectioned layout |
| Plain `mo.ui.dropdown` / `mo.ui.table` | `batch().form()` gated execution card with `<details>` collapse |
| Flat text status | `mo.stat()` KPI bar with direction indicators, color-coded |
| Stage outputs as accordion | Custom HTML pipeline flow bar + tabbed rich renderers |
| JSON dump of results | Mini price ladder, trade direction badges, 13-check styled table |
| No custom styling | Full `theme.css` with trading color palette, card shadows, pill badges |
| No component separation | `_components/` for testable pure-Python HTML generators |
| 12 acceptance criteria | 15 criteria including visual quality checks |
