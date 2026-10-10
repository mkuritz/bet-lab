import json, os, glob, datetime as dt
D = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
def load_events():
    out = []
    for f in glob.glob(os.path.join(D, "games_*.json")):
        sport = os.path.basename(f)[6:-5]
        try: games = json.load(open(f))
        except Exception: continue
        for g in games:
            t = g.get("time")
            if not t: continue
            st = dt.datetime.fromisoformat(t.replace("Z", "+00:00"))
            tgt = f"soccer:{g['lg']}" if sport == "soccer" and g.get("lg") else sport
            out.append((f"{sport}:{g['id']}", st, tgt))
    return out
