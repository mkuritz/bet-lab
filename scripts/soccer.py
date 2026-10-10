"""Soccer for Bet Lab: DraftKings props via ESPN (anytime goal + milestone ladders with real DK prices),
player logs built from ESPN match summaries (cached per league), DvP, usage (starts), game script."""
import datetime as dt
from concurrent.futures import ThreadPoolExecutor
import fetch_props as F

LEAGUES = {"eng.1": "EPL", "esp.1": "La Liga", "ita.1": "Serie A", "ger.1": "Bundesliga", "fra.1": "Ligue 1",
           "usa.1": "MLS", "por.1": "Primeira Liga", "ned.1": "Eredivisie", "tur.1": "Süper Lig"}
SITE = "https://site.api.espn.com/apis/site/v2/sports/soccer/%s"
CORE = "https://sports.core.api.espn.com/v2/sports/soccer/leagues/%s"
POS = {"G": "GK", "D": "DF", "M": "MF", "F": "FW"}
MARKETS = {"Shots Milestones": "Shots", "Shots on Target Milestones": "Shots on Target", "Assists Milestones": "Assists",
           "Goalkeeper Saves Milestones": "Saves", "Fouls Committed Milestones": "Fouls Committed",
           "Tackles Milestones": "Tackles"}
STAT = {"Anytime Goal": ["goals"], "Shots": ["shots"], "Shots on Target": ["sot"], "Assists": ["assists"],
        "Saves": ["saves"], "Fouls Committed": ["fouls"], "To Receive a Card": ["cards"], "Tackles": None}
FIELDS = ["g", "a", "sh", "sot", "sv", "fc", "yc", "rc"]
SMAP = {"totalGoals": "g", "goalAssists": "a", "totalShots": "sh", "shotsOnTarget": "sot", "saves": "sv",
        "foulsCommitted": "fc", "yellowCards": "yc", "redCards": "rc"}

def cutoff(lg):
    return "2025-02-01" if lg == "usa.1" else "2025-07-01"

def season_start(lg):
    return "2026-02-01" if lg == "usa.1" else "2026-07-01"

def posmap(a):
    a = (a or "").upper()
    if a in ("SUB", "S", ""): return ""
    if a in POS: return POS[a]
    if a.startswith("G"): return "GK"
    if "B" in a or a.startswith("CD") or a in ("LB", "RB", "SW"): return "DF"
    if "M" in a: return "MF"
    if "F" in a or "W" in a or a in ("ST", "CF"): return "FW"
    return a

def american(o):
    try: return int(str((o or {}).get("american", "")).replace("+", ""))
    except ValueError: return None

def implied(a):
    return 100 / (a + 100) if a > 0 else -a / (-a + 100)

def summary(lg, eid):
    d = F.get(SITE % lg + "/summary?event=" + eid) or {}
    comp = (d.get("header") or {}).get("competitions", [{}])[0]
    rec = {"d": (comp.get("date") or "")[:10], "p": {}, "t": {}}
    for r in d.get("rosters", []):
        ab = r["team"].get("abbreviation", "?")
        rec["t"][r["homeAway"]] = ab
        for p in r.get("roster", []):
            st = {s["name"]: s.get("value", 0) for s in p.get("stats", [])}
            if not st.get("appearances"): continue
            a = p["athlete"]
            rec["p"][a["id"]] = [ab, posmap((p.get("position") or {}).get("abbreviation")), 1 if p.get("starter") else 0,
                                 a.get("displayName", "")] + [st.get(k, 0) or 0 for k in SMAP]
    return rec if rec["p"] else None

def update_box(lg):
    db = F.load("soccer/%s_box.json" % lg, {})
    evs = []
    for y in (2025, 2026):
        sb = F.get(SITE % lg + "/scoreboard?dates=%d&limit=1000" % y) or {}
        for e in sb.get("events", []):
            if e["status"]["type"].get("completed") and e["date"][:10] >= cutoff(lg) and e["id"] not in db:
                evs.append(e["id"])
    with ThreadPoolExecutor(6) as ex:
        for eid, rec in zip(evs, ex.map(lambda e: summary(lg, e), evs)):
            if rec: db[eid] = rec
    F.save("soccer/%s_box.json" % lg, db)
    return db, len(evs)

