"""NHL support: map ESPN athletes to NHL ids (rosters), game logs from api-web.nhle.com,
current-season boxscores (blocked shots, DvP). Free public NHL endpoints."""
import re, datetime as dt
import fetch_props as F

API = "https://api-web.nhle.com/v1"
E2N = {"NJ": "NJD", "SJ": "SJS", "TB": "TBL", "LA": "LAK"}
N2E = {v: k for k, v in E2N.items()}
ROSTER = {}

def norm(n):
    n = re.sub(r"[^a-z ]", "", n.lower().replace("-", " ").replace(".", ""))
    return " ".join(w for w in n.split() if w not in {"jr", "sr", "ii", "iii"})

def season_ids():
    t = dt.date.today()
    y = t.year if t.month >= 9 else t.year - 1
    return "%d%d" % (y, y + 1), "%d%d" % (y - 1, y)

def prepare(teams):
    for t in teams:
        if t in ROSTER: continue
        d = F.get("%s/roster/%s/current" % (API, E2N.get(t, t))) or {}
        ROSTER[t] = {}
        for grp in ("forwards", "defensemen", "goalies"):
            for p in d.get(grp, []):
                full = norm(p["firstName"]["default"] + " " + p["lastName"]["default"])
                ROSTER[t][full] = (p["id"], p.get("positionCode"))
                ROSTER[t].setdefault(norm(p["lastName"]["default"]), (p["id"], p.get("positionCode")))

def nhl_id(name, team):
    r = ROSTER.get(team, {})
    n = norm(name)
    return (r.get(n) or r.get(n.split()[-1] if n else "") or (None, None))[0]

def mmss(t):
    try:
        m, s = t.split(":"); return round(int(m) + int(s) / 60, 2)
    except Exception: return None

def gamelog(espn_aid, name, team):
    pid = nhl_id(name, team)
    if not pid: return []
    box = F.load("nhl_box.json", {}).get("players", {})
    games = []
    for sid, gts in zip(season_ids(), ((2,), (2, 3))):
        for gt in gts:
            d = F.get("%s/player/%s/game-log/%s/%d" % (API, pid, sid, gt)) or {}
            for g in d.get("gameLog", []):
                s = {"goals": g.get("goals", 0), "assists": g.get("assists", 0), "points": g.get("points", 0),
                     "powerPlayPoints": g.get("powerPlayPoints", 0)}
                if "shots" in g: s["shotsTotal"] = g["shots"]
                if "shotsAgainst" in g:
                    s["saves"] = g["shotsAgainst"] - g.get("goalsAgainst", 0)
                    if not g.get("gamesStarted"): continue  # skip relief appearances for goalie lines
                t = mmss(g.get("toi", ""))
                if t is not None: s["toi"] = t
                b = box.get("%s|%s" % (g["gameId"], pid))
                if b is not None: s["blockedShots"] = b
                games.append({"d": g["gameDate"], "o": N2E.get(g["opponentAbbrev"], g["opponentAbbrev"]),
                              "at": "@" if g["homeRoadFlag"] == "R" else "vs", "e": str(g["gameId"]),
                              "t": N2E.get(g["teamAbbrev"], g["teamAbbrev"]), "s": s})
    games.sort(key=lambda g: g["d"], reverse=True)
    return games[:70]

