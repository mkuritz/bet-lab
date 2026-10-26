"""Grade All In Cousins and Erik Kuselias third-party picks against ESPN public final scores & boxscores.
Pick schema: {id, date, week, sport: nfl|mlb|nba|ncaaf, category: games|props|leans, kind: straight|parlay,
 type: spread|ml|total|team_total|1h_spread|1h_ml|1h_total|1q_ml|prop|parlay,
 team, player(optional), stat_cat(optional), stat_key(optional), side(over|under), line,
 odds(American, optional; -110 assumed only when odds_assumed true), book(optional),
 bought(optional note), espn_event_id, legs[] (for parlays, same leg schema), source_url, timestamp, desc}"""
import json, os, urllib.request
FILES = ["data/allin_picks.json", "data/kuselias_picks.json"]
LG = {"nfl": "football/nfl", "mlb": "baseball/mlb", "nba": "basketball/nba", "ncaaf": "football/college-football"}
_cache = {}
def summary(sport, eid):
    k = (sport, eid)
    if k in _cache: return _cache[k]
    u = f"https://site.api.espn.com/apis/site/v2/sports/{LG[sport]}/summary?event={eid}"
    j = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "SportsLabs/1.0"}), timeout=20))
    c = j["header"]["competitions"][0]
    if not c["status"]["type"].get("completed"): _cache[k] = None; return None
    sc = {}
    for t in c["competitors"]:
        ls = [float(x.get("displayValue", x.get("value", 0)) or 0) for x in t.get("linescores", [])]
        sc[t["team"]["abbreviation"]] = {
            "f": float(t["score"]),
            "q1": ls[0] if len(ls) >= 1 else None,
            "h1": sum(ls[:2]) if len(ls) >= 2 else None,
        }
    pstats = {}
    for tm in (j.get("boxscore") or {}).get("players") or []:
        for cat in tm.get("statistics") or []:
            cname = cat.get("name") or ""
            lbls = cat.get("labels") or []
            for ath in cat.get("athletes") or []:
                nm = (ath.get("athlete") or {}).get("displayName") or ""
                if not nm: continue
                pstats.setdefault(nm.lower(), {})[cname] = dict(zip(lbls, ath.get("stats") or []))
    _cache[k] = {"sc": sc, "pstats": pstats}
    return _cache[k]

def extract_stat(pstats, player, stat_cat, stat_key):
    pl = pstats.get((player or "").lower()) or {}
    if not pl:
        for k, v in pstats.items():
            if (player or "").lower() in k:
                pl = v; break
    if not pl: return None
    if stat_cat == "td":
        tot_td = 0.0
        for c in ("rushing", "receiving"):
            v = (pl.get(c) or {}).get("TD")
            if v is not None: tot_td += float(v)
        return tot_td
    cat = pl.get(stat_cat) or {}
    if stat_key in ("COMP", "ATT") and "C/ATT" in cat:
        parts = str(cat["C/ATT"]).split("/")
        return float(parts[0] if stat_key == "COMP" else parts[1])
    if stat_key == "FG" and "FG" in cat:
        return float(str(cat["FG"]).split("/")[0])
    v = cat.get(stat_key)
    return float(v) if v is not None else None

def grade_leg(p):
    sm = summary(p["sport"], p["espn_event_id"])
    if not sm: return None, None
    sc, pstats = sm["sc"], sm["pstats"]
    f_scores = {k: v["f"] for k, v in sc.items()}
    tp = p["type"]
    if tp == "prop":
        val = extract_stat(pstats, p.get("player"), p.get("stat_cat"), p.get("stat_key"))
        if val is None: return None, None
        p["actual"] = val
        d = val - p["line"] if p.get("side", "over") == "over" else p["line"] - val
        return ("win" if d > 0 else "loss" if d < 0 else "push"), f_scores
    if tp == "team_total":
        me = (sc.get(p["team"]) or {}).get("f")
        if me is None: return None, None
        d = me - p["line"] if p.get("side", "over") == "over" else p["line"] - me
        return ("win" if d > 0 else "loss" if d < 0 else "push"), f_scores
    key = "q1" if tp.startswith("1q_") else "h1" if tp.startswith("1h_") else "f"
    t = tp.replace("1q_", "").replace("1h_", "")
    s = {k: v[key] for k, v in sc.items()}
    if any(v is None for v in s.values()): return None, None
    if t == "total":
        tot = sum(s.values()); d = tot - p["line"] if p["side"] == "over" else p["line"] - tot
    else:
        me = s.get(p["team"]); op = [v for k, v in s.items() if k != p["team"]]
        if me is None or not op: return None, None
        d = me - op[0] + (p.get("line", 0) if t == "spread" else 0)
    return ("win" if d > 0 else "loss" if d < 0 else "push"), f_scores

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

def grade_file(path):
    if not os.path.exists(path): return
    d = json.load(open(path))
    for p in d["picks"]:
        if p.get("result") and (p.get("type") != "prop" or p.get("actual") is not None): continue
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
    R["overall"] = R["straight"]["overall"]; R["nfl"] = R["straight"]["nfl"]; R["mlb"] = R["straight"]["mlb"]; R["nba"] = R["straight"]["nba"]; R["ncaaf"] = R["straight"]["ncaaf"]
    if any(p.get("category") for p in d["picks"]):
        R["full_season"] = rec(g)
        R["categories"] = {
            "games": rec([p for p in g if p.get("category") == "games"]),
            "props": rec([p for p in g if p.get("category") == "props"]),
            "leans": rec([p for p in g if p.get("category") == "leans"]),
        }
    R["parlay_legs"] = rec(L) | {"units": None, "units_n": 0}
    R["pending"] = len(d["picks"]) - len(g)
    R["units_note"] = "1 unit per pick. Units count only picks with a stated price, or spreads/totals/props marked with standard price. Parlays without a stated price are W/L only."
    d["record"] = R
    json.dump(d, open(path, "w"), indent=1)
    print(path, "graded:", len(g), "overall straight:", R["straight"]["overall"], "categories:", R.get("categories"))

def main():
    for f in FILES: grade_file(f)

if __name__ == "__main__": main()
