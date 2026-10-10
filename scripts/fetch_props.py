#!/usr/bin/env python3
"""Bet Lab data fetcher. Pulls DraftKings player-prop lines (via ESPN's public,
unofficial odds feed) and player game logs (ESPN) into data/*.json.

Usage: python scripts/fetch_props.py [--logs]   (--logs = refresh every game log)
Be polite: small thread pool, short sleeps, large page sizes, cached athletes.
"""
import json, os, re, sys, time, datetime as dt
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
}
MAP = {
    "nfl": FB, "cfb": FB,
    "nba": {"Points": ["points"], "Rebounds": ["totalRebounds"], "Assists": ["assists"],
            "3-Point Field Goals": ["threePointFieldGoalsMade-threePointFieldGoalsAttempted"],
            "Steals": ["steals"], "Blocks": ["blocks"], "Turnovers": ["turnovers"],
            "Points + Assists + Rebounds": ["points", "assists", "totalRebounds"],
            "Points + Rebounds": ["points", "totalRebounds"], "Points + Assists": ["points", "assists"],
            "Rebounds + Assists": ["totalRebounds", "assists"]},
    "nhl": {"Points": ["points"], "Assists": ["assists"], "Goals": ["goals"],
            "Shots on Goal": ["shotsTotal"], "Saves": ["saves"], "Blocked Shots": ["blockedShots"]},
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
                                  "at": meta.get("atVs", ""), "s": stats})
    eat(d)
    if d and len(games) < 20:
        seasons = [f["value"] for f in d.get("filters", []) if f.get("name") == "season"]
        if seasons and seasons[0].isdigit():
            eat(get(GLOG.format(p=path, a=aid) + "?season=" + str(int(seasons[0]) - 1)))
    games.sort(key=lambda g: g["d"], reverse=True)
    return games[:40]

def run_sport(key, cfg, full_logs):
    s, l = cfg["path"].split("/")
    cache = load("athletes_%s.json" % key, {})
    logs = load("logs_%s.json" % key, {})
    props = []
    for ev in events_for(key, cfg):
        url = CORE.format(s=s, l=l) + "/events/{0}/competitions/{0}/odds/{1}/propBets?limit=1000".format(ev["id"], DK)
        data = get(url) or {"items": []}
        seen = set()
        for it in data.get("items", []):
            tgt = (it.get("current") or {}).get("target", {}).get("value")
            mk = market_name(it["type"]["name"])
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
                          "opp": (("@" if team.get("ha") == "away" else "vs ") + opp[0]["abbr"]) if team and opp else ev["name"],
                          "market": mk, "stat": MAP[key].get(mk), "line": tgt,
                          "open": (it.get("open") or {}).get("target", {}).get("value"),
                          "game": ev["id"], "time": ev["date"], "upd": it.get("lastUpdated")})
    need = sorted({p["aid"] for p in props if p["stat"] and (full_logs or p["aid"] not in logs)})
    with ThreadPoolExecutor(4) as ex:
        for aid, g in zip(need, ex.map(lambda a: gamelog(cfg["path"], a), need)):
            logs[aid] = g
    active = {p["aid"] for p in props}
    keep = {k.lstrip("-") for v in MAP[key].values() for k in v}
    logs = {a: [dict(g, s={k: v for k, v in g["s"].items() if k in keep}) for g in gs] for a, gs in logs.items() if a in active}
    save("athletes_%s.json" % key, {a: v for a, v in cache.items() if a in active})
    save("logs_%s.json" % key, logs)
    props.sort(key=lambda p: (p["time"], p["player"], p["market"]))
    save("props_%s.json" % key, props)
    return len(props), len(need)

def main():
    full = "--logs" in sys.argv
    meta = load("meta.json", {})
    meta.setdefault("sports", {})
    for key, cfg in SPORTS.items():
        try:
            n, nl = run_sport(key, cfg, full)
            meta["sports"][key] = {"props": n, "ok": True, "at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")}
            print(key, "props", n, "logs fetched", nl)
        except Exception as e:  # keep previous file as fallback
            meta["sports"].setdefault(key, {})["ok"] = False
            meta["sports"][key]["error"] = str(e)[:200]
            print(key, "ERROR", e)
    meta["updated"] = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    meta["odds_api"] = bool(os.environ.get("ODDS_API_KEY"))  # placeholder: multi-book lines not implemented yet
    save("meta.json", meta)

if __name__ == "__main__":
    main()
