"""Edge Tracker: accountability log for every Bet Lab / MLB Lab recommendation.
log:   data/edge_log.jsonl  APPEND-ONLY. One line per pick, written before first pitch/kickoff. Git history timestamps it.
close: data/edge_close.json  latest pre-start market price per pick (last pre-start snapshot = closing price).
grade: data/edge_grades.json result per pick from official box scores / Bet Lab outcomes.
stats: data/edge_stats.json  record, CLV, ROI, calibration, Brier (us vs market), per-signal scoreboard + weights.
Sources: Bet Lab data files (ESPN public feed / DK lines), MLB Lab files (Kalshi public API prices),
MLB statsapi box scores, Kalshi public market endpoint. Nothing is fabricated: missing price/close => null ("unavailable")."""
import json, os, datetime as dt, urllib.request

D = os.path.join(os.path.dirname(__file__), "..", "data")
MLB_RAW = "https://raw.githubusercontent.com/mkuritz/mlb-lab/main/data/"
KALSHI = "https://api.elections.kalshi.com/trade-api/v2/markets/"
NOW = dt.datetime.now(dt.timezone.utc)
MIN_N = 30          # picks needed before a signal can be "proven"
KELLY_FRAC, KELLY_CAP = 0.25, 0.01
LONGSHOT_DEC = 3.0  # +200 or longer = upside territory
BASE = {"hr_model", "k_model"}  # model itself isn't an independent "star"

def p(f): return os.path.join(D, f)
def load(f, d):
    try: return json.load(open(p(f)))
    except Exception: return d
def save(f, o): json.dump(o, open(p(f), "w"), separators=(",", ":"), sort_keys=True)
def get(url, t=20):
    req = urllib.request.Request(url, headers={"User-Agent": "SportsLabs-EdgeTracker"})
    with urllib.request.urlopen(req, timeout=t) as r: return json.load(r)
def T(s):
    s = s.replace("Z", "+00:00")
    if len(s) == 22 and s[-6] in "+-" and s[16] == "+": pass
    try: return dt.datetime.fromisoformat(s)
    except ValueError: return dt.datetime.fromisoformat(s[:16] + "+00:00")
def am_dec(a): return None if a is None else (1 + a / 100 if a > 0 else 1 + 100 / -a)
def rnd(x, n=4): return None if x is None else round(x, n)

def read_log():
    out = []
    if os.path.exists(p("edge_log.jsonl")):
        for ln in open(p("edge_log.jsonl")):
            if ln.strip(): out.append(json.loads(ln))
    return out

# ---------------- signal record (feedback loop) ----------------
def signal_status(stats):
    return {k: v.get("status", "unproven") for k, v in (stats.get("signals") or {}).items()}

def classify(e, status):
    """Upside window. Stars Align = upside bet, +EV at our estimate, and >=2 independent PROVEN signals agree."""
    dec, est = e.get("price_dec"), e.get("p_model")
    upside = (e.get("legs", 1) > 1) or (dec is not None and dec >= LONGSHOT_DEC)
    ev = None if (dec is None or est is None) else est * dec - 1
    proven = [s for s in e["signals"] if s not in BASE and status.get(s) == "proven"]
    if not upside: tag = None
    elif ev is not None and ev > 0 and len(proven) >= 2: tag = "stars_align"
    else: tag = "fun_money"
    kelly = None
    if tag == "stars_align":
        b = dec - 1; kelly = round(min(KELLY_CAP, KELLY_FRAC * (est * b - (1 - est)) / b), 4)
    return {"upside": upside, "ev": rnd(ev), "tag": tag, "aligned": proven, "kelly": kelly}

# ---------------- collectors ----------------
def from_recs():
    H = load("recs_history.json", {"recs": []}); out = []
    for r in H["recs"]:
        dec = r.get("odds_dec"); est = r.get("est")
        sig = [r["src"]]
        if dec and est and est > 1 / dec: sig.append("market_underpriced")
        mk = r["legs"][0]["market"] if len(r["legs"]) == 1 else "Parlay/SGP"
        out.append({"id": "bl|" + r["id"], "sport": r["sport"], "market": mk, "title": r.get("title"), "start": r["time"],
                    "p_model": est, "price_dec": dec, "implied": rnd(1 / dec) if dec else None,
                    "price_src": "DraftKings via ESPN public feed" if dec else None, "legs": len(r["legs"]),
                    "signals": sig, "source": "Bet Lab recs (%s)" % r["src"], "ref": {"rec": r["id"]}})
    return out

