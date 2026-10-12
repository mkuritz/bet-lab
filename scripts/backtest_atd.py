"""Out-of-sample backtest of the analyst ATD model (weeks 1..N of the current season).
For week w: only data before w (2025 reg+post + 2026 weeks < w). Inputs reconstructed: player's TD-game rate (shrunk to positional prior, k=6),
team implied total from nflverse closing spread/total, opponent rush/pass TDs allowed per game. NOT reconstructable: historical injury lists (OL factor), mismatch boost.
Universe: players active in week w at QB/RB/WR/TE with a role (QB >=15 att/g, others >=3 carries+targets/g over their last 3 prior games) ~ who DK prices ATD for."""
import json, math, sys
import extras as X
PRIOR = {"RB": 0.30, "WR": 0.22, "TE": 0.15, "QB": 0.08}
YR = 2026

def load():
    rows = []
    for y in (YR - 1, YR):
        rows += [r for r in X.csv_rows(X.NV + "stats_player/stats_player_week_%d.csv" % y) if r["position"] in PRIOR]
    sch = {r["game_id"]: r for r in X.csv_rows(X.NV + "schedules/games.csv") if r["season"] == str(YR)}
    return rows, sch

def key(r): return (int(r["season"]), (0 if r["season_type"] == "REG" else 30) + int(r["week"]))
def td(r): return X.f(r["rushing_tds"]) + X.f(r["receiving_tds"]) >= 1

def run(weeks=range(1, 6)):
    rows, sch = load()
    out = []
    for w in weeks:
        cut = (YR, w)
        prior = [r for r in rows if key(r) < cut]
        cur = [r for r in rows if r["season"] == str(YR) and r["week"] == str(w) and r["season_type"] == "REG"]
        # opponent TDs allowed per game (this season prior weeks, else last season)
        dsrc = [r for r in prior if r["season"] == str(YR)] or [r for r in prior if r["season"] == str(YR - 1)]
        allow, gms = {}, {}
        for r in dsrc:
            o = r["opponent_team"]; gms.setdefault(o, set()).add(r["game_id"])
            a = allow.setdefault(o, [0, 0]); a[0] += X.f(r["rushing_tds"]); a[1] += X.f(r["receiving_tds"])
        D = {t: (a[0] / len(gms[t]), a[1] / len(gms[t])) for t, a in allow.items()}
        lav = [sum(v[i] for v in D.values()) / len(D) for i in (0, 1)]
        by = {}
        for r in prior: by.setdefault(r["player_id"], []).append(r)
        itts = {}
        for g in sch.values():
            if g["week"] != str(w) or not g["total_line"]: continue
            T, S = float(g["total_line"]), float(g["spread_line"])  # spread_line > 0 = home favored
            itts[g["home_team"]] = (T + S) / 2; itts[g["away_team"]] = (T - S) / 2
        avg = sum(itts.values()) / len(itts)
        for r in cur:
            h = sorted(by.get(r["player_id"], []), key=key)
            if not h: continue
            l3 = h[-3:]
            role = (sum(X.f(x["attempts"]) for x in l3) / len(l3) >= 15) if r["position"] == "QB" else (sum(X.f(x["carries"]) + X.f(x["targets"]) for x in l3) / len(l3) >= 3)
            if not role: continue
            pos = r["position"]; n = len(h); k = sum(td(x) for x in h)
            base = (k + 6 * PRIOR[pos]) / (n + 6)
            itt = itts.get(r["team"]); fi = max(0.8, min(1.2, (itt / avg) ** 0.5)) if itt else 1.0
            i = 0 if pos in ("QB", "RB") else 1
            od = D.get(r["opponent_team"]); fd = max(0.8, min(1.25, (od[i] / lav[i]) ** 0.5)) if od and lav[i] else 1.0
            szn = [x for x in h if x["season"] == str(YR)] or [x for x in h if x["season"] == str(YR - 1)]
            out.append({"w": w, "player": r["player_display_name"], "pos": pos, "team": r["team"], "p": min(0.70, base * fi * fd),
                        "raw_rate": k / n, "szn_rate": sum(td(x) for x in szn) / len(szn), "y": int(td(r))})
    return out

def metrics(P, Y):
    e = 1e-4
    return {"n": len(Y), "brier": sum((p - y) ** 2 for p, y in zip(P, Y)) / len(Y),
            "logloss": -sum(y * math.log(max(e, p)) + (1 - y) * math.log(max(e, 1 - p)) for p, y in zip(P, Y)) / len(Y),
            "mean_p": sum(P) / len(P), "rate": sum(Y) / len(Y)}

def table(P, Y):
    t = []
    for b in range(10):
        ix = [i for i, p in enumerate(P) if b / 10 <= p < (b + 1) / 10]
        if ix: t.append({"bin": "%d-%d%%" % (b * 10, b * 10 + 10), "n": len(ix), "pred": sum(P[i] for i in ix) / len(ix), "act": sum(Y[i] for i in ix) / len(ix)})
    return t

if __name__ == "__main__":
    R = run(); json.dump(R, open(sys.argv[1] if len(sys.argv) > 1 else "/tmp/bt.json", "w"))
    Y = [r["y"] for r in R]
    for nm in ("p", "szn_rate", "raw_rate"): print(nm, metrics([r[nm] for r in R], Y))
    print("base-rate", metrics([sum(Y) / len(Y)] * len(Y), Y))
    for b in table([r["p"] for r in R], Y): print(b)
    for pos in PRIOR:
        s = [r for r in R if r["pos"] == pos]; print(pos, metrics([r["p"] for r in s], [r["y"] for r in s]))

def summary():
    import datetime as dt
    R = run(range(1, max(int(r["week"]) for r in X.csv_rows(X.NV + "stats_player/stats_player_week_%d.csv" % YR) if r["season_type"] == "REG") + 1))
    Y = [r["y"] for r in R]
    S = {"made": dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"), "weeks": sorted({r["w"] for r in R}),
         "model": metrics([r["p"] for r in R], Y), "szn_rate": metrics([r["szn_rate"] for r in R], Y), "base_rate": metrics([sum(Y) / len(Y)] * len(Y), Y),
         "table": table([r["p"] for r in R], Y), "by_pos": {p: metrics([r["p"] for r in R if r["pos"] == p], [r["y"] for r in R if r["pos"] == p]) for p in PRIOR},
         "market": "No historical ATD prices available for free (DK lines aren't archived by ESPN; Kalshi lists no 2026-season ATD markets). Kalshi prices are logged with our picks going forward when listed."}
    import fetch_props as F; F.save("atd_calibration.json", S); return S

def maybe_refresh(days=3):
    import fetch_props as F, datetime as dt
    S = F.load("atd_calibration.json", None)
    if S and dt.datetime.fromisoformat(S["made"]) > dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days): return
    try: summary()
    except Exception as e: print("backtest ERROR", e)
