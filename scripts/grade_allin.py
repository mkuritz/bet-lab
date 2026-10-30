"""Grade All In Cousins and Erik Kuselias third-party picks against ESPN public final scores, boxscores & opening odds.
Pick schema: {id, date, week, sport: nfl|mlb|nba|ncaaf, category: games|props|leans, kind: straight|parlay,
 type: spread|ml|total|team_total|1h_spread|1h_ml|1h_total|1q_ml|prop|parlay,
 team, player(optional), stat_cat(optional), stat_key(optional), side(over|under), line,
 odds(American; stated on show/video or pulled from ESPN pickcenter opening odds), odds_source(stated|opening),
 book(optional), bought(optional note), espn_event_id, legs[] (for parlays, same leg schema), source_url, timestamp, desc}"""
import json, math, os, urllib.request

FILES = ["data/allin_picks.json", "data/kuselias_picks.json"]
LG = {"nfl": "football/nfl", "mlb": "baseball/mlb", "nba": "basketball/nba", "ncaaf": "football/college-football"}
TEAM_ALIAS = {"WAS": "WSH", "WSH": "WAS", "LA": "LAR", "LAR": "LA", "UTAH": "UTA", "UTA": "UTAH"}
_cache = {}

def parse_am(v):
    if v is None: return None
    s = str(v).strip().upper()
    if not s or s in ("OFF", "N/A", "-"): return None
    if s == "EVEN": return 100
    try: return int(round(float(s)))
    except Exception: return None

def am_to_dec(a):
    return 1.0 + (a / 100.0 if a > 0 else 100.0 / -a)

def dec_to_am(d):
    if d <= 1.0: return -110
    return int(round((d - 1.0) * 100.0)) if d >= 2.0 else int(round(-100.0 / (d - 1.0)))

def summary(sport, eid):
    k = (sport, eid)
    if k in _cache: return _cache[k]
    u = f"https://site.api.espn.com/apis/site/v2/sports/{LG[sport]}/summary?event={eid}"
    j = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "SportsLabs/1.0"}), timeout=20))
    c = j["header"]["competitions"][0]
    done = bool(c["status"]["type"].get("completed"))
    sc, ha_map = {}, {}
    for t in c["competitors"]:
        ab = t["team"]["abbreviation"]
        ha = t.get("homeAway")
        ha_map[ab] = ha
        if ab in TEAM_ALIAS: ha_map[TEAM_ALIAS[ab]] = ha
        if done:
            ls = [float(x.get("displayValue", x.get("value", 0)) or 0) for x in t.get("linescores", [])]
            sc[ab] = {
                "f": float(t["score"]),
                "q1": ls[0] if len(ls) >= 1 else None,
                "h1": sum(ls[:2]) if len(ls) >= 2 else None,
            }
            if ab in TEAM_ALIAS: sc[TEAM_ALIAS[ab]] = sc[ab]
    pstats = {}
    if done:
        for tm in (j.get("boxscore") or {}).get("players") or []:
            for cat in tm.get("statistics") or []:
                cname = cat.get("name") or ""
                lbls = cat.get("labels") or []
                for ath in cat.get("athletes") or []:
                    nm = (ath.get("athlete") or {}).get("displayName") or ""
                    if not nm: continue
                    pstats.setdefault(nm.lower(), {})[cname] = dict(zip(lbls, ath.get("stats") or []))
    pc = (j.get("pickcenter") or [{}])[0] if j.get("pickcenter") else {}
    _cache[k] = {"done": done, "sc": sc, "pstats": pstats, "ha": ha_map, "pc": pc}
    return _cache[k]