def from_mlb():
    out = []
    try: hr = get(MLB_RAW + "hr_scores.json")
    except Exception: hr = {}
    for x in hr.get("players", []):
        m = x.get("market") or {}
        if not m.get("implied") or x.get("edge") is None or x["edge"] <= 0: continue  # only flagged edges
        f = x.get("feats") or {}; sig = ["hr_model", "market_underpriced"]
        if (f.get("temp") or 0) >= 80 or (f.get("wout") or 0) >= 3: sig.append("weather")
        if (f.get("t7") or 0) > (f.get("t30") or 0): sig.append("hot_form")
        if (f.get("split") or 0) > 0: sig.append("platoon_split")
        b = x.get("bvp") or {}
        if isinstance(b, dict) and (b.get("hr") or 0) > 0: sig.append("bvp")
        ask = m.get("ask") or m["implied"]
        out.append({"id": "mlb|hr|%s|%s|%s" % (hr["date"], x["pk"], x["id"]), "sport": "mlb", "market": "HR (1+)",
                    "title": "%s to hit a HR (%s vs %s)" % (x["name"], x["team"], x["opp"]), "start": None, "pk": x["pk"], "pid": x["id"],
                    "p_model": x["p_hr"], "price_dec": rnd(1 / ask, 3), "implied": rnd(ask), "price_src": "Kalshi (ask)",
                    "legs": 1, "signals": sig, "source": "MLB Lab HR Score %s" % x.get("score"), "ref": {"ticker": m.get("ticker"), "stat": "hr", "line": 0.5}})
    try: kp = get(MLB_RAW + "k_projections.json")
    except Exception: kp = {}
    for x in kp.get("pitchers", []) or ([kp["king"]] if kp.get("king") else []):
        m = x.get("market") or {}
        if m.get("implied_over") is None or x.get("p_over") is None: continue
        over = x["p_over"] > m["implied_over"]; pm = x["p_over"] if over else 1 - x["p_over"]
        imp = m["implied_over"] if over else 1 - m["implied_over"]
        if pm - imp <= 0.02: continue
        f = x.get("feats") or {}; fa = x.get("fatigue") or {}; sig = ["k_model", "market_underpriced"]
        if over and (f.get("opp_k") or 1) > 1.03 or (not over and (f.get("opp_k") or 1) < 0.97): sig.append("matchup")
        if fa.get("workload") is not None and ((fa["workload"] > 1.05 and not over) or (fa["workload"] <= 1.0 and over)): sig.append("fatigue")
        if (f.get("ump_k") or 1) != 1: sig.append("umpire")
        out.append({"id": "mlb|k|%s|%s|%s|%s" % (kp["date"], x["pk"], x["id"], "o" if over else "u"), "sport": "mlb", "market": "Strikeouts",
                    "title": "%s %s %s K" % (x["name"], "over" if over else "under", x["line"]), "start": None, "pk": x["pk"], "pid": x["id"],
                    "p_model": rnd(pm), "price_dec": rnd(1 / imp, 3), "implied": rnd(imp), "price_src": "Kalshi (mid, ladder)", "legs": 1,
                    "signals": sig, "source": "MLB Lab K projection", "ref": {"stat": "k", "line": x["line"], "side": "over" if over else "under"}})
    return out

_sched = {}
def mlb_game(pk):
    if pk not in _sched:
        try: _sched[pk] = get("https://statsapi.mlb.com/api/v1.1/game/%s/feed/live?fields=gameData,datetime,dateTime,status,abstractGameState,detailedState" % pk)["gameData"]
        except Exception: _sched[pk] = None
    return _sched[pk]

