# Bet Lab

Player prop research demo: DraftKings lines (via ESPN's public, unofficial feed) with L5/L10/L20 hit rates from ESPN game logs.
Static `index.html` + `data/*.json`, refreshed by GitHub Actions (`scripts/fetch_props.py`).

Optional: add an `ODDS_API_KEY` repo secret for future multi-book lines (not used yet).

Personal research only. Not betting advice. 21+.

## Market cross-check (added Oct 2026)
`scripts/bl_xcheck.py` → `data/xcheck.json`, shown on `sources.html` (⚖️ Market check):

| Source | Used for |
|---|---|
| Arb Lab's published `markets.json` (Kalshi, Polymarket, Odds API books) | DraftKings home-win % vs prediction-market and other-book consensus for NFL/NHL/NBA/MLB/CFB sides. Reuses Arb Lab's snapshot, so it costs no extra Odds API credits. |
| Kalshi public API, `KXNFLTD` series (1+ TD markets) | Our anytime-TD probability vs the Kalshi mid-price; wide or empty books are skipped |

It's a cross-check only and doesn't change picks. The step is `continue-on-error`, and a failed source keeps its previous table.
