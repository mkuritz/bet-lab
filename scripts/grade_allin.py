"""Grade All In Cousins show picks against ESPN public final scores.
Pick schema: {id, date, week, sport: nfl|mlb|nba|ncaaf, kind: straight|parlay, type: spread|ml|total|1h_spread|1h_ml|1h_total|parlay,
 team, side(over|under), line, odds(American, optional; -110 assumed only when odds_assumed true), book(optional),
 bought(optional note), espn_event_id, legs[] (for parlays, same leg schema), source_url, timestamp, desc}"""
import json, urllib.request
P = "data/allin_picks.json"
LG = {"nfl": "football/nfl", "mlb": "baseball/mlb", "nba": "basketball/nba", "ncaaf": "football/college-football"}
_cache = {}
def final(sport, eid):
    k = (sport, eid)
    if k in _cache: return _cache[k]
    u = f"https://site.api.espn.com/apis/site/v2/sports/{LG[sport]}/summary?event={eid}"
    j = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "SportsLabs/1.0"}), timeout=20))
    c = j["header"]["competitions"][0]
    if not c["status"]["type"].get("completed"): _cache[k] = None; return None
    sc = {}
    for t in c["competitors"]:
        ls = [float(x.get("displayValue", x.get("value", 0)) or 0) for x in t.get("linescores", [])]
        sc[t["team"]["abbreviation"]] = {"f": float(t["score"]), "h1": sum(ls[:2]) if len(ls) >= 2 else None}
    _cache[k] = sc; return sc
def grade_leg(p):
    sc = final(p["sport"], p["espn_event_id"])
    if not sc: return None, None
    half = p["type"].startswith("1h_"); key = "h1" if half else "f"; t = p["type"].replace("1h_", "")
    s = {k: v[key] for k, v in sc.items()}
    if any(v is None for v in s.values()): return None, None
    if t == "total":
        tot = sum(s.values()); d = tot - p["line"] if p["side"] == "over" else p["line"] - tot
    else:
        me = s.get(p["team"]); op = [v for k, v in s.items() if k != p["team"]]
        if me is None or not op: return None, None
        d = me - op[0] + (p.get("line", 0) if t == "spread" else 0)
    return ("win" if d > 0 else "loss" if d < 0 else "push"), {k: v["f"] for k, v in sc.items()}
def grade(p):
    if p["type"] != "parlay": return grade_leg(p)
    rs = []
    for l in p["legs"]:
        if not l.get("result") and l.get("espn_event_id"):
            r, f = grade_leg(l)
            if r: l["result"] = r; l["final"] = f
        rs.append(l.get("result"))
    if "loss" in rs: return "loss", None
    if None in rs or "unknown" in rs: return None, None
    return ("push" if all(r == "push" for r in rs) else "win"), None
def units(p):
    o = p.get("odds")
    if o is None: return None
    return (o / 100 if o > 0 else 100 / -o) if p["result"] == "win" else -1 if p["result"] == "loss" else 0
def rec(ps):
    w = sum(p["result"] == "win" for p in ps); l = sum(p["result"] == "loss" for p in ps); pu = sum(p["result"] == "push" for p in ps)
    us = [units(p) for p in ps]; known = [u for u in us if u is not None]
    return {"w": w, "l": l, "p": pu, "units": round(sum(known), 2), "units_n": len(known)}
def main():
    d = json.load(open(P))
    for p in d["picks"]:
        if p.get("result"): continue
        try:
            r, f = grade(p)
            if r: p["result"] = r
            if f: p["final"] = f
        except Exception as e: print("skip", p.get("id"), e)
    L = []
    for p in d["picks"]:
        if p.get("type") == "parlay":
            lr = [l.get("result") for l in p["legs"]]
            p["legs_total"] = len(lr); p["legs_graded"] = sum(r in ("win", "loss", "push") for r in lr)
            p["legs_hit"] = sum(r == "win" for r in lr); p["legs_push"] = sum(r == "push" for r in lr)
            p["sunk_by"] = [l["desc"] for l in p["legs"] if l.get("result") == "loss"]
            L += [l for l in p["legs"] if l.get("result") in ("win", "loss", "push")]
    g = [p for p in d["picks"] if p.get("result")]
    R = {}
    for kind in ("straight", "parlay"):
        gk = [p for p in g if p.get("kind", "straight") == kind]
        R[kind] = {"overall": rec([p for p in gk if p["sport"] in ("nfl", "mlb", "nba", "ncaaf")]), "nfl": rec([p for p in gk if p["sport"] == "nfl"]),
                   "mlb": rec([p for p in gk if p["sport"] == "mlb"]), "nba": rec([p for p in gk if p["sport"] == "nba"]), "ncaaf": rec([p for p in gk if p["sport"] == "ncaaf"])}
    R["overall"] = R["straight"]["overall"]; R["nfl"] = R["straight"]["nfl"]; R["mlb"] = R["straight"]["mlb"]; R["nba"] = R["straight"]["nba"]
    R["parlay_legs"] = rec(L) | {"units": None, "units_n": 0}
    R["pending"] = len(d["picks"]) - len(g)
    R["units_note"] = "1 unit per pick. Units count only picks with a stated price, or spreads/totals marked -110 (assumed standard price). Parlays without a stated price are W/L only."
    d["record"] = R
    json.dump(d, open(P, "w"), indent=1)
if __name__ == "__main__": main()