# ---------------- extra signal tags (injury cascade / role change / injury matchup) ----------------
def _norm(n): return "".join(c for c in (n or "").lower() if c.isalpha())
def tag_signals(log):
    """Tags written to data/edge_tags.json ONLY before start (log file stays append-only). Sources:
    analyst_nfl.json inj_cascades (ESPN injury report + nflverse with/without splits), props u (usage trend), props fl (impact flags)."""
    Tg = load("edge_tags.json", {}); recs = {r["id"]: r for r in load("recs_history.json", {"recs": []})["recs"]}
    an = load("analyst_nfl.json", {}); casc = {}
    for c in an.get("inj_cascades", []):
        for a in c.get("affected", []):
            if (a.get("d_td") or 0) > 0 or (a.get("d_tg") or 0) >= 0.5 or (a.get("d_ca") or 0) >= 2: casc[_norm(a["player"])] = a.get("how")
    props = {}; nhot = None
    for e in log:
        if not e["id"].startswith("bl|") or T(e["start"]) <= NOW: continue
        if e["sport"] == "nhl" and nhot is None:
            try: nhot = {_norm(h["name"]): h for h in get("https://raw.githubusercontent.com/mkuritz/nhl-lab/main/data/hot.json") if h.get("hotScore") is not None}
            except Exception: nhot = {}
        r = recs.get(e["ref"]["rec"]); 
        if not r: continue
        tags = set(Tg.get(e["id"], {}).get("signals", []))
        for l in r["legs"]:
            if _norm(l["player"]) in casc: tags.add("injury_cascade")
            if l["sport"] == "nhl" and nhot:  # NHL Lab shrunk recent-form multiplier + opportunity notes
                h = nhot.get(_norm(l["player"]))
                if h and (h.get("formMult") or {}).get("p", 1) >= 1.04 and h["hotScore"] >= 10: tags.add("hot_form")
                if h and h.get("oppNotes"): tags.add("role_change")
            if l["sport"] not in props: props[l["sport"]] = {(q["aid"], q["market"]): q for q in load("props_%s.json" % l["sport"], [])}
            q = props[l["sport"]].get((l["aid"], l["market"]))
            if not q: continue
            u = q.get("u") or {}
            for k in ("tg", "ca"):  # recent usage well above season = role change
                v = u.get(k) or {}
                if v.get("szn") and v.get("l3") is not None and v["l3"] >= 1.25 * v["szn"] and v["l3"] - v["szn"] >= 1: tags.add("role_change")
            if q.get("fl"): tags.add("injury_matchup")
        if tags - set(e["signals"]): Tg[e["id"]] = {"signals": sorted(tags - set(e["signals"])), "at": NOW.isoformat(timespec="minutes")}
    save("edge_tags.json", Tg); return Tg

# ---------------- Odds API closing prices (frugal; NFL props only) ----------------
OA_CAP = 40  # tracker's own monthly credit cap, on top of Arb Lab's published budget guard
OA_MK = {"Anytime TD": "player_anytime_td", "Receptions": "player_receptions", "Rushing Yards": "player_rush_yds", "Receiving Yards": "player_reception_yds", "Passing Yards": "player_pass_yds"}
def odds_api_close(log, C):
    st = load("edge_oddsapi.json", {}); mon = NOW.strftime("%Y-%m"); use = st.get("usage") if (st.get("usage") or {}).get("month") == mon else {"month": mon, "used": 0, "polls": []}
    def done(msg): st.update(status=msg, checked=NOW.isoformat(timespec="minutes"), usage=use); save("edge_oddsapi.json", st); return msg
    key = os.environ.get("ODDS_API_KEY")
    if not key: return done("no key")
    recs = {r["id"]: r for r in load("recs_history.json", {"recs": []})["recs"]}
    want = {}  # (home, away, kickoff) -> {market: [entries]}
    for e in log:
        if e["sport"] != "nfl" or e["id"] in C or e.get("legs") != 1 or e["market"] not in OA_MK: continue
        mins = (T(e["start"]) - NOW).total_seconds() / 60
        if not 0 < mins <= 45: continue  # one pull per game, inside 45 min of kickoff
        want.setdefault(e["start"][:16], {}).setdefault(OA_MK[e["market"]], []).append(e)
    done_games = {p["k"] for p in use["polls"]}; want = {k: v for k, v in want.items() if k not in done_games}
    if not want: return done("nothing due")
    try:
        b = get("https://mkuritz.github.io/arb-lab/data/odds_budget.json"); rem, used = b.get("remaining"), b.get("used") or 0
    except Exception: return done("arb budget unreadable, skipping")
    if rem is None: return done("arb budget has no remaining figure, skipping")
    nxt = (NOW.date().replace(day=28) + dt.timedelta(days=4)).replace(day=1); left = (nxt - NOW.date()).days
    try: ev = get("https://api.the-odds-api.com/v4/sports/americanfootball_nfl/events?apiKey=" + key)  # 0 credits
    except Exception as x: return done("events error %s" % x)
    for k, mk in want.items():
        cost = len(mk)
        if use["used"] + cost > OA_CAP: return done("tracker monthly cap reached")
        if rem - cost - used / max(NOW.day, 1) * left < 100: return done("budget guard (arb remaining %s)" % rem)
        evs = [x for x in ev if x["commence_time"][:16] == k]
        if not evs: continue
        try: o = get("https://api.the-odds-api.com/v4/sports/americanfootball_nfl/events/%s/odds?apiKey=%s&regions=us&bookmakers=draftkings&oddsFormat=decimal&markets=%s" % (evs[0]["id"], key, ",".join(mk)))
        except Exception as x: print("odds api", x); continue
        use["used"] += cost; rem -= cost; use["polls"].append({"k": k, "t": NOW.isoformat(timespec="minutes"), "cost": cost})
        px = {}
        for bk in o.get("bookmakers", []):
            for m in bk.get("markets", []):
                for c in m.get("outcomes", []):
                    if c.get("name") in ("Over", "Yes"): px[(m["key"], _norm(c.get("description")), c.get("point"))] = c["price"]
        recs_ = {r["id"]: r for r in recs.values()}
        for m, es in mk.items():
            for e in es:
                l = recs_[e["ref"]["rec"]]["legs"][0]
                d = px.get((m, _norm(l["player"]), None if m == "player_anytime_td" else l["line"]))
                if d: C[e["id"]] = {"implied": rnd(1 / d), "at": NOW.isoformat(timespec="minutes"), "src": "Odds API (DraftKings)"}
    return done("ok")