def update_boxscores():
    """Cache current-season completed regular-season boxscores (incremental)."""
    cur = season_ids()[0]
    db = F.load("nhl_box.json", {})
    if db.get("season") != cur: db = {"season": cur, "games": {}, "players": {}}
    start = dt.date(int(cur[:4]), 10, 1)
    day, today = start, dt.date.today()
    while day <= today:
        d = F.get("%s/schedule/%s" % (API, day.isoformat())) or {}
        for wk in d.get("gameWeek", []):
            for g in wk.get("games", []):
                gid = str(g["id"])
                if g.get("gameType") != 2 or g.get("gameState") not in ("OFF", "FINAL") or gid in db["games"]: continue
                b = F.get("%s/gamecenter/%s/boxscore" % (API, gid)) or {}
                pb = b.get("playerByGameStats")
                if not pb: continue
                rec = {}
                for side, opp in (("homeTeam", "awayTeam"), ("awayTeam", "homeTeam")):
                    ab = N2E.get(b[side]["abbrev"], b[side]["abbrev"])
                    F_ = [p for p in pb[side].get("forwards", [])]
                    D_ = [p for p in pb[side].get("defense", [])]
                    G_ = [p for p in pb[side].get("goalies", [])]
                    for p in F_ + D_:
                        db["players"]["%s|%s" % (gid, p["playerId"])] = p.get("blockedShots", 0)
                    agg = lambda ps, k: sum(p.get(k, 0) or 0 for p in ps)
                    rec[ab] = {"F": {"sog": agg(F_, "sog"), "pts": agg(F_, "points"), "g": agg(F_, "goals"), "a": agg(F_, "assists")},
                               "D": {"sog": agg(D_, "sog"), "pts": agg(D_, "points"), "g": agg(D_, "goals"), "a": agg(D_, "assists")},
                               "sf": b[side].get("sog") or agg(F_ + D_, "sog"),
                               "opp": N2E.get(b[opp]["abbrev"], b[opp]["abbrev"])}
                db["games"][gid] = rec
        day += dt.timedelta(days=7)
    F.save("nhl_box.json", db)
    return db

MK = {"Shots on Goal": "sog", "Points": "pts", "Goals": "g", "Anytime Goal": "g", "Assists": "a"}

def dvp(db):
    """allowed[(defense, grp, stat)] per game; plus team shots-for per game (for goalie saves)."""
    allowed, n, sf = {}, {}, {}
    for rec in db["games"].values():
        for team, r in rec.items():
            d = r["opp"]  # d's defense allowed r's production
            n[d] = n.get(d, 0) + 1
            sf.setdefault(team, []).append(r["sf"])
            for grp in ("F", "D"):
                for k, v in r[grp].items():
                    allowed[(d, grp, k)] = allowed.get((d, grp, k), 0) + v
    out = {}
    teams = list(n)
    for grp in ("F", "D"):
        for k in ("sog", "pts", "g", "a"):
            vals = sorted(((allowed.get((d, grp, k), 0) / n[d], d) for d in teams), reverse=True)
            for i, (v, d) in enumerate(vals):
                out[(d, grp, k)] = (i + 1, round(v, 2), len(vals), n[d])
    sfv = sorted(((sum(v) / len(v), t, len(v)) for t, v in sf.items()), reverse=True)
    for i, (v, t, c) in enumerate(sfv):
        out[(t, "SF")] = (i + 1, round(v, 1), len(sfv), c)
    return out

def enrich(props, logs):
    db = update_boxscores()
    dv = dvp(db)
    for p in props:
        grp = "D" if p["pos"] == "D" else "F"
        if p["pos"] == "G" and p["market"] == "Saves":
            r = dv.get((p["oa"], "SF"))
            if r: p["dvp"] = {"r": r[0], "of": r[2], "v": r[1], "g": r[3], "what": "shots on goal per game (opponent offense)",
                              "tag": "soft" if r[0] <= 8 else "tough" if r[0] > r[2] - 8 else ""}
        elif p["market"] in MK and p["pos"] != "G":
            r = dv.get((p["oa"], grp, MK[p["market"]]))
            if r: p["dvp"] = {"r": r[0], "of": r[2], "v": r[1], "g": r[3], "what": "%s per game to %s" % ({"sog": "shots", "pts": "points", "g": "goals", "a": "assists"}[MK[p["market"]]], "defensemen" if grp == "D" else "forwards"),
                              "tag": "soft" if r[0] <= 8 else "tough" if r[0] > r[2] - 8 else ""}
        gs = logs.get(p["aid"], [])
        cur = [g for g, _ in F.current_season([(g, 0) for g in gs])]
        tv = [g["s"]["toi"] for g in cur if "toi" in g["s"]]
        if tv:
            l5, szn = sum(tv[:5]) / len(tv[:5]), sum(tv) / len(tv)
            pp = [g["s"].get("powerPlayPoints", 0) for g in cur]
            p["u"] = {"n": len(tv), "toi": {"szn": round(szn, 1), "l5": round(l5, 1), "tr": 1 if l5 > szn * 1.1 else -1 if l5 < szn * .9 else 0, "label": "TOI (min)"},
                      "ppp": {"szn": round(sum(pp) / len(pp), 2), "l5": round(sum(pp[:5]) / len(pp[:5]), 2), "tr": 0, "label": "PP points/g"}}
