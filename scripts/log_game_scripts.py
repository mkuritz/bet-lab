"""Log pre-game game-script calls (Shootout/Over, Grinder/Under) into data/game_scripts.jsonl (append-only, before start).
Sources: DraftKings totals via ESPN already in games_*.json. Only tags the top/bottom third of the slate."""
import json, os, datetime as dt
D = os.path.join(os.path.dirname(__file__), "..", "data")
NOW = dt.datetime.now(dt.timezone.utc)
def p(f): return os.path.join(D, f)
def load(f, d):
    try: return json.load(open(p(f)))
    except Exception: return d
def T(s):
    s = s.replace("Z", "+00:00")
    try: return dt.datetime.fromisoformat(s)
    except ValueError: return dt.datetime.fromisoformat(s[:16] + "+00:00")

def tag(g, allg):
    t = sorted(x["total"] for x in allg if x.get("total") is not None)
    if g.get("total") is None or len(t) < 3: return None
    q = len(t)
    if g["total"] >= t[q * 2 // 3]: return "shootout"
    if g["total"] <= t[(q - 1) // 3]: return "grinder"
    return None

def run():
    have = set()
    if os.path.exists(p("game_scripts.jsonl")):
        for ln in open(p("game_scripts.jsonl")):
            if ln.strip(): have.add(json.loads(ln)["id"])
    new = []
    for sport in ("nfl", "nhl", "cfb", "nba", "mlb", "soccer"):
        G = load("games_%s.json" % sport, [])
        up = [g for g in G if g.get("total") is not None and T(g["time"]) > NOW]
        for g in up:
            call = tag(g, up)
            if not call: continue
            eid = "%s|%s|%s" % (sport, g["id"], call)
            if eid in have: continue
            new.append({"id": eid, "sport": sport, "espn_id": g["id"], "lg": g.get("lg"), "title": "%s @ %s · %s (O/U %s)" % (g["away"], g["home"], call, g["total"]),
                        "call": "over" if call == "shootout" else "under", "line": g["total"], "start": g["time"],
                        "logged_at": NOW.isoformat(timespec="seconds"),
                        "signals": ["game_script", call],
                        "why": "DraftKings total %s is in the %s third of tonight's %s slate (via ESPN public feed)." % (g["total"], "top" if call == "shootout" else "bottom", sport.upper())})
            have.add(eid)
    with open(p("game_scripts.jsonl"), "a") as fh:
        for e in new: fh.write(json.dumps(e, sort_keys=True) + "\n")
    print("game_scripts +%d" % len(new)); return len(new)

if __name__ == "__main__": run()
