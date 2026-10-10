#!/usr/bin/env python3
"""Bet Lab data fetcher. Pulls DraftKings player-prop lines (via ESPN's public,
unofficial odds feed) and player game logs (ESPN) into data/*.json.

Usage: python scripts/fetch_props.py [--logs]   (--logs = refresh every game log)
Be polite: small thread pool, short sleeps, large page sizes, cached athletes.
"""
import json, os, re, sys, time, datetime as dt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen

DATA = os.path.join(os.path.dirname(__file__), "..", "data")
UA = {"User-Agent": "Mozilla/5.0 (BetLab personal research demo)"}
SITE = "https://site.api.espn.com/apis/site/v2/sports/{p}/scoreboard"
CORE = "https://sports.core.api.espn.com/v2/sports/{s}/leagues/{l}"
GLOG = "https://site.web.api.espn.com/apis/common/v3/sports/{p}/athletes/{a}/gamelog"
DK = 100  # ESPN provider id for DraftKings
SPORTS = {
    "nfl": {"path": "football/nfl", "days": 7},
    "cfb": {"path": "football/college-football", "days": 7, "extra": "&groups=80&limit=300"},
    "nba": {"path": "basketball/nba", "days": 2},
    "nhl": {"path": "hockey/nhl", "days": 2},
    "mlb": {"path": "baseball/mlb", "days": 2},
}
FB = {
    "Passing Yards": ["passingYards"], "Pass Completions": ["completions"],
    "Passing Attempts": ["passingAttempts"], "Passing Touchdowns": ["passingTouchdowns"],
    "Passing Interceptions": ["interceptions"], "Rushing Yards": ["rushingYards"],
    "Carries": ["rushingAttempts"], "Receiving Yards": ["receivingYards"],
    "Receptions": ["receptions"], "Rushing Plus Receiving Yards": ["rushingYards", "receivingYards"],
    "Passing Plus Rushing Yards": ["passingYards", "rushingYards"],
    "Longest Reception": ["longReception"], "Longest Rush": ["longRushing"],
    "Longest Passing Completion": ["longPassing"], "Field Goals Made": ["fieldGoalsMade-fieldGoalAttempts"],
    "Extra Points Made": ["extraPointsMade-extraPointAttempts"], "Kicking Points": ["totalKickingPoints"], "Tackles": ["soloTackles"],
    "Tackles Plus Assists": ["totalTackles"], "Sacks": ["sacks"],
    "Anytime TD": ["rushingTouchdowns", "receivingTouchdowns"],
}
MAP = {
    "nfl": FB, "cfb": FB,
    "nba": {"Points": ["points"], "Rebounds": ["totalRebounds"], "Assists": ["assists"],
            "3-Point Field Goals": ["threePointFieldGoalsMade-threePointFieldGoalsAttempted"],
            "Steals": ["steals"], "Blocks": ["blocks"], "Turnovers": ["turnovers"],
            "Points + Assists + Rebounds": ["points", "assists", "totalRebounds"],
            "Points + Rebounds": ["points", "totalRebounds"], "Points + Assists": ["points", "assists"],
            "Rebounds + Assists": ["totalRebounds", "assists"]},
    "nhl": {"Points": ["points"], "Assists": ["assists"], "Goals": ["goals"], "Anytime Goal": ["goals"],
            "Shots on Goal": ["shotsTotal"], "Saves": ["saves"], "Blocked Shots": ["blockedShots"],
            "Powerplay Points": ["powerPlayPoints"]},
    "mlb": {"Hits": ["hits"], "Runs Scored": ["runs"], "RBIs": ["RBIs"], "Walks (Batter)": ["walks"],
            "Hits + Runs + RBIs": ["hits", "runs", "RBIs"], "Doubles Hit": ["doubles"],
            "Home Runs": ["homeRuns"], "Stolen Bases": ["stolenBases"],
            "Strikeouts (Batter)": ["strikeouts"],
            "Bases": ["hits", "doubles", "doubles", "triples", "triples", "triples", "homeRuns", "homeRuns", "homeRuns", "homeRuns"],
            "Singles Hit": ["hits", "-doubles", "-triples", "-homeRuns"]},
}