def player_logs(db):
    logs, info, posc = {}, {}, {}
    for eid, m in db.items():
        h, a = m["t"].get("home"), m["t"].get("away")
        for aid, row in m["p"].items():
            team, pos, st, name = row[:4]
            v = dict(zip(SMAP.values(), row[4:]))
            s = {"goals": v["g"], "assists": v["a"], "shots": v["sh"], "sot": v["sot"], "saves": v["sv"],
                 "fouls": v["fc"], "cards": v["yc"] + v["rc"], "start": st}
            home = team == h
            logs.setdefault(aid, []).append({"d": m["d"], "o": a if home else h, "at": "vs" if home else "@", "e": eid, "t": team, "s": s})
            if pos: posc.setdefault(aid, {}).setdefault(pos, 0); posc[aid][pos] = posc[aid].get(pos, 0) + 1
            if aid not in info or m["d"] > info[aid][3]: info[aid] = (name, pos, team, m["d"])
    for g in logs.values(): g.sort(key=lambda x: x["d"], reverse=True)
    for aid, (name, pos, team, d) in list(info.items()):
        if aid in posc: info[aid] = (name, max(posc[aid], key=posc[aid].get), team, d)
    return logs, info

def dvp(db, lg):
    allowed, n = {}, {}
    for m in db.values():
        if m["d"] < season_start(lg): continue
        h, a = m["t"].get("home"), m["t"].get("away")
        for d in (h, a): n[d] = n.get(d, 0) + 1
        for row in m["p"].values():
            team, pos = row[0], row[1]
            if pos not in ("FW", "MF"): continue
            d = a if team == h else h
            v = dict(zip(SMAP.values(), row[4:]))
            for k in ("g", "sh", "sot", "a"):
                allowed[(d, pos, k)] = allowed.get((d, pos, k), 0) + v[k]
    out = {}
    for pos in ("FW", "MF"):
        for k in ("g", "sh", "sot", "a"):
            vals = sorted(((allowed.get((d, pos, k), 0) / c, d) for d, c in n.items()), reverse=True)
            for i, (v, d) in enumerate(vals):
                out[(d, pos, k)] = (i + 1, round(v, 2), len(vals), n[d])
    return out

DVK = {"Anytime Goal": "g", "Shots": "sh", "Shots on Target": "sot", "Assists": "a"}

def fixtures(lg, days=4):
    today = dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=4)
    out, seen = [], set()
    for i in range(days + 1):
        sb = F.get(SITE % lg + "/scoreboard?dates=" + (today + dt.timedelta(days=i)).strftime("%Y%m%d")) or {}
        for e in sb.get("events", []):
            if e["id"] in seen or e["status"]["type"]["state"] != "pre": continue
            seen.add(e["id"])
            c = e["competitions"][0]
            teams = {t["team"]["id"]: {"abbr": t["team"].get("abbreviation", "?"), "ha": t["homeAway"]} for t in c["competitors"]}
            out.append({"id": e["id"], "date": e["date"], "name": e.get("shortName", e["name"]), "teams": teams})
    return out

def game_odds(lg, ev):
    home = next(t["abbr"] for t in ev["teams"].values() if t["ha"] == "home")
    away = next(t["abbr"] for t in ev["teams"].values() if t["ha"] == "away")
    g = {"id": ev["id"], "time": ev["date"], "home": home, "away": away, "lg": lg}
    d = F.get(CORE % lg + "/events/{0}/competitions/{0}/odds".format(ev["id"])) or {}
    it = next((i for i in d.get("items", []) if str(i.get("provider", {}).get("id")) == "100"), None)
    if it:
        g.update(total=it.get("overUnder"), details=it.get("details"), mlh=(it.get("homeTeamOdds") or {}).get("moneyLine"),
                 mla=(it.get("awayTeamOdds") or {}).get("moneyLine"), mld=(it.get("drawOdds") or {}).get("moneyLine"))
    return g