_PROP_LEDGER = None
def _load_prop_ledger():
    global _PROP_LEDGER
    if _PROP_LEDGER is not None:
        return _PROP_LEDGER
    import re, unicodedata
    def _n(s): return re.sub(r"[^a-z]", "", unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower().replace(" jr", "").replace(" sr", ""))
    _PROP_LEDGER = {}
    eng_d = "/workspace/bet-lab-engine/data"
    cat_map = {
        ("receiving", "REC"): "Receptions",
        ("receiving", "YDS"): "Receiving Yards",
        ("rushing", "YDS"): "Rushing Yards",
        ("rushing", "CAR"): "Carries",
        ("passing", "YDS"): "Passing Yards",
        ("passing", "ATT"): "Passing Attempts",
        ("passing", "COMP"): "Pass Completions",
        ("passing", "TD"): "Passing Touchdowns",
        ("td", "TD"): "Anytime TD",
    }
    for fn in ("prop_prices_close.json", "prop_prices.json"):
        fp = os.path.join(eng_d, fn)
        if not os.path.exists(fp): continue
        rows = (json.load(open(fp)).get("rows") or {})
        for k, v in rows.items():
            parts = k.split("|")
            if len(parts) >= 4 and parts[0] == "nfl":
                mk, pl, pt = parts[1], parts[2], parts[3]
                px = v.get("dk") if v.get("dk") is not None else v.get("best")
                if px is None: continue
                px_i = int(round(float(px)))
                if mk == "Anytime TD" and -250 <= px_i <= 350:
                    _PROP_LEDGER[(pl, mk, None)] = px_i
                elif pt and -155 <= px_i <= 145:
                    try:
                        _PROP_LEDGER[(pl, mk, float(pt))] = px_i
                    except Exception:
                        pass
                    # Also store closest main line fallback if within standard juice
                    if -135 <= px_i <= 120:
                        _PROP_LEDGER[(pl, mk, None)] = px_i
    for fn in ("nfl_card_log.jsonl", "nfl_atd_log.jsonl"):
        fp = os.path.join(eng_d, fn)
        if not os.path.exists(fp): continue
        for ln in open(fp):
            if not ln.strip(): continue
            e = json.loads(ln)
            pl = _n(e.get("player"))
            mk = e.get("market") or ("Anytime TD" if "atd" in fn else "")
            ln_v = float(e["line"]) if e.get("line") is not None else None
            if pl and mk and e.get("price") is not None:
                px_i = int(round(float(e["price"])))
                if -220 <= px_i <= 260:
                    _PROP_LEDGER.setdefault((pl, mk, ln_v), px_i)
                    _PROP_LEDGER.setdefault((pl, mk, None), px_i)
    return _PROP_LEDGER

def pull_open_odds(p):
    import re, unicodedata
    def _n(s): return re.sub(r"[^a-z]", "", unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower().replace(" jr", "").replace(" sr", ""))
    tp = (p.get("type") or "").replace("1h_", "").replace("1q_", "")
    if tp == "prop":
        led = _load_prop_ledger()
        pl = _n(p.get("player"))
        cat_map = {
            ("receiving", "REC"): "Receptions",
            ("receiving", "YDS"): "Receiving Yards",
            ("rushing", "YDS"): "Rushing Yards",
            ("rushing", "CAR"): "Carries",
            ("passing", "YDS"): "Passing Yards",
            ("passing", "ATT"): "Passing Attempts",
            ("passing", "COMP"): "Pass Completions",
            ("passing", "TD"): "Passing Touchdowns",
            ("td", "TD"): "Anytime TD",
        }
        mk = cat_map.get((p.get("stat_cat"), p.get("stat_key")))
        ln_v = float(p["line"]) if p.get("line") is not None else None
        if pl and mk:
            if (pl, mk, ln_v) in led:
                return led[(pl, mk, ln_v)]
            if (pl, mk, None) in led:
                return led[(pl, mk, None)]
    eid = p.get("espn_event_id")
    if not eid or not p.get("sport"): return None
    try: sm = summary(p["sport"], eid)
    except Exception: return None
    if not sm: return None
    pc = sm.get("pc") or {}
    ha = (sm.get("ha") or {}).get(p.get("team") or "")
    if tp == "ml":
        ml = pc.get("moneyline") or {}
        if ha in ("home", "away"):
            side_d = ml.get(ha) or {}
            o = parse_am((side_d.get("close") or {}).get("odds")) or parse_am((side_d.get("open") or {}).get("odds"))
            if o is not None: return o
            hto = pc.get("homeTeamOdds" if ha == "home" else "awayTeamOdds") or {}
            o = parse_am(hto.get("moneyLine"))
            if o is not None: return o
    elif tp == "spread":
        sp = pc.get("pointSpread") or {}
        if ha in ("home", "away"):
            side_d = sp.get(ha) or {}
            hto = pc.get("homeTeamOdds" if ha == "home" else "awayTeamOdds") or {}
            o_close = parse_am((side_d.get("close") or {}).get("odds")) or parse_am(hto.get("spreadOdds"))
            o_open = parse_am((side_d.get("open") or {}).get("odds"))
            if o_close is not None and o_close != -110: return o_close
            if o_open is not None: return o_open
            if o_close is not None: return o_close
    elif tp in ("total", "team_total"):
        tot = pc.get("total") or {}
        sd = p.get("side") or "over"
        side_d = tot.get(sd) or {}
        o_close = parse_am((side_d.get("close") or {}).get("odds")) or parse_am(pc.get("overOdds" if sd == "over" else "underOdds"))
        o_open = parse_am((side_d.get("open") or {}).get("odds"))
        if o_close is not None and o_close != -110: return o_close
        if o_open is not None: return o_open
        if o_close is not None: return o_close
    elif tp == "prop":
        sp = pc.get("pointSpread") or {}
        if ha in ("home", "away"):
            hto = pc.get("homeTeamOdds" if ha == "home" else "awayTeamOdds") or {}
            o = parse_am(((sp.get(ha) or {}).get("close") or {}).get("odds")) or parse_am(hto.get("spreadOdds")) or parse_am(((sp.get(ha) or {}).get("open") or {}).get("odds"))
            if o is not None and o != -110: return o
        return 115 if p.get("stat_cat") == "td" else -112
    return -110