def get(url, tries=3):
    for i in range(tries):
        try:
            with urlopen(Request(url, headers=UA), timeout=20) as r:
                time.sleep(0.12)
                return json.load(r)
        except Exception as e:
            if 400 <= (getattr(e, "code", None) or 0) < 500:
                return None
            time.sleep(1.5 * (i + 1))
    raise RuntimeError("failed " + url)

def load(name, default):
    try:
        with open(os.path.join(DATA, name)) as f:
            return json.load(f)
    except Exception:
        return default

def save(name, obj):
    with open(os.path.join(DATA, name), "w") as f:
        json.dump(obj, f, separators=(",", ":"), sort_keys=True)

def market_name(t):
    t = re.sub(r"\s*\((incl\.|excl\.?)[^)]*\)", "", t, flags=re.I).strip()
    if "Milestone" in t: return None
    if t == "Anytime Touchdown Scorer": return "Anytime TD"
    if t == "Anytime Goalscorer": return "Anytime Goal"
    return t[6:] if t.startswith("Total ") else None  # ladders/milestones/team markets skipped

def events_for(key, cfg):
    s, l = cfg["path"].split("/")
    today = dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=4)
    if s == "football":  # default scoreboard = current week
        boards = [get(SITE.format(p=cfg["path"]) + "?" + cfg.get("extra", "").lstrip("&"))]
    else:
        boards = [get(SITE.format(p=cfg["path"]) + "?dates=" + (today + dt.timedelta(days=i)).strftime("%Y%m%d"))
                  for i in range(cfg["days"] + 1)]
    out, ids = [], set()
    for e in [e for b in boards for e in (b or {}).get("events", [])]:
        if e["id"] in ids: continue
        ids.add(e["id"])
        if e["status"]["type"]["state"] != "pre":
            continue
        comp = e["competitions"][0]
        teams = {c["team"]["id"]: {"abbr": c["team"].get("abbreviation", "?"), "ha": c["homeAway"]} for c in comp["competitors"]}
        out.append({"id": e["id"], "date": e["date"], "name": e.get("shortName", e["name"]), "teams": teams})
    return out

def game_odds(s, l, ev):
    """DraftKings total/spread for one game via ESPN; implied team totals."""
    home = next((t["abbr"] for t in ev["teams"].values() if t["ha"] == "home"), "")
    away = next((t["abbr"] for t in ev["teams"].values() if t["ha"] == "away"), "")
    g = {"id": ev["id"], "time": ev["date"], "home": home, "away": away}
    d = get(CORE.format(s=s, l=l) + "/events/{0}/competitions/{0}/odds".format(ev["id"])) or {}
    it = next((i for i in d.get("items", []) if str(i.get("provider", {}).get("id")) == str(DK)), None)
    if it and it.get("overUnder") is not None:
        tot, sp = it["overUnder"], it.get("spread")  # spread is the home team's line
        g.update(total=tot, spread=sp, details=it.get("details"),
                 mlh=(it.get("homeTeamOdds") or {}).get("moneyLine"), mla=(it.get("awayTeamOdds") or {}).get("moneyLine"))
        if sp is not None and s in ("football", "basketball"):  # MLB/NHL spreads are run/puck lines
            g.update(itt_home=round((tot - sp) / 2, 2), itt_away=round((tot + sp) / 2, 2))
    return g

def script_for(g, ha):
    if "total" not in g or ha not in ("home", "away"): return None
    sp = g.get("spread")
    me, op = ("home", "away") if ha == "home" else ("away", "home")
    return {"tot": g["total"], "sp": (sp if ha == "home" else -sp) if sp is not None else None,
            "ml": g.get("mlh" if ha == "home" else "mla"),
            "itt": g.get("itt_" + me), "oitt": g.get("itt_" + op)}

def athlete(sport, ref, cache):
    aid = re.search(r"athletes/(\d+)", ref).group(1)
    if aid not in cache:
        d = get(ref.replace("http://", "https://")) or {}
        tm = re.search(r"teams/(\d+)", (d.get("team") or {}).get("$ref", ""))
        cache[aid] = {"name": d.get("displayName", "Unknown"), "pos": (d.get("position") or {}).get("abbreviation", ""),
                      "team": tm.group(1) if tm else None,
                      "head": (d.get("headshot") or {}).get("href")}
    return aid

