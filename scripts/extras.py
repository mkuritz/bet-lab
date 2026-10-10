"""Bet Lab extras: defense-vs-position, usage trends, line history, injury impact.
All sources free/public: nflverse (GitHub releases), ESPN public JSON. Best-effort."""
import csv, io, re, datetime as dt
from urllib.request import Request, urlopen
import fetch_props as F

NV = "https://github.com/nflverse/nflverse-data/releases/download/"
NV2ESPN = {"LA": "LAR", "WAS": "WSH"}
DVP_STAT = {  # prop market -> nflverse column(s)
    "Passing Yards": ["passing_yards"], "Passing Touchdowns": ["passing_tds"], "Pass Completions": ["completions"],
    "Passing Attempts": ["attempts"], "Passing Interceptions": ["passing_interceptions"],
    "Rushing Yards": ["rushing_yards"], "Carries": ["carries"], "Receiving Yards": ["receiving_yards"],
    "Receptions": ["receptions"], "Rushing Plus Receiving Yards": ["rushing_yards", "receiving_yards"],
    "Passing Plus Rushing Yards": ["passing_yards", "rushing_yards"],
}
SKILL = {"QB", "RB", "WR", "TE"}

def csv_rows(url):
    with urlopen(Request(url, headers=F.UA), timeout=60) as r:
        return list(csv.DictReader(io.TextIOWrapper(r, "utf-8")))

def norm(n):
    n = re.sub(r"[^a-z ]", "", n.lower().replace("-", " "))
    return " ".join(w for w in n.split() if w not in {"jr", "sr", "ii", "iii", "iv", "v"})

def season_year():
    t = dt.date.today()
    return t.year if t.month >= 8 else t.year - 1

def f(x):
    try: return float(x)
    except (TypeError, ValueError): return 0.0

# ---------- 1. defense vs position (NFL) ----------
def nfl_dvp(rows):
    """per (defense team, position, column): avg allowed per game, ranked (1 = allows most = softest)."""
    tot, games = {}, {}
    for r in rows:
        if r["season_type"] != "REG" or r["position"] not in SKILL: continue
        d = NV2ESPN.get(r["opponent_team"], r["opponent_team"])
        games.setdefault(d, set()).add(r["week"])
        for c in {c for v in DVP_STAT.values() for c in v}:
                k = (d, r["position"], c)
                tot[k] = tot.get(k, 0) + f(r.get(c))
    out = {}
    for pos in SKILL:
        for c in {c for v in DVP_STAT.values() for c in v}:
            vals = sorted(((tot.get((d, pos, c), 0) / len(w), d) for d, w in games.items()), reverse=True)
            for i, (v, d) in enumerate(vals):
                out[(d, pos, c)] = (i + 1, round(v, 1), len(vals), len(games[d]))
    return out

# ---------- 2. usage (NFL via nflverse; others via ESPN logs) ----------
def trend(l5, szn):
    if l5 is None or not szn: return 0
    r = (l5 - szn) / szn
    return 1 if r > 0.1 else -1 if r < -0.1 else 0

def nfl_usage(stats, snaps):
    u = {}
    for r in stats:
        if r["season_type"] != "REG": continue
        k = (norm(r["player_display_name"]), NV2ESPN.get(r["team"], r["team"]))
        u.setdefault(k, {}).setdefault(int(r["week"]), {})
        u[k][int(r["week"])].update(tg=f(r["targets"]), ca=f(r["carries"]))
    for r in snaps:
        if r["game_type"] != "REG": continue
        k = (norm(r["player"]), NV2ESPN.get(r["team"], r["team"]))
        if f(r["offense_snaps"]) <= 0: continue
        u.setdefault(k, {}).setdefault(int(r["week"]), {})["sn"] = f(r["offense_pct"]) * 100
    res = {}
    for k, wk in u.items():
        weeks = sorted(wk)
        def m(key, ws):
            v = [wk[w][key] for w in ws if key in wk[w]]
            return round(sum(v) / len(v), 1) if v else None
        d = {"n": len(weeks)}
        for key in ("sn", "tg", "ca"):
            s5, sz = m(key, weeks[-5:]), m(key, weeks)
            # last-3 vs season trend so the arrow can differ early in the season
            l3 = m(key, weeks[-3:])
            if sz is not None:
                d[key] = {"szn": sz, "l5": s5, "l3": l3, "tr": trend(l3, sz)}
        res[k] = d
    return res

def log_usage(sport, games):
    yr = games[0]["d"][:4] if games else None
    cur = [g for g in games if g["d"][:4] == yr]
    if sport == "nba": key, fn, lab = "min", lambda g: g["s"].get("minutes"), "Minutes"
    elif sport == "mlb": key, fn, lab = "pa", lambda g: (g["s"].get("atBats", 0) + g["s"].get("walks", 0) + g["s"].get("hitByPitch", 0)) if "atBats" in g["s"] else None, "PA (AB+BB+HBP)"
    else: return None
    v = [x for x in (fn(g) for g in cur) if x is not None]
    if not v: return None
    l5, sz = sum(v[:5]) / len(v[:5]), sum(v) / len(v)
    return {"n": len(v), key: {"szn": round(sz, 1), "l5": round(l5, 1), "tr": trend(l5, sz), "label": lab}}