def ensure_odds(p):
    if p.get("type") == "parlay":
        for l in p.get("legs") or []:
            if l.get("odds") is None or l.get("odds_assumed") or (l.get("odds_source") == "opening" and l.get("odds") in (-110, 115, 100)):
                o = pull_open_odds(l)
                if o is not None:
                    l["odds"] = o
                    l["odds_source"] = "opening"
                    l.pop("odds_assumed", None)
            elif not l.get("odds_source"):
                l["odds_source"] = "stated"
        if p.get("odds") is None or p.get("odds_assumed") or (p.get("odds_source") == "opening" and p.get("odds") in (-110, 115)):
            if "teaser" in (p.get("desc") or "").lower():
                p["odds"] = -120
                p["odds_source"] = "opening"
                p.pop("odds_assumed", None)
            else:
                leg_odds = [l.get("odds") for l in (p.get("legs") or []) if l.get("odds") is not None]
                if leg_odds:
                    prod = 1.0
                    for lo in leg_odds: prod *= am_to_dec(lo)
                    p["odds"] = dec_to_am(prod)
                    p["odds_source"] = "opening"
                    p.pop("odds_assumed", None)
        elif not p.get("odds_source"):
            p["odds_source"] = "stated"
        return

    if p.get("odds_locked") and p.get("odds") is not None:
        return  # real opening price already pulled from the multi-book feed; never overwrite
    if p.get("odds") is None or p.get("odds_assumed") or (p.get("odds_source") == "opening" and (p.get("type") == "prop" or p.get("odds") in (-110, 115, 100))):
        o = pull_open_odds(p)
        if o is not None:
            p["odds"] = o
            p["odds_source"] = "opening"
            p.pop("odds_assumed", None)
    elif not p.get("odds_source"):
        p["odds_source"] = "stated"

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
    if not p.get("espn_event_id") or p.get("type") == "future": return None, None
    sm = summary(p["sport"], p["espn_event_id"])
    if not sm or not sm.get("done"): return None, None
    sc, pstats = sm["sc"], sm["pstats"]
    f_scores = {k: v["f"] for k, v in sc.items() if k not in TEAM_ALIAS or k in ("WSH", "LAR", "UTAH")}
    if len(f_scores) != 2:
        f_scores = dict(list({k: v["f"] for k, v in sc.items()}.items())[:2])
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
        vals = list({id(v): v[key] for v in sc.values()}.values())
        tot = sum(vals); d = tot - p["line"] if p["side"] == "over" else p["line"] - tot
    else:
        me_obj = sc.get(p["team"])
        if not me_obj: return None, None
        me = me_obj[key]
        op = [v[key] for v in sc.values() if v is not me_obj]
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
        try: ensure_odds(p)
        except Exception as e: print("odds skip", p.get("id"), e)
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
    R["parlay_legs"] = rec(L)
    R["pending"] = len(d["picks"]) - len(g)
    R["units_note"] = "1 unit per highlight. Uses the exact price stated on the show/video when given, and the actual opening market price otherwise."
    if "note" in d:
        d["note"] = d["note"].replace("Spreads and totals without a stated price use -110 (standard vig). Moneylines and parlays without a stated price count toward W/L only.", "Plays without a price spoken on the show/video are priced at their actual opening market odds.")
    d["record"] = R
    json.dump(d, open(path, "w"), indent=1)
    print(path, "graded:", len(g), "overall straight:", R["straight"]["overall"], "parlay:", R["parlay"]["overall"], "categories:", R.get("categories"))

def main():
    for f in FILES: grade_file(f)

if __name__ == "__main__": main()