def props_for(lg, ev, info, cache):
    d = F.get(CORE % lg + "/events/{0}/competitions/{0}/odds/100/propBets?limit=1000".format(ev["id"])) or {}
    by = {}
    for it in d.get("items", []):
        if "athlete" not in it: continue
        tn = it["type"]["name"]
        aid = it["athlete"]["$ref"].split("/athletes/")[1].split("?")[0]
        tid = (it.get("team") or {}).get("$ref", "").split("/teams/")[-1].split("?")[0] if it.get("team") else None
        cur = it.get("current") or {}
        if tn == "Anytime Goalscorer":
            by[(aid, "Anytime Goal")] = {"aid": aid, "tid": tid, "rungs": [(1, american(cur.get("over")))]}
        elif tn == "To Receive a Card":
            by[(aid, "To Receive a Card")] = {"aid": aid, "tid": tid, "rungs": [(1, american(cur.get("over")))]}
        elif tn in MARKETS:
            t = (cur.get("target") or {}).get("value")
            if t is None: continue
            by.setdefault((aid, MARKETS[tn]), {"aid": aid, "tid": tid, "rungs": []})["rungs"].append((t, american(cur.get("over"))))
    out = []
    for (aid, mk), v in by.items():
        rungs = sorted({r for r in v["rungs"] if r[0] is not None})
        priced = [r for r in rungs if r[1] is not None]
        main = min(priced, key=lambda r: abs(implied(r[1]) - 0.5)) if priced else rungs[0]
        if aid not in info and aid not in cache:
            a = F.get(CORE % lg + "/seasons/2026/athletes/" + aid) or {}
            cache[aid] = (a.get("displayName", "Unknown"), posmap((a.get("position") or {}).get("abbreviation")) or "?", None, "")
        name, pos, team, _ = info.get(aid) or cache[aid]
        side = ev["teams"].get(v["tid"] or "")
        if not side:
            side = next((t for t in ev["teams"].values() if t["abbr"] == team), None)
        opp = next((t for t in ev["teams"].values() if side and t is not side), None)
        if not side: continue  # can't place player on either team
        out.append({"aid": aid, "player": name, "pos": pos, "team": side["abbr"] if side else "",
                    "oa": opp["abbr"] if opp else "", "home": bool(side and side["ha"] == "home"),
                    "opp": (("@" if side["ha"] == "away" else "vs ") + opp["abbr"]) if side and opp else ev["name"],
                    "market": mk, "stat": STAT.get(mk), "line": main[0] - 0.5, "ov": main[1],
                    "ladder": [[r[0], r[1]] for r in rungs] if len(rungs) > 1 else None,
                    "game": ev["id"], "time": ev["date"], "lg": lg, "open": None})
    return out

def run(full=False):
    import extras
    allp, games, logs_all, counts = [], [], {}, {}
    cache = {}
    for lg in LEAGUES:
        try:
            db, nnew = update_box(lg)
            logs, info = player_logs(db)
            dv = dvp(db, lg)
            n = 0
            for ev in fixtures(lg):
                g = game_odds(lg, ev); games.append(g)
                ps = props_for(lg, ev, info, cache)
                for p in ps:
                    side = "home" if p["home"] else "away"
                    if g.get("total") is not None:
                        p["gs"] = {"tot": g["total"], "ml": g.get("mlh" if p["home"] else "mla"), "oml": g.get("mla" if p["home"] else "mlh"),
                                   "draw": g.get("mld"), "sp": None, "itt": None}
                    gl = logs.get(p["aid"], [])
                    if p["stat"]:
                        p["x"] = F.summarize(p, gl)
                    k = DVK.get(p["market"])
                    if k and p["pos"] in ("FW", "MF"):
                        r = dv.get((p["oa"], p["pos"], k))
                        if r: p["dvp"] = {"r": r[0], "of": r[2], "v": r[1], "g": r[3], "tag": "soft" if r[0] <= 5 else "tough" if r[0] > r[2] - 5 else "",
                                          "what": {"g": "goals", "sh": "shots", "sot": "shots on target", "a": "assists"}[k] + " per game to " + ("forwards" if p["pos"] == "FW" else "midfielders")}
                    cur = [x for x, _ in F.current_season([(x, 0) for x in gl])]
                    if cur:
                        st = [x["s"]["start"] for x in cur]
                        l5 = sum(st[:5]) / len(st[:5]) * 100; sz = sum(st) / len(st) * 100
                        gls = sum(x["s"]["goals"] for x in cur); ast = sum(x["s"]["assists"] for x in cur)
                        p["u"] = {"n": len(cur), "st": {"szn": round(sz), "l5": round(l5), "tr": 1 if l5 > sz + 15 else -1 if l5 < sz - 15 else 0, "label": "Start %"},
                                  "ga": {"szn": gls + ast, "g": gls, "a": ast}}
                    logs_all[p["aid"]] = [dict(x, s={k2: v2 for k2, v2 in x["s"].items()}) for x in gl[:60]]
                allp += ps; n += len(ps)
            counts[lg] = n
            print("soccer", lg, "props", n, "new matches", nnew)
        except Exception as e:
            import traceback; traceback.print_exc()
            print("soccer", lg, "ERROR", e); counts[lg] = None
    # top guys: per team, rank prop players by season G+A then starts
    teams = {}
    for p in allp:
        if p.get("u"): teams.setdefault((p["lg"], p["team"]), {})[p["aid"]] = (p["u"]["ga"]["szn"], p["u"]["st"]["szn"])
    for p in allp:
        t = teams.get((p["lg"], p["team"]), {})
        rk = sorted(t, key=lambda a: t[a], reverse=True)
        p["top"] = p["aid"] in rk[:3] and t[p["aid"]][1] >= 60
    extras.line_history("soccer", allp)
    allp.sort(key=lambda p: (p["time"], p["player"], p["market"]))
    F.save("props_soccer.json", allp)
    F.save("logs_soccer.json", logs_all)
    F.save("games_soccer.json", sorted(games, key=lambda g: g["time"]))
    return len(allp), counts