# ---------- 3. line history ----------
def line_history(sport, props):
    hist = F.load("line_history_%s.json" % sport, {})
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
    live = set()
    for p in props:
        k = p["aid"] + "|" + p["market"]
        live.add(k)
        h = hist.setdefault(k, [])
        if not h and p.get("open") is not None and p["open"] != p["line"]:
            h.append(["open", p["open"]])
        if not h or h[-1][1] != p["line"]:
            h.append([now, p["line"]])
        p["lh"] = h[-12:]
        cut = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=24)).strftime("%Y-%m-%dT%H:%MZ")
        prior = [x for x in h if x[0] != "open" and x[0] <= cut]
        p["mv24"] = round(p["line"] - prior[-1][1], 2) if prior else None
    F.save("line_history_%s.json" % sport, {k: v[-30:] for k, v in hist.items() if k in live})

# ---------- 4. injury impact (NFL) ----------
def injuries_nfl(snaps, full):
    d = F.get("https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries") or {}
    share = {}
    for r in snaps:
        if r["game_type"] == "REG" and f(r["offense_snaps"]) > 0:
            share.setdefault((norm(r["player"]), NV2ESPN.get(r["team"], r["team"])), []).append(f(r["offense_pct"]))
    out = {}
    for t in d.get("injuries", []):
        for i in t.get("injuries", []):
            st = i.get("status", "")
            if st not in ("Out", "Doubtful", "Injured Reserve"): continue
            a = i.get("athlete", {})
            pos = (a.get("position") or {}).get("abbreviation", "")
            team = (a.get("team") or {}).get("abbreviation", "")
            if pos not in SKILL or not team: continue
            sh = share.get((norm(a.get("displayName", "")), team), [])
            if not sh or sum(sh) / len(sh) < 0.5: continue  # starter = avg 50%+ offensive snaps in 2026 games played
            m = re.search(r"/id/(\d+)", " ".join(l.get("href", "") for l in a.get("links", [])))
            if not m: continue
            out.setdefault(team, []).append({"aid": m.group(1), "name": a.get("displayName"), "pos": pos, "status": st,
                                             "snap": round(100 * sum(sh) / len(sh))})
    cache = F.load("injlogs_nfl.json", {})
    ids = [x["aid"] for v in out.values() for x in v]
    for aid in ids:
        if full or aid not in cache:
            cache[aid] = [{"e": g["e"], "d": g["d"], "t": g["t"]} for g in F.gamelog("football/nfl", aid)]
    F.save("injlogs_nfl.json", {a: cache[a] for a in ids})
    F.save("injuries_nfl.json", out)
    return out, cache

def without_splits(p, games, inj, ilogs):
    res = []
    for x in inj.get(p["team"], []):
        if x["aid"] == p["aid"]: continue
        il = [g for g in ilogs.get(x["aid"], []) if g["t"] == p["team"]]
        if not il: continue
        played, start = {g["e"] for g in il}, min(g["d"] for g in il)
        pool = [g for g in games if g.get("t") == p["team"] and g["d"] >= start]
        def agg(gs):
            v = [F.statval(g, p["stat"]) for g in gs]
            v = [y for y in v if y is not None]
            return [sum(y > p["line"] for y in v), len(v), round(sum(v) / len(v), 2)] if v else None
        wo, w = agg([g for g in pool if g.get("e") not in played]), agg([g for g in pool if g.get("e") in played])
        if wo or w: res.append({"name": x["name"], "pos": x["pos"], "status": x["status"], "wo": wo, "w": w})
    return res or None

def enrich(sport, cfg, props, logs, full):
    line_history(sport, props)
    if sport == "nfl":
        yr = season_year()
        stats = csv_rows(NV + "stats_player/stats_player_week_%d.csv" % yr)
        snaps = csv_rows(NV + "snap_counts/snap_counts_%d.csv" % yr)
        dvp, use = nfl_dvp(stats), nfl_usage(stats, snaps)
        inj, ilogs = injuries_nfl(snaps, full)
        for p in props:
            cols = DVP_STAT.get(p["market"])
            if cols and p["pos"] in SKILL:
                ranks = [dvp.get((p["oa"], p["pos"], c)) for c in cols]
                if all(ranks):
                    val = round(sum(r[1] for r in ranks), 1)
                    # combined markets: rank by summed allowance
                    if len(cols) > 1:
                        allv = sorted({d: sum(dvp[(d, p["pos"], c)][1] for c in cols) for (d, ps, c0) in dvp if ps == p["pos"] and c0 == cols[0]}.items(), key=lambda kv: -kv[1])
                        rank = [d for d, _ in allv].index(p["oa"]) + 1
                    else:
                        rank = ranks[0][0]
                    n = ranks[0][2]
                    p["dvp"] = {"r": rank, "of": n, "v": val, "g": ranks[0][3],
                                "tag": "soft" if rank <= 8 else "tough" if rank > n - 8 else ""}
            u = use.get((norm(p["player"]), p["team"]))
            if u: p["u"] = u
            if p.get("stat"):
                ws = without_splits(p, logs.get(p["aid"], []), inj, ilogs)
                if ws: p["inj"] = ws
    elif sport in ("nba", "mlb"):
        for p in props:
            u = log_usage(sport, logs.get(p["aid"], []))
            if u: p["u"] = u
