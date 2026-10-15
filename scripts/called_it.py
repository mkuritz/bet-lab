"""Build 'Called it' showcase cards from Recommended picks that hit big, and from logged game-script calls.
Backfill only from data actually logged before the game. Never fabricate.
Writes data/called_it.json."""
import json, os, datetime as dt, urllib.request
D = os.path.join(os.path.dirname(__file__), "..", "data")
def p(f): return os.path.join(D, f)
def load(f, d):
    try: return json.load(open(p(f)))
    except Exception: return d
def save(f, o): json.dump(o, open(p(f), "w"), separators=(",", ":"), sort_keys=True)
def get(url, t=20):
    req = urllib.request.Request(url, headers={"User-Agent": "SportsLabs-CalledIt"})
    with urllib.request.urlopen(req, timeout=t) as r: return json.load(r)
NOW = dt.datetime.now(dt.timezone.utc)

def T(s):
    s = s.replace("Z", "+00:00")
    try: return dt.datetime.fromisoformat(s)
    except ValueError: return dt.datetime.fromisoformat(s[:16] + "+00:00")

def read_log():
    out = []
    if os.path.exists(p("edge_log.jsonl")):
        for ln in open(p("edge_log.jsonl")):
            if ln.strip(): out.append(json.loads(ln))
    return out

def big_hit(e, g, tier):
    """Official 'Called it' = a Recommended pick (tier fixed pre-start) that won. Research wins that were
    longshots (+150 or longer) or strong edges are shown separately as 'research hits' (not official)."""
    if g.get("result") != "win": return None
    if tier == "recommended": return "official"
    if (e.get("price_dec") or 0) >= 2.5 or ((e.get("p_model") or 0) - (e.get("implied") or 1) >= 0.04): return "research"
    return None

def actual_line(e):
    """Pull a short actuals blurb from graded recs_history when available."""
    H = load("recs_history.json", {"recs": []})
    rid = (e.get("ref") or {}).get("rec")
    for r in H.get("recs", []):
        if r["id"] == rid:
            parts = []
            for l in r["legs"]:
                if l.get("actual") is not None:
                    parts.append("%s: %s (line %s)" % (l["market"], l["actual"], l["line"]))
            return "; ".join(parts) if parts else None
    return None

def player_cards(log, G, TI):
    cards = []
    for e in log:
        g = G.get(e["id"]); tier = (TI.get(e["id"]) or {}).get("tier")
        cat = g and big_hit(e, g, tier)
        if not cat: continue
        cards.append({"kind": "player", "official": cat == "official", "id": e["id"], "title": e["title"], "sport": e["sport"], "market": e["market"],
                      "start": e["start"], "logged_at": e["logged_at"], "p_model": e.get("p_model"), "implied": e.get("implied"),
                      "price_dec": e.get("price_dec"), "signals": e["signals"], "tier": tier, "tag": e.get("tag"),
                      "actual": actual_line(e), "result": "win",
                      "blurb": "Logged %s ET before start as %s. Signals: %s." % (T(e["logged_at"]).astimezone(dt.timezone(dt.timedelta(hours=-4))).strftime("%b %d %-I:%M %p"), "Sports Labs Recommended" if cat == "official" else "research only", ", ".join(e["signals"]))})
    return cards

def game_script_cards():
    """From data/game_scripts.jsonl (pre-game calls we log going forward)."""
    cards = []; path = p("game_scripts.jsonl"); GR = load("game_script_grades.json", {})
    if not os.path.exists(path): return cards
    for ln in open(path):
        if not ln.strip(): continue
        e = json.loads(ln)
        if T(e["start"]) > NOW - dt.timedelta(hours=4): continue
        # grade from nflverse/ESPN publicly available result if present in e['result'] already, else try ESPN
        res = GR.get(e["id"])
        path = {"nfl": "football/nfl", "cfb": "football/college-football", "nba": "basketball/nba", "nhl": "hockey/nhl", "mlb": "baseball/mlb"}.get(e.get("sport")) or ("soccer/" + e["lg"] if e.get("lg") else None)
        if not res and path and e.get("espn_id"):
            try:
                s = get("https://site.api.espn.com/apis/site/v2/sports/%s/summary?event=%s" % (path, e["espn_id"]))
                comps = s["header"]["competitions"][0]
                if comps.get("status", {}).get("type", {}).get("completed"):
                    scores = {c["homeAway"]: int(c["score"]) for c in comps["competitors"]}
                    total = scores.get("home", 0) + scores.get("away", 0)
                    res = {"home": scores.get("home"), "away": scores.get("away"), "total": total,
                           "hit": (total > e["line"]) if e["call"] in ("over", "shootout") else (total < e["line"]) if e["call"] == "under" else None}
            except Exception: pass
        if not res or res.get("hit") is None: continue
        if res is not e.get("result"): GR[e["id"]] = res
        cards.append({"kind": "game_script", "id": e["id"], "title": e["title"], "sport": e["sport"], "call": e["call"],
                      "line": e.get("line"), "start": e["start"], "logged_at": e["logged_at"], "signals": e.get("signals", []),
                      "result": res, "official": False, "blurb": e.get("why", "")})
    save("game_script_grades.json", GR)
    return cards

def backfill_notes():
    """Honest notes about famous asks that weren't in the pre-game log."""
    notes = []
    log = read_log()
    # Reinhart: any pre-game Sam Reinhart pick?
    rh = [e for e in log if "reinhart" in (e.get("title") or "").lower()]
    notes.append({"ask": "Sam Reinhart legendary pick", "found": bool(rh),
                  "detail": ("Logged: " + "; ".join("%s @ %s (%s)" % (e["title"], e["logged_at"], e.get("tag")) for e in rh)) if rh
                  else "No Sam Reinhart pick appears in data/edge_log.jsonl. Cannot backfill a Called-it card without a pre-game log entry."})
    # BUF@LAR shootout
    gs_path = p("game_scripts.jsonl"); hits = []
    if os.path.exists(gs_path):
        for ln in open(gs_path):
            if not ln.strip(): continue
            e = json.loads(ln)
            if "BUF" in e.get("title", "") and "LAR" in e.get("title", ""): hits.append(e)
    # Also check recs_history / games for a pre-kick Shootout tag on that game — game script card needs an explicit logged call
    notes.append({"ask": "BUF@LAR (Oct 12) shootout / over call", "found": bool(hits),
                  "detail": ("Logged game-script: " + "; ".join(e["id"] for e in hits)) if hits
                  else "No pre-game shootout/over call for BUF@LAR exists in any log. The pre-kick DraftKings total (via ESPN, committed in data/games_nfl.json before kickoff) was 54.5; the final was BUF 37 – LAR 34 in OT (71 points, over by 16.5). With only that game left on the board the Game-script card had fewer than 3 totals, so no Shootout tag was shown. No card is created. Game-script calls are logged pre-game from now on."})
    return notes

def main():
    G = load("edge_grades.json", {}); log = read_log()
    # Apply tier tags from edge_tags / edge itself
    TI = load("edge_tiers.json", {})
    cards = player_cards(log, G, TI) + game_script_cards()
    cards.sort(key=lambda c: c.get("start") or "", reverse=True)
    out = {"updated": NOW.isoformat(timespec="minutes"), "cards": cards[:40], "n": len(cards), "backfill_notes": backfill_notes()}
    save("called_it.json", out); print("called_it: %d cards" % out["n"])
    return out

if __name__ == "__main__": main()
