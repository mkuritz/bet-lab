"""Results tracker backend. Real outcomes only; the recs log starts the day this shipped (no backfill).
pending:   every prop's (sport, aid, game) seen on a refresh -> resolved after the game from game logs (ESPN / NHL / soccer box).
outcomes:  data/outcomes.json {sport|aid|game: {"s": stats} | {"void": true}}, kept 14 days (client grades user bets from it).
recs:      data/recs_history.json: our top picks logged once per slate before kickoff with est. probability + odds, graded here."""
import datetime as dt
import fetch_props as F

KEEP_DAYS = 14

def _now(): return dt.datetime.now(dt.timezone.utc)
def _t(iso): return dt.datetime.fromisoformat(iso.replace("Z", "+00:00"))
def et_day(iso):
    from zoneinfo import ZoneInfo
    return _t(iso).astimezone(ZoneInfo("America/New_York")).date().isoformat()

def record(sport, props):
    pend = F.load("pending_outcomes.json", {})
    for p in props:
        if not p.get("stat"): continue
        k = "%s|%s|%s" % (sport, p["aid"], p["game"])
        if k not in pend: pend[k] = {"time": p["time"], "oa": p.get("oa"), "d": et_day(p["time"])}
    F.save("pending_outcomes.json", pend)

def resolve(sport, logs, fetch=None, cap=300):
    """logs: {aid: [game entries with d (date), o (opp), s (stats)]}; fetch(aid) -> entries for players not in logs."""
    pend, out = F.load("pending_outcomes.json", {}), F.load("outcomes.json", {})
    now, n = _now(), 0
    for k, v in list(pend.items()):
        sp, aid, game = k.split("|")
        if sp != sport or now < _t(v["time"]) + dt.timedelta(hours=4): continue
        gl = logs.get(aid)
        if gl is None and fetch and n < cap:
            n += 1
            try: gl = fetch(aid)
            except Exception: gl = None
        hit = None
        for g in gl or []:
            same_day = g.get("d") and abs((dt.date.fromisoformat(g["d"][:10]) - dt.date.fromisoformat(v["d"])).days) <= 1
            if g.get("e") == game or (same_day and (not v.get("oa") or g.get("o") == v["oa"])):
                hit = g; break
        if hit: out[k] = {"s": hit["s"], "d": v["d"]}; del pend[k]
        elif now > _t(v["time"]) + dt.timedelta(hours=72):
            out[k] = {"void": True, "d": v["d"]}; del pend[k]  # no game-log entry 3 days later: DNP/inactive -> void
    cut = (now - dt.timedelta(days=KEEP_DAYS)).date().isoformat()
    out = {k: v for k, v in out.items() if v.get("d", "9") >= cut}
    F.save("pending_outcomes.json", pend); F.save("outcomes.json", out)
    grade_recs(out)

def val(s, stat):
    keys = [k.lstrip("-") for k in stat]
    if not any(k in s for k in keys): return None
    return sum((-1 if k.startswith("-") else 1) * (s.get(k.lstrip("-")) or 0) for k in stat)

def grade_leg(leg, out):
    o = out.get("%s|%s|%s" % (leg["sport"], leg["aid"], leg["game"]))
    if not o: return None
    if o.get("void"): return "void"
    v = val(o["s"], leg["stat"])
    if v is None: return "void"
    leg["actual"] = v
    return "win" if v > leg["line"] else "push" if v == leg["line"] else "loss"

def grade_recs(out):
    H = F.load("recs_history.json", {"started": _now().isoformat(timespec="seconds"), "recs": []})
    for r in H["recs"]:
        if r.get("result"): continue
        for l in r["legs"]:
            if not l.get("result"): l["result"] = grade_leg(l, out)
        rs = [l.get("result") for l in r["legs"]]
        if None in rs: continue
        live = [x for x in rs if x != "void"]
        r["result"] = "void" if not live else "loss" if "loss" in live else "push" if all(x == "push" for x in live) else "win"
        r["graded_at"] = _now().isoformat(timespec="minutes")
    F.save("recs_history.json", H)

def am_dec(a):
    return None if a is None else (1 + a / 100 if a > 0 else 1 + 100 / -a)

def log_recs(sport, items):
    """items: [{src, title, legs:[prop dicts], est, odds?}] logged once (first sighting, pre-kickoff)."""
    H = F.load("recs_history.json", {"started": _now().isoformat(timespec="seconds"), "recs": []})
    have = {r["id"] for r in H["recs"]}
    now = _now()
    for it in items:
        legs = it["legs"]
        if not legs or any(_t(p["time"]) <= now for p in legs): continue
        rid = "%s|%s|%s" % (sport, it["src"], ",".join(sorted("%s~%s~%s" % (p["aid"], p["market"], p["line"]) for p in legs)))
        if rid in have: continue
        dec = 1.0; priced = True
        for p in legs:
            d = am_dec(p.get("ov"))
            if d is None: priced = False
            else: dec *= d
        H["recs"].append({"id": rid, "sport": sport, "src": it["src"], "title": it.get("title"), "at": now.isoformat(timespec="minutes"),
                          "est": round(it["est"], 4) if it.get("est") is not None else None,
                          "odds_dec": round(dec, 3) if priced else None, "kalshi": it.get("kalshi"), "time": min(p["time"] for p in legs),
                          "legs": [{"sport": sport, "aid": p["aid"], "player": p["player"], "market": p["market"], "line": p["line"], "stat": p["stat"],
                                    "game": p["game"], "time": p["time"], "team": p.get("team"), "opp": p.get("opp"), "ov": p.get("ov"),
                                    "lh0": p["line"]} for p in legs]})
        have.add(rid)
    F.save("recs_history.json", H)

def hot_picks(sport, props, n=10):
    out = []
    for p in props:
        x = (p.get("x") or {}).get("l10")
        if not x or x[1] < 8 or not p.get("stat") or p.get("grp") == "def": continue
        if sport == "nfl" and p["pos"] not in ("QB", "RB", "WR", "TE", "FB"): continue
        if x[0] / x[1] >= 0.8: out.append((x[0] / x[1], x[1], p))
    out.sort(key=lambda t: (-t[0], -t[1]))
    seen, items = set(), []
    for r, nn, p in out:
        if p["aid"] in seen: continue
        seen.add(p["aid"])
        h = p["x"]["l10"]
        items.append({"src": "hot", "title": "%s %s over %s" % (p["player"], p["market"], p["line"]), "legs": [p], "est": (h[0] + 1) / (h[1] + 2)})
        if len(items) >= n: break
    return items

def closing(H_props, sport):
    """attach closing line (last line-history value before kickoff) to logged legs"""
    H = F.load("recs_history.json", None)
    if not H: return
    by = {(p["aid"], p["market"], p["game"]): p for p in H_props}
    now = _now()
    for r in H["recs"]:
        for l in r["legs"]:
            if l["sport"] != sport or _t(l["time"]) <= now: continue
            p = by.get((l["aid"], l["market"], l["game"]))
            if p: l["close"] = p["line"]  # last pre-kickoff refresh wins = closing line
    F.save("recs_history.json", H)