def gamelog(path, aid):
    games, seen = [], set()
    d = get(GLOG.format(p=path, a=aid))
    def eat(d):
        if not d: return
        names = d.get("names", [])
        for st in d.get("seasonTypes", []):
            if "preseason" in st["displayName"].lower():
                continue
            for c in st.get("categories", []):
                for ev in c.get("events", []):
                    if ev["eventId"] in seen: continue
                    seen.add(ev["eventId"])
                    meta = d.get("events", {}).get(ev["eventId"], {})
                    stats = {}
                    for n, v in zip(names, ev["stats"]):
                        try: stats[n] = float(str(v).split("-")[0]) if "-" in n else float(v)
                        except ValueError: pass
                    games.append({"d": meta.get("gameDate", "")[:10], "o": (meta.get("opponent") or {}).get("abbreviation", ""),
                                  "at": meta.get("atVs", ""), "e": ev["eventId"],
                                  "t": (meta.get("team") or {}).get("abbreviation", ""), "s": stats})
    eat(d)
    if d:  # always add the prior season for head-to-head / split samples
        seasons = [f["value"] for f in d.get("filters", []) if f.get("name") == "season"]
        if seasons and seasons[0].isdigit():
            eat(get(GLOG.format(p=path, a=aid) + "?season=" + str(int(seasons[0]) - 1)))
    games.sort(key=lambda g: g["d"], reverse=True)
    return games[:70]

def statval(g, stat):
    t = 0
    for k in stat:
        kk = k.lstrip("-")
        if kk not in g["s"]: return None
        t += -g["s"][kk] if k.startswith("-") else g["s"][kk]
    return t

def current_season(vals):
    """newest-first (game, v) pairs up to the first 60+ day gap (offseason)."""
    out = []
    for i, x in enumerate(vals):
        if i and (dt.date.fromisoformat(vals[i - 1][0]["d"]) - dt.date.fromisoformat(x[0]["d"])).days > 60: break
        out.append(x)
    return out

def summarize(p, games):
    """Precompute hit rates, streaks, H2H and home/away splits for one prop."""
    vals = [(g, statval(g, p["stat"])) for g in games] if p["stat"] else []
    vals = [(g, v) for g, v in vals if v is not None]
    if not vals: return None
    L = p["line"]
    def agg(xs):
        return [sum(v > L for _, v in xs), len(xs), round(sum(v for _, v in xs) / len(xs), 2)] if xs else None
    over = under = 0
    for _, v in vals:
        if v > L: over += 1
        else: break
    for _, v in vals:
        if v < L: under += 1
        else: break
    cur = current_season(vals)
    return {"l5": agg(vals[:5]), "l10": agg(vals[:10]), "l20": agg(vals[:20]),
            "szn": agg(cur), "all": agg(vals),
            "os": over, "us": under,
            "h2h": agg([x for x in vals if x[0]["o"] == p.get("oa")]),
            "home": agg([x for x in vals if x[0]["at"] != "@"]),
            "away": agg([x for x in vals if x[0]["at"] == "@"])}