# ---------------- steps ----------------
def log_step(stats):
    have = {e["id"] for e in read_log()}; status = signal_status(stats); new = []
    for e in from_recs() + from_mlb():
        if e["id"] in have: continue
        if e["start"] is None and e.get("pk"):
            g = mlb_game(e["pk"]); e["start"] = g and g["datetime"]["dateTime"]
        if not e["start"] or T(e["start"]) <= NOW: continue  # never log after start
        e["logged_at"] = NOW.isoformat(timespec="seconds"); e.update(classify(e, status))
        new.append(e); have.add(e["id"])
    with open(p("edge_log.jsonl"), "a") as fh:
        for e in new: fh.write(json.dumps(e, sort_keys=True) + "\n")
    return len(new)

def close_step(log):
    C = load("edge_close.json", {}); recs = {r["id"]: r for r in load("recs_history.json", {"recs": []})["recs"]}
    props = {}
    for e in log:
        if T(e["start"]) <= NOW and e["id"] in C: continue
        if T(e["start"]) <= NOW: continue  # only pre-start snapshots count as closing
        imp = None
        if e["id"].startswith("bl|"):
            r = recs.get(e["ref"]["rec"])
            if r and len(r["legs"]) == 1:
                l = r["legs"][0]
                if e["sport"] not in props: props[e["sport"]] = load("props_%s.json" % e["sport"], [])
                for q in props[e["sport"]]:
                    if q["aid"] == l["aid"] and q["market"] == l["market"] and q.get("line") == l["line"]:
                        d = am_dec(q.get("ov")); imp = d and 1 / d; break
        elif e["ref"].get("ticker"):
            try:
                m = get(KALSHI + e["ref"]["ticker"])["market"]; a = m.get("yes_ask") or m.get("last_price")
                imp = a / 100 if a else None
            except Exception: pass
        if imp: C[e["id"]] = {"implied": rnd(imp), "at": NOW.isoformat(timespec="minutes"), "src": "Kalshi" if e["ref"].get("ticker") else "DraftKings via ESPN"}
    try: print("odds api:", odds_api_close(log, C))
    except Exception as x: print("odds api skipped:", x)
    save("edge_close.json", C)

def grade_step(log):
    G = load("edge_grades.json", {}); recs = {r["id"]: r for r in load("recs_history.json", {"recs": []})["recs"]}; box = {}
    for e in log:
        if e["id"] in G or T(e["start"]) > NOW - dt.timedelta(hours=4): continue
        res = None
        if e["id"].startswith("bl|"):
            r = recs.get(e["ref"]["rec"]); res = r and r.get("result")
        elif e.get("pk"):
            pk = e["pk"]
            if pk not in box:
                try: box[pk] = get("https://statsapi.mlb.com/api/v1/game/%s/boxscore" % pk)
                except Exception: box[pk] = None
            b = box[pk]; g = mlb_game(pk)
            if not b or not g: continue
            if g["status"]["abstractGameState"] != "Final":
                if "Postponed" in g["status"]["detailedState"] or "Cancel" in g["status"]["detailedState"]: res = "void"
                else: continue
            else:
                pl = None
                for side in ("home", "away"):
                    pl = b["teams"][side]["players"].get("ID%s" % e["pid"]) or pl
                if not pl: res = "void"
                elif e["ref"]["stat"] == "hr":
                    st = pl["stats"].get("batting") or {}
                    res = "void" if not st.get("plateAppearances") else ("win" if st.get("homeRuns", 0) >= 1 else "loss")
                else:
                    st = pl["stats"].get("pitching") or {}
                    if not st.get("battersFaced"): res = "void"
                    else:
                        k = st.get("strikeOuts", 0); ov = k > e["ref"]["line"]
                        res = "win" if ov == (e["ref"]["side"] == "over") else "loss"
        if res: G[e["id"]] = {"result": res, "at": NOW.isoformat(timespec="minutes")}
    save("edge_grades.json", G)

