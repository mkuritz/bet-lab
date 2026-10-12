"""Bet Lab cross-check: our numbers / DraftKings vs prediction markets (Kalshi, Polymarket) and other books.
Sides reuse Arb Lab's published market snapshot (no extra API credits); NFL anytime-TD props are checked against Kalshi's public TD markets."""
import json, os, sys, statistics as stc
sys.path.insert(0, os.path.dirname(__file__))
from xlib import Src, js, f, norm, write
D = os.path.join(os.path.dirname(__file__), "..", "data")
S = Src()
def ml_prob(a, h):
    def p(o): return 100 / (o + 100) if o > 0 else -o / (-o + 100)
    if a is None or h is None: return None
    pa, ph = p(a), p(h); return ph / (pa + ph)
mk = S.get("Arb Lab market snapshot (Kalshi, Polymarket, Odds API books)", "https://mkuritz.github.io/arb-lab/data/markets.json", "Prediction-market and multi-book win probabilities for each game, compared with DraftKings", lambda: js("https://mkuritz.github.io/arb-lab/data/markets.json")["games"], link="https://mkuritz.github.io/arb-lab/") or []
def kal():
    out, cur = [], ""
    for _ in range(5):
        d = js("https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=KXNFLTD&status=open&limit=1000" + ("&cursor=" + cur if cur else ""))
        out += d["markets"]; cur = d.get("cursor")
        if not cur: break
    return [m for m in out if f(m.get("floor_strike")) == 0.5]
km = S.get("Kalshi NFL touchdown markets (public API)", "https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=KXNFLTD", "Market-implied anytime-TD odds vs our model and DraftKings", kal, link="https://kalshi.com/") or []
S.list = [dict(name="Already used: ESPN (DraftKings lines, props, logs, injuries), nflverse, NHL API, Open-Meteo", status="ok", what="Core model inputs (unchanged)", new=False)] + S.list
SP = {"nfl": "NFL", "nhl": "NHL", "nba": "NBA", "mlb": "MLB", "cfb": "ncaaf"}
idx = {}
for g in mk:
    idx[(g["sport"], g["home"]["abbr"], g["away"]["abbr"], g["start"][:10])] = g
side, nd, nc = [], 0, 0
for sp, key in SP.items():
    p = os.path.join(D, "games_%s.json" % sp)
    if not os.path.exists(p): continue
    for g in json.load(open(p)):
        dk = ml_prob(g.get("mla"), g.get("mlh"))
        m = idx.get((key.lower() if key != "ncaaf" else "ncaaf", g["home"], g["away"], (g.get("time") or "")[:10]))
        if not m or dk is None: continue
        v = m["venues"]; kh = (v.get("Kalshi") or {}).get("home"); ph = (v.get("Polymarket") or {}).get("home")
        books = [x["home"] for n, x in v.items() if x.get("kind") == "book" and n != "DraftKings"]
        bk = stc.median(books) if books else None
        mk_ = [x for x in (kh, ph) if x is not None]
        if not mk_: continue
        ex = sum(mk_) / len(mk_); gap = dk - ex; nc += 1
        flag = "agree" if abs(gap) < .03 else ("watch" if abs(gap) < .06 else "disagree"); nd += flag == "disagree"
        lean = "—" if abs(gap) < .03 else ("markets like %s more" % (g["away"] if gap > 0 else g["home"]))
        side.append([sp.upper(), "%s @ %s" % (g["away"], g["home"]), g.get("details") or "", round(100 * dk, 1), round(100 * kh, 1) if kh is not None else "—", round(100 * ph, 1) if ph is not None else "—", round(100 * bk, 1) if bk is not None else "—", len(books) or "—", round(100 * gap, 1), lean, flag])
side.sort(key=lambda r: -abs(r[8]))
td = []
an = json.load(open(os.path.join(D, "analyst_nfl.json"))) if os.path.exists(os.path.join(D, "analyst_nfl.json")) else {}
ours = {norm(x["player"]): x for x in an.get("top_td", [])}
props = json.load(open(os.path.join(D, "props_nfl.json"))) if os.path.exists(os.path.join(D, "props_nfl.json")) else []
dkp = {}
for x in props:
    if x.get("market") == "Anytime TD" and x.get("price") is not None: dkp[norm(x["player"])] = x["price"]
for m in km:
    nm = norm(m["title"].split(":")[0]); bid, ask = f(m.get("yes_bid_dollars"), 0), f(m.get("yes_ask_dollars"), 0)
    if ask <= 0 or ask - bid > .12: continue  # skip empty / very wide books
    mid = (bid + ask) / 2; o = ours.get(nm)
    if not o: continue
    d = o["prob"] - mid
    td.append([o["player"], o["team"], o["pos"], round(100 * o["prob"], 1), round(100 * mid, 1), "%.0f¢/%.0f¢" % (100 * bid, 100 * ask), round(100 * d, 1), "agree" if abs(d) < .05 else ("watch" if abs(d) < .10 else "disagree")])
td.sort(key=lambda r: -abs(r[6]))
tables = [dict(title="Game sides: DraftKings vs prediction markets vs other books", note="Home win probability (vig removed). Gap = DraftKings minus the Kalshi/Polymarket average. A gap over 6 points means the exchanges see the game differently; check news, then shop the side the markets favor.", cols=["Sport", "Game", "DK line", "DK home %", "Kalshi %", "Polymarket %", "Other books (median) %", "# books", "Gap (pts)", "Lean", "Verdict"], rows=side, flag=10),
          dict(title="NFL anytime TD: our model vs Kalshi", note="Kalshi mid-price (between bid and ask) as an implied probability; markets with no quotes or a spread over 12¢ are skipped. 'disagree' = 10+ points apart: either an edge or something our model is missing.", cols=["Player", "Team", "Pos", "Our prob %", "Kalshi %", "Kalshi bid/ask", "Diff (pts)", "Verdict"], rows=td, flag=7)]
summ = [["Games cross-checked", nc, "vs Kalshi / Polymarket"], ["Market disagreements", nd, "gap ≥ 6 pts"], ["TD props vs Kalshi", len(td), ("our model averages %+.1f pts vs Kalshi" % stc.mean(r[6] for r in td)) if td else "with live quotes"], ["Sources OK", "%d/%d" % (sum(s["status"] == "ok" for s in S.list), len(S.list)), "this refresh"]]
write(os.path.join(D, "xcheck.json"), "Bet Lab · market cross-check", S, tables, summ)
print([(s["name"][:30], s["status"], s.get("rows")) for s in S.list], summ, side[:3], td[:5])