def run_sport(key, cfg, full_logs):
    s, l = cfg["path"].split("/")
    cache = load("athletes_%s.json" % key, {})
    logs = load("logs_%s.json" % key, {})
    props = []
    games = []
    for ev in events_for(key, cfg):
        gs = game_odds(s, l, ev)
        games.append(gs)
        url = CORE.format(s=s, l=l) + "/events/{0}/competitions/{0}/odds/{1}/propBets?limit=1000".format(ev["id"], DK)
        data = get(url) or {"items": []}
        seen = set()
        for it in data.get("items", []):
            tgt = (it.get("current") or {}).get("target", {}).get("value")
            mk = market_name(it["type"]["name"])
            if mk in ("Anytime TD", "Anytime Goal"): tgt = 0.5  # yes/no market: scores 1+ rushing/receiving TD
            if tgt is None or not mk or "athlete" not in it:
                continue
            aid = athlete(key, it["athlete"]["$ref"], cache)
            k = (aid, mk)
            if k in seen: continue
            seen.add(k)
            a = cache[aid]
            team = ev["teams"].get(a["team"] or "", {})
            opp = [t for tid, t in ev["teams"].items() if tid != a["team"]]
            props.append({"aid": aid, "player": a["name"], "pos": a["pos"], "team": team.get("abbr", ""),
                          "oa": opp[0]["abbr"] if opp else "", "home": team.get("ha") == "home",
                          "opp": (("@" if team.get("ha") == "away" else "vs ") + opp[0]["abbr"]) if team and opp else ev["name"],
                          "market": mk, "stat": MAP[key].get(mk), "line": tgt,
                          "open": (it.get("open") or {}).get("target", {}).get("value"),
                          "game": ev["id"], "time": ev["date"], "upd": it.get("lastUpdated"),
                          "gs": script_for(gs, team.get("ha"))})
    need = sorted({p["aid"] for p in props if p["stat"] and (full_logs or p["aid"] not in logs)})
    with ThreadPoolExecutor(4) as ex:
        if key == "nhl":
            import nhl
            info = {p["aid"]: (p["player"], p["team"]) for p in props}
            nhl.prepare(set(t for _, t in info.values()))
            fn = lambda a: nhl.gamelog(a, *info[a])
        else:
            fn = lambda a: gamelog(cfg["path"], a)
        for aid, g in zip(need, ex.map(fn, need)):
            logs[aid] = g
    active = {p["aid"] for p in props}
    keep = {k.lstrip("-") for v in MAP[key].values() for k in v} | {"minutes", "atBats", "hitByPitch", "walks", "toi"}
    logs = {a: [dict(g, s={k: v for k, v in g["s"].items() if k in keep}) for g in gs] for a, gs in logs.items() if a in active}
    save("athletes_%s.json" % key, {a: v for a, v in cache.items() if a in active})
    save("logs_%s.json" % key, logs)
    for p in props:
        p["x"] = summarize(p, logs.get(p["aid"], []))
    try:
        import extras
        extras.enrich(key, cfg, props, logs, full_logs)
    except Exception as e:  # extras are best-effort; core props still ship
        import traceback; traceback.print_exc()
        print(key, "extras ERROR", e)
    props.sort(key=lambda p: (p["time"], p["player"], p["market"]))
    save("props_%s.json" % key, props)
    save("games_%s.json" % key, sorted(games, key=lambda g: g["time"]))
    return len(props), len(need)

def main():
    full = "--logs" in sys.argv
    # --only nfl,nhl,soccer:eng.1  -> targeted pre-game refresh of just those sports / soccer leagues
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(",")) - {""}
    meta = load("meta.json", {})
    meta.setdefault("sports", {})
    for key, cfg in SPORTS.items():
        if only is not None and key not in only: continue
        try:
            n, nl = run_sport(key, cfg, full)
            meta["sports"][key] = {"props": n, "ok": True, "at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")}
            print(key, "props", n, "logs fetched", nl)
        except Exception as e:  # keep previous file as fallback
            meta["sports"].setdefault(key, {})["ok"] = False
            meta["sports"][key]["error"] = str(e)[:200]
            print(key, "ERROR", e)
    lgs = None if only is None else sorted(x.split(":", 1)[1] for x in only if x.startswith("soccer:"))
    if only is not None and "soccer" in only: lgs = None
    try:
        if only is not None and lgs == [] and "soccer" not in only: raise StopIteration
        import soccer
        n, counts = soccer.run(full, lgs)
        meta["sports"]["soccer"] = {"props": n, "ok": True, "leagues": counts, "at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")}
        print("soccer props", n, counts)
    except StopIteration:
        pass
    except Exception as e:
        meta["sports"].setdefault("soccer", {})["ok"] = False
        print("soccer ERROR", e)
    meta["mode"] = "full" if only is None else "pregame:" + ",".join(sorted(only))
    meta["updated"] = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    meta["odds_api"] = bool(os.environ.get("ODDS_API_KEY"))  # placeholder: multi-book lines not implemented yet
    save("meta.json", meta)

if __name__ == "__main__":
    main()