def agg(rows):
    n = len(rows); w = sum(r["y"] for r in rows)
    pr = [r for r in rows if r["dec"]]
    roi = sum((r["dec"] - 1) if r["y"] else -1 for r in pr) / len(pr) if pr else None
    cl = [r["clv"] for r in rows if r["clv"] is not None]
    bm = [r for r in rows if r["imp"] is not None and r["p"] is not None]
    return {"n": n, "wins": w, "losses": n - w, "hit": rnd(w / n) if n else None,
            "exp_hit": rnd(sum(r["p"] for r in rows if r["p"] is not None) / n) if n else None,
            "priced": len(pr), "units": rnd(sum((r["dec"] - 1) if r["y"] else -1 for r in pr), 2), "roi": rnd(roi),
            "clv_n": len(cl), "clv": rnd(sum(cl) / len(cl)) if cl else None, "clv_pos": rnd(sum(c > 0 for c in cl) / len(cl)) if cl else None,
            "brier_us": rnd(sum((r["p"] - r["y"]) ** 2 for r in bm) / len(bm)) if bm else None,
            "brier_mkt": rnd(sum((r["imp"] - r["y"]) ** 2 for r in bm) / len(bm)) if bm else None}

def stats_step(log):
    Tg = load("edge_tags.json", {})
    log = [dict(e, signals=e["signals"] + Tg.get(e["id"], {}).get("signals", [])) for e in log]
    G, C = load("edge_grades.json", {}), load("edge_close.json", {}); rows = []
    for e in log:
        g = G.get(e["id"])
        if not g or g["result"] not in ("win", "loss"): continue
        c = C.get(e["id"], {}).get("implied")
        # CLV in probability points: closing implied minus our entry implied (positive = market moved our way)
        rows.append({"e": e, "y": 1 if g["result"] == "win" else 0, "p": e.get("p_model"), "imp": e.get("implied"), "dec": e.get("price_dec"),
                     "clv": rnd(c - e["implied"]) if (c and e.get("implied")) else None})
    by = lambda key: {k: agg([r for r in rows if key(r) == k]) for k in sorted({key(r) for r in rows})}
    sig = {}
    for s in sorted({s for e in log for s in e["signals"]}):
        a = agg([r for r in rows if s in r["e"]["signals"]]); a["logged"] = sum(s in e["signals"] for e in log)
        good = a["roi"] is not None and a["roi"] > 0 and (a["clv"] is None or a["clv"] >= 0)
        bad = a["roi"] is not None and (a["roi"] < 0 or (a["clv"] is not None and a["clv"] < 0))
        a["status"] = "unproven" if a["n"] < MIN_N else "proven" if good else "losing" if bad else "unproven"
        # weight used by Bet Lab to rank recs: shrunk toward 1.0 until the sample is big
        sh = min(a["n"] / 100, 1); a["weight"] = round(1 + sh * max(-0.5, min(0.5, a["roi"] or 0)), 3)
        sig[s] = a
    cal = []
    for lo in [i / 10 for i in range(10)]:
        b = [r for r in rows if r["p"] is not None and lo <= r["p"] < lo + 0.1]
        if b: cal.append({"lo": lo, "n": len(b), "pred": rnd(sum(r["p"] for r in b) / len(b)), "hit": rnd(sum(r["y"] for r in b) / len(b)),
                          "mkt": rnd(sum(r["imp"] for r in b if r["imp"] is not None) / max(1, sum(r["imp"] is not None for r in b))) if any(r["imp"] is not None for r in b) else None})
    out = {"updated": NOW.isoformat(timespec="minutes"), "logged": len(log), "graded": len(rows),
           "pending": sum(1 for e in log if e["id"] not in G), "void": sum(1 for g in G.values() if g["result"] in ("void", "push")),
           "overall": agg(rows), "by_sport": by(lambda r: r["e"]["sport"]), "by_market": by(lambda r: r["e"]["market"]),
           "by_tag": by(lambda r: r["e"].get("tag") or "standard"), "signals": sig, "calibration": cal, "min_n": MIN_N,
           "closing_available": len(C), "odds_api": load("edge_oddsapi.json", {}).get("status")}
    save("edge_stats.json", out); return out

if __name__ == "__main__":
    stats = load("edge_stats.json", {})
    n = log_step(stats); log = read_log()
    tag_signals(log); close_step(log); grade_step(log); s = stats_step(log)
    print("logged +%d (total %d), graded %d, pending %d" % (n, s["logged"], s["graded"], s["pending"]))
