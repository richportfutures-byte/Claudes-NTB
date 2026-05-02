# Repository Role

`Claudes-NTB` is the operator-facing Marimo application repository for the NinjaTradeBuilder v3 product. Its purpose is to hold the local operator console experience, product-facing workflow documentation, smoke tests, and app-level integration code that make the v3 trading decision system usable by the operator.

This repository works alongside `/Users/stu/Projects/NinjaTradeBuilder-main`, which is the backend/runtime package. `NinjaTradeBuilder-main` owns the lower-level runtime package concerns: shared Python package behavior, backend services, reusable runtime modules, and implementation surfaces that should remain independent of the Marimo operator app.

`Claudes-NTB` is not a duplicate of `NinjaTradeBuilder-main`. It is a separate product-facing repo with a distinct role: presenting and validating the operator-facing Marimo v3 experience while depending on backend/runtime behavior that may live in the main package repo.

`ntb-marimo-console` is separate from this repository and must not be touched by this repo cleanup. Hygiene work in `Claudes-NTB` applies only to this repo unless the operator explicitly approves a separate cross-repo task.
