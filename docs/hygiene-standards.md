# Hygiene Standards

These standards apply to `Claudes-NTB`, the operator-facing Marimo app repository for NinjaTradeBuilder v3.

## Repository Identity

- The local folder name must match the GitHub repo identity. For this repo, the expected local folder is `Claudes-NTB` and the expected GitHub repository identity is `richportfutures-byte/Claudes-NTB`.
- Before destructive work, verify the working directory, branch, remote, and head:
  - `pwd`
  - `git status --short --branch`
  - `git remote -v`
  - `git rev-parse --short HEAD`
- Record those checks in the work report when the task involves cleanup, migration, branch changes, or removal decisions.

Default branch changes require repository identity verification, branch graph verification, and main-vs-product-branch verification before any action is taken. Branch deletion remains a destructive action requiring explicit operator approval. Empty or obsolete branches should be retained until specifically approved for removal.

## Destructive Work Requires Approval

Do not perform any of the following without explicit operator approval for the specific action:

- Repository deletion
- Branch deletion
- `git reset`
- `git clean`
- Force-push
- Merge

Approval must be concrete. General cleanup intent is not enough.

## Generated Artifacts

Generated artifacts must remain ignored and must not be intentionally committed:

- `.DS_Store`
- `.env`
- `.env.*`
- `.pytest_cache/`
- `.venv/`
- `__marimo__/`
- `__pycache__/`
- `*.egg-info/`
- `*.pyc`

If any of these appear in the worktree, remove or ignore them only according to the current cleanup approval scope. Do not use broad destructive commands to handle them without approval.

## Data And Operator Artifacts

Data files must be classified before removal. Classification should include current status, likely purpose, hygiene risk level, and recommended next action. A data file may be removed only after the operator approves the specific removal.

Operator-facing artifacts, whiteboards, exports, captures, reports, and sample packets should be treated as potentially useful product evidence until reviewed.

## Live Providers And Tests

- Live provider calls must stay mocked by default or be explicitly operator-invoked.
- Tests must avoid live network calls by default.
- Any test or script that can call a live provider must require a clear opt-in flag, explicit environment variable, or operator-run command.
- Documentation should identify live-call requirements before a command is run.
