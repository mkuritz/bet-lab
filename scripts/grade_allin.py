"""Grade manually entered All In Cousins picks against ESPN public final scores.
Pick schema: {id, date(YYYY-MM-DD), sport: nfl|mlb, type: spread|ml|total, team(abbr, for spread/ml),
 side(over|under, for total), line(float, spread/total), odds(American, optional), espn_event_id, source_url, desc}"""
import json, urllib.request
P = "data/allin_picks.json"
LG = {"nfl": "football/nfl", "mlb": "baseball/mlb"}
def final(sport, eid):
    u = f"https://site.api.espn.com/apis/site/v2/sports/{LG[sport]}/summary?event={eid}"
    j = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "SportsLabs/1.0"}), timeout=20))
    c = j["header"]["competitions"][0]
    if not c["status"]["type"].get("completed"): return None
    return {t["team"]["abbreviation"]: float(t["score"]) for t in c["competitors"]}
def grade(p, sc):
    if p["type"] == "total":
        tot = sum(sc.values()); d = tot - p["line"] if p["side"] == "over" else p["line"] - tot
    else:
        me = sc.get(p["team"]); op = [v for k, v in sc.items() if k != p["team"]]
        if me is None or not op: return None
        d = me - op[0] + (p.get("line", 0) if p["type"] == "spread" else 0)
    return "win" if d > 0 else "loss" if d < 0 else "push"
def units(p):
    o = p.get("odds", -110)
    return (o / 100 if o > 0 else 100 / -o) if p["result"] == "win" else -1 if p["result"] == "loss" else 0
def rec(ps):
    w = sum(p["result"] == "win" for p in ps); l = sum(p["result"] == "loss" for p in ps); pu = sum(p["result"] == "push" for p in ps)
    return {"w": w, "l": l, "p": pu, "units": round(sum(units(p) for p in ps), 2)}
def main():
    d = json.load(open(P))
    for p in d["picks"]:
        if p.get("result") or not p.get("espn_event_id"): continue
        try:
            sc = final(p["sport"], p["espn_event_id"])
            if sc: p["result"] = grade(p, sc); p["final"] = sc
        except Exception as e: print("skip", p.get("id"), e)
    g = [p for p in d["picks"] if p.get("result")]
    d["record"] = {"overall": rec(g), "nfl": rec([p for p in g if p["sport"] == "nfl"]), "mlb": rec([p for p in g if p["sport"] == "mlb"]),
                   "pending": len(d["picks"]) - len(g), "units_note": "1 unit per pick; -110 assumed when no price was stated"}
    json.dump(d, open(P, "w"), indent=1)
if __name__ == "__main__": main()
