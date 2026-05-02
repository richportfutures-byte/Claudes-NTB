# Data Inventory

Current tracked non-code/operator artifacts are retained pending review. No files are approved for removal by this inventory alone.

| File | Current status | Likely purpose | Hygiene risk level | Recommended next action |
| --- | --- | --- | --- | --- |
| `data/NinjaTrader - Default.html` | Retained pending review | Captured NinjaTrader web shell or reference page used during operator workflow discovery. | Medium | Review for whether it is needed as a fixture or documentation reference. If retained, move to a clearly named fixture/reference path and document whether external CDN links are expected. |
| `data/Performance.20260324.195042.pdf` | Retained pending review | Exported performance report from March 24, 2026, likely used as operator evidence or sample trading-performance context. | High | Review for account, trade, or personally sensitive data. Decide whether to keep as a sanitized fixture, replace with redacted sample data, or remove after explicit approval. |
| `data/sample_packet.json` | Retained pending review | Local sample market/challenge-state packet used for smoke validation and app demonstration. | Low | Keep as a fixture if tests or demos depend on it. Confirm values are synthetic or acceptable for repository use. |
| `ninjatradebuilder_sections_1_2_whiteboard.jsx` | Retained pending review | React/Tailwind whiteboard companion explaining early product sections and Watchman/pre-market briefing concepts. | Medium | Move into `docs/` or an `artifacts/` reference area after review, or convert the useful content into markdown product documentation. |
| `ninjatradebuilder_whiteboard.html` | Retained pending review | Standalone browser version of the NinjaTradeBuilder whiteboard companion, including CDN-loaded React, Babel, and Tailwind. | Medium | Review whether the standalone HTML is still useful. If retained, move to a documented reference path and note that opening it may load external CDN assets. |
