"""Bet Lab 'Sports Analyst' (NFL): team rankings, top-5 offense vs bottom-5 defense mismatches,
injury/OL flags, templated data-driven write-ups and anytime-TD scenarios.
Sources: nflverse (player week stats, snap counts, play-by-play), ESPN (scoreboard week, injuries),
DraftKings lines via ESPN (spread / total / implied totals already in games_nfl). Writes data/analyst_nfl.json.
TD probabilities are MODEL ESTIMATES (shrunk hit rate x implied-total factor x matchup factor), not book prices."""
import csv, gzip, io, datetime as dt
from urllib.request import Request, urlopen
import fetch_props as F
import extras as X

OL = {"OT", "T", "G", "C", "OL", "OG"}
DEF = {"DE", "DT", "NT", "LB", "OLB", "ILB", "MLB", "CB", "S", "FS", "SS", "DB", "EDGE", "DL"}
FLAG = ("Out", "Doubtful", "Questionable", "Injured Reserve")
PRIOR = {"RB": 0.30, "WR": 0.22, "TE": 0.15, "QB": 0.08}
PASSPOS, RUSHPOS = {"WR", "TE", "QB"}, {"RB", "QB"}

def team_ranks(rows):
    off, dfn, wk = {}, {}, {}
    for r in rows:
        if r["season_type"] != "REG": continue
        t = X.NV2ESPN.get(r["team"], r["team"]); o = X.NV2ESPN.get(r["opponent_team"], r["opponent_team"])
        wk.setdefault(t, set()).add(r["week"]); wk.setdefault(o, set()).add(r["week"])
        for c in ("passing_yards", "rushing_yards", "passing_tds", "rushing_tds"):
            off[(t, c)] = off.get((t, c), 0) + X.f(r.get(c)); dfn[(o, c)] = dfn.get((o, c), 0) + X.f(r.get(c))
    teams = sorted(wk)
    out = {t: {"g": len(wk[t])} for t in teams}
    for c, k in (("passing_yards", "py"), ("rushing_yards", "ry"), ("passing_tds", "ptd"), ("rushing_tds", "rtd")):
        for src, pre, rev in ((off, "o", True), (dfn, "d", True)):
            vals = sorted(((src.get((t, c), 0) / len(wk[t]), t) for t in teams), reverse=rev)
            for i, (v, t) in enumerate(vals):
                out[t][pre + k] = round(v, 1); out[t][pre + k + "_r"] = i + 1  # off: 1 = most gained; def: 1 = most allowed (worst)
    return out


def team_power_index(tr, season):
    """NFL Team Power Index 1–32 from nflverse yards ranks + SOS from completed REG games.
    OffStr = (33−opy_r + 33−ory_r)/2; DefStr = (dpy_r + dry_r)/2 (higher = fewer yds allowed);
    SOS = avg opponent (OffStr+DefStr)/2; TPI raw = 0.4*Off + 0.4*Def + 0.2*SOS, min–max to 0–100."""
    import csv, io
    from urllib.request import Request, urlopen
    url = "https://github.com/nflverse/nfldata/raw/master/data/games.csv"
    try:
        with urlopen(Request(url, headers=F.UA), timeout=60) as r:
            games = [x for x in csv.DictReader(io.TextIOWrapper(r, "utf-8"))
                     if x["season"] == str(season) and x["game_type"] == "REG" and x["home_score"]]
    except Exception as e:
        print("tpi games ERROR", e); games = []
    def ab(t): return X.NV2ESPN.get(t, t)
    def off_str(t):
        v = tr.get(t); return 16.5 if not v else (33 - v["opy_r"] + 33 - v["ory_r"]) / 2
    def def_str(t):
        v = tr.get(t); return 16.5 if not v else (v["dpy_r"] + v["dry_r"]) / 2
    opp = {t: [] for t in tr}; pf, pa, w, l, gp = {}, {}, {}, {}, {}
    for g in games:
        h, a = ab(g["home_team"]), ab(g["away_team"]); hs, as_ = int(g["home_score"]), int(g["away_score"])
        for t, s_, o in ((h, hs, as_), (a, as_, hs)):
            pf[t] = pf.get(t, 0) + s_; pa[t] = pa.get(t, 0) + o; gp[t] = gp.get(t, 0) + 1
            if s_ > o: w[t] = w.get(t, 0) + 1
            elif s_ < o: l[t] = l.get(t, 0) + 1
        if h in opp: opp[h].append((off_str(a) + def_str(a)) / 2)
        if a in opp: opp[a].append((off_str(h) + def_str(h)) / 2)
    rows = []
    for t, v in tr.items():
        o, d = off_str(t), def_str(t); sos = sum(opp[t]) / len(opp[t]) if opp[t] else 16.5
        rows.append({"team": t, "g": v["g"], "off": round(o, 2), "def": round(d, 2), "sos": round(sos, 2),
                     "raw": round(0.4 * o + 0.4 * d + 0.2 * sos, 3), "opy_r": v["opy_r"], "ory_r": v["ory_r"],
                     "dpy_r": v["dpy_r"], "dry_r": v["dry_r"],
                     "pf_g": round(pf.get(t, 0) / max(gp.get(t, 1), 1), 1), "pa_g": round(pa.get(t, 0) / max(gp.get(t, 1), 1), 1),
                     "w": w.get(t, 0), "l": l.get(t, 0)})
    rows.sort(key=lambda r: -r["raw"]); mn, mx = rows[-1]["raw"], rows[0]["raw"]
    for i, r in enumerate(rows):
        r["rank"] = i + 1; r["tpi"] = round(100 * (r["raw"] - mn) / max(mx - mn, 1e-9), 1)
    method = {"summary": "Blends offense, defense and schedule strength into one 0-100 rating", "season": season, "games_used": len(games)}
    return rows, method

def redzone(yr):
    """per gsis id: inside-20 rushes, targets, TDs; plus team inside-20 opportunities."""
    url = X.NV + "pbp/play_by_play_%d.csv.gz" % yr
    with urlopen(Request(url, headers=F.UA), timeout=120) as r:
        data = r.read()
    pl, tm = {}, {}
    for r in csv.DictReader(io.TextIOWrapper(gzip.GzipFile(fileobj=io.BytesIO(data)), "utf-8")):
        if r.get("season_type") != "REG" or r.get("two_point_attempt") == "1": continue
        try: y = float(r["yardline_100"])
        except ValueError: continue
        if y > 20: continue
        t = X.NV2ESPN.get(r["posteam"], r["posteam"])
        for col, kind in (("rusher_player_id", "ru"), ("receiver_player_id", "tg")):
            pid = r.get(col)
            if not pid: continue
            d = pl.setdefault(pid, {"ru": 0, "tg": 0, "td": 0, "team": t})
            d[kind] += 1; tm[t] = tm.get(t, 0) + 1
            if r.get("touchdown") == "1" and r.get("td_team") == r["posteam"]: d["td"] += 1
    return pl, tm

def injuries(snaps):
    d = F.get("https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries") or {}
    share = {}
    for r in snaps:
        if r["game_type"] != "REG": continue
        k = (X.norm(r["player"]), X.NV2ESPN.get(r["team"], r["team"]))
        v = X.f(r["offense_pct"]) if X.f(r["offense_snaps"]) > 0 else X.f(r["defense_pct"]) if X.f(r["defense_snaps"]) > 0 else None
        if v is not None: share.setdefault(k, []).append(v)
    out = {}
    for t in d.get("injuries", []):
        for i in t.get("injuries", []):
            st = i.get("status", "")
            if st not in FLAG: continue
            a = i.get("athlete", {}); pos = (a.get("position") or {}).get("abbreviation", "")
            team = (a.get("team") or {}).get("abbreviation", "")
            sh = share.get((X.norm(a.get("displayName", "")), team), [])
            snap = round(100 * sum(sh) / len(sh)) if sh else None
            grp = "OL" if pos in OL else "DEF" if pos in DEF else "SKILL" if pos in X.SKILL else None
            if not grp or not team: continue
            starter = snap is not None and snap >= 50
            if st == "Injured Reserve" and not starter: continue
            if grp != "OL" and not starter: continue  # only starters for non-OL; all listed OL shown
            out.setdefault(team, []).append({"name": a.get("displayName"), "pos": pos, "grp": grp, "status": st,
                                             "snap": snap, "starter": starter, "note": (i.get("shortComment") or "")[:220]})
    return out

def run(stats, snaps, props, dvp_unused=None):
    yr = X.season_year()
    sb = F.get("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard") or {}
    week = (sb.get("week") or {}).get("number")
    games = F.load("games_nfl.json", [])
    if not games: return
    tr = team_ranks(stats)
    try: rz, rzt = redzone(yr)
    except Exception as e: print("redzone ERROR", e); rz, rzt = {}, {}
    gsis = {(X.norm(r["player_display_name"]), X.NV2ESPN.get(r["team"], r["team"])): r["player_id"] for r in stats}
    inj = injuries(snaps)
    import impact
    try: flags = impact.build(snaps, props, games)
    except Exception as e: print("impact ERROR", e); flags = []
    import sys
    if "--only" not in sys.argv:  # full refreshes only (pbp download)
        try:
            import live_hist; live_hist.build(props)
        except Exception as e: print("live_hist ERROR", e)
    F.save("props_nfl.json", props)  # re-save with impact-flag ids attached
    itts = [g[k] for g in games for k in ("itt_home", "itt_away") if g.get(k)]
    avg = sum(itts) / len(itts) if itts else 22.0
    now = dt.datetime.now(dt.timezone.utc)
    cands = []
    for g in games:
        for side, o, d in (("away", g["away"], g["home"]), ("home", g["home"], g["away"])):
            if o not in tr or d not in tr: continue
            itt = g.get("itt_" + side)
            for kind, ok, dk in (("pass", "opy", "dpy"), ("rush", "ory", "dry")):
                ro, rd = tr[o][ok + "_r"], tr[d][dk + "_r"]
                strict = ro <= 5 and rd <= 5
                score = (33 - ro) + (33 - rd) + (2 * (itt - avg) if itt else 0)
                cands.append({"game": g["id"], "time": g["time"], "kind": kind, "off": o, "def": d, "home": side == "home",
                              "ro": ro, "rd": rd, "ov": tr[o][ok], "dv": tr[d][dk], "strict": strict, "score": round(score, 1),
                              "itt": itt, "total": g.get("total"), "spread": g.get("spread"), "details": g.get("details"),
                              "started": dt.datetime.fromisoformat(g["time"].replace("Z", "+00:00")) <= now})
    cands.sort(key=lambda c: (not c["strict"], -c["score"]))
    top, seen = [], set()
    for c in cands:  # one pairing per offense per game (its most lopsided side)
        if (c["game"], c["off"]) in seen: continue
        seen.add((c["game"], c["off"])); top.append(c)
        if len(top) == 5: break
    td = [p for p in props if p["market"] == "Anytime TD" and p["pos"] in PRIOR]
    def est(p, boost=None):
        a = (p.get("x") or {}).get("all") or [0, 0, 0]
        prior = PRIOR[p["pos"]]; k = 6
        base = (a[0] + k * prior) / (a[1] + k)
        itt = (p.get("gs") or {}).get("itt")
        fi = max(0.8, min(1.2, (itt / avg) ** 0.5)) if itt else 1.0
        fm = 1.0
        if boost and p["pos"] in (PASSPOS if boost == "pass" else RUSHPOS): fm = 1.1
        ol = [x for x in inj.get(p["team"], []) if x["grp"] == "OL" and x["starter"] and x["status"] != "Questionable"]
        fo = 0.95 if len(ol) >= 2 else 1.0
        dk = "drtd" if p["pos"] in ("QB", "RB") else "dptd"  # QBs/RBs score mostly rushing; WR/TE receiving
        lav = sum(t[dk] for t in tr.values()) / len(tr) if tr else 0
        od = tr.get(p.get("oa"), {}).get(dk)
        fd = max(0.8, min(1.25, (od / lav) ** 0.5)) if od is not None and lav else 1.0
        pr = min(0.70, base * fi * fm * fo * fd)
        pid = gsis.get((X.norm(p["player"]), p["team"]))
        r = rz.get(pid) if pid else None
        rzs = {"opp": r["ru"] + r["tg"], "ru": r["ru"], "tg": r["tg"], "td": r["td"],
               "share": round(100 * (r["ru"] + r["tg"]) / rzt[p["team"]]) if rzt.get(p["team"]) else None} if r else None
        why = ["%d of %d games with a TD (last %d)" % (a[0], a[1], a[1]) if a[1] else "no game-log sample",
               "team implied total %.1f vs slate avg %.1f" % (itt, avg) if itt else "no implied total"]
        if rzs: why.append("%d red-zone opps (%d rushes, %d targets, %d%% of team) and %d RZ TDs" % (rzs["opp"], rzs["ru"], rzs["tg"], rzs["share"] or 0, rzs["td"]))
        if od is not None and fd != 1.0: why.append("%s allows %.1f %s TDs/g (league %.1f)" % (p.get("oa"), od, "rushing" if dk == "drtd" else "passing", lav))
        if fm > 1: why.append("+10%% matchup factor (%s mismatch)" % boost)
        if fo < 1: why.append("-5%%: %d OL starters out/doubtful" % len(ol))
        return {"aid": p["aid"], "player": p["player"], "pos": p["pos"], "team": p["team"], "opp": p["opp"], "game": p["game"],
                "prob": round(pr, 3), "hit": a[:2], "l5": ((p.get("x") or {}).get("l5") or [0, 0])[:2], "itt": itt, "rz": rzs,
                "fair": fair(pr), "why": why, "line": p.get("line"), "market": p["market"]}
    for c in top:
        o_inj, d_inj = inj.get(c["off"], []), inj.get(c["def"], [])
        olf = [x for x in o_inj if x["grp"] == "OL"]
        olout = [x for x in olf if x["starter"] and x["status"] != "Questionable"]
        c["inj_off"], c["inj_def"] = o_inj, [x for x in d_inj if x["grp"] == "DEF"]
        c["ol_flag"] = bool(olf)
        k = "passing" if c["kind"] == "pass" else "rushing"
        tm_o, tm_d = tr[c["off"]], tr[c["def"]]
        txt = ("%s ranks #%d in %s offense (%.1f yds/g over %d games) and draws %s, which ranks #%d-worst against the %s (%.1f yds/g allowed over %d games). "
               % (c["off"], c["ro"], k, c["ov"], tm_o["g"], c["def"], c["rd"], k[:-3] if k == "passing" else "run", c["dv"], tm_d["g"]))
        if c["itt"]: txt += "DraftKings has %s's team total at %.1f (game total %s; %s). " % (c["off"], c["itt"], c["total"], c["details"])
        tdk = "ptd" if c["kind"] == "pass" else "rtd"
        txt += "%s has %.1f %s TDs per game; %s allows %.1f. " % (c["off"], tm_o["o" + tdk], k[:-3] if k == "passing" else "rushing", c["def"], tm_d["d" + tdk])
        if olout: txt += "Caution: OL starters %s are %s, which can cap the %s game. " % (", ".join(x["name"] + " (" + x["pos"] + ")" for x in olout), "/".join(sorted({x["status"] for x in olout})), "run" if c["kind"] == "rush" else "pass-protection")
        elif olf: txt += "OL watch: %s listed. " % ", ".join("%s (%s, %s)" % (x["name"], x["pos"], x["status"]) for x in olf)
        else: txt += "No offensive-line injuries listed. "
        dk_out = [x for x in c["inj_def"] if x["status"] in ("Out", "Doubtful", "Injured Reserve")]
        if dk_out: txt += "%s's defense is without %s, widening the edge." % (c["def"], ", ".join(x["name"] + " (" + x["pos"] + ")" for x in dk_out[:4]))
        gw = next((g for g in games if g["id"] == c["game"]), {}).get("wx") or {}
        c["wx"] = gw or None
        if gw.get("dome"): txt += "Weather: none (%s). " % gw["dome"]
        elif gw.get("temp") is not None:
            txt += "Kickoff forecast (Open-Meteo): %d°F, wind %d mph, %d%% rain chance. " % (gw["temp"], gw["wind"], gw["pop"] or 0)
            if gw.get("flags"): txt += "Weather flag: " + "; ".join(gw["flags"]) + ". "
        fx = [f for f in flags if f["team"] == c["off"] and f["kind"] not in ("SELF", "WX")]
        if fx: txt += " Impact flags: " + " | ".join("%s (%s)" % (f["text"], f["dir"]) for f in fx[:4]) + "."
        c["flags"] = [f["id"] for f in fx]
        c["text"] = txt.strip()
        c["outlook"] = "Edge dampened by OL injuries" if olout else "Strong edge" if c["strict"] else "Moderate edge"
        c["tds"] = sorted((est(p, c["kind"]) for p in td if p["game"] == c["game"] and p["team"] == c["off"]), key=lambda e: -e["prob"])[:6]
    # ---- QB advantage plays + injury cascades (historical with/without splits; estimates labelled) ----
    try:
        import cascade; casc = cascade.run(yr)
    except Exception as e: print("cascade ERROR", e); casc = {}
    out_kinds = {(f["team"], f["kind"]) for f in flags if f["kind"] in ("QB", "RB1") and "out" in f["text"].lower()}
    qb_plays = []
    for g in games:
        for team, opp in ((g["home"], g["away"]), (g["away"], g["home"])):
            qp = [p for p in props if p["game"] == g["id"] and p["team"] == team and p["pos"] == "QB"]
            atd = next((p for p in qp if p["market"] == "Anytime TD"), None)
            if not atd: continue
            e = est(atd)
            lad = [{"aid": p["aid"], "market": p["market"], "l10": ((p.get("x") or {}).get("l10") or [0, 0])[:2]} for p in qp if p["market"].startswith("Passing TDs ")]
            why, score = [], e["prob"]
            w = g.get("wx") or {}
            if any(f.startswith(("Rain", "High wind")) for f in w.get("flags", [])):
                why.append("Weather: %s, which favors designed runs/scrambles over the deep pass" % "; ".join(f.split(":")[0] for f in w["flags"])); score += 0.05
            if opp in tr:
                o = tr[opp]
                if o["drtd_r"] <= 8: why.append("%s allows %.1f rushing TDs/g (#%d most) and %.1f rush yds/g (#%d)" % (opp, o["drtd"], o["drtd_r"], o["dry"], o["dry_r"])); score += 0.04
                if o["dptd_r"] <= 8: why.append("%s allows %.1f passing TDs/g (#%d most): TD-ladder spot" % (opp, o["dptd"], o["dptd_r"]))
            if g.get("total") and g["total"] >= 47: why.append("High total %.1f (team implied %s)" % (g["total"], e["itt"]))
            c = casc.get(team)
            if c and (team, "RB1") in out_kinds:
                wo = c["qb_vs_rb"]["without"]
                why.append("Cascade: RB1 %s is OUT. %s without him: %s" % (c["rb"], c["qb"], ("%.1f carries, %.2f rush TD/g in %d games" % (wo["carries"], wo["rushing_tds"], wo["g"])) if wo["g"] else "no games without him in the 2-season sample")); score += 0.05
            why.append("Model: %s" % "; ".join(e["why"][:3]))
            qb_plays.append({"player": atd["player"], "team": team, "opp": opp, "game": g["id"], "time": g["time"], "atd": {"aid": atd["aid"], "market": "Anytime TD", "prob": e["prob"], "hit": e["hit"]},
                             "ladders": lad, "why": why, "score": round(score, 3)})
    qb_plays.sort(key=lambda q: -q["score"])
    cascades_active = [{"team": t, "kind": k, "pair": casc.get(t)} for (t, k) in out_kinds if casc.get(t)]
    try:
        import inj_cascade; injc = inj_cascade.build(props, games, rz, rzt, week)
    except Exception as e: print("inj_cascade ERROR", e); injc = []
    boost_plays = []
    for c in injc:
        for a in c["affected"]:
            if a["d_td"] >= 0.06:
                pa = next((p for p in props if p["market"] == "Anytime TD" and X.norm(p["player"]) == X.norm(a["player"]) and p["team"] == c["team"]), None)
                if pa:
                    e0 = est(pa); boost_plays.append({"player": a["player"], "team": c["team"], "game": pa["game"], "time": pa["time"], "aid": pa["aid"],
                        "prob": e0["prob"], "adj": round(min(0.8, e0["prob"] + a["d_td"]), 3), "d_td": a["d_td"],
                        "why": "%s %s (%s): %+.1f targets, %+.1f carries/g projected" % (c["player"], c["status"], c["role"], a["d_tg"], a["d_ca"])})
    boost_plays.sort(key=lambda b: -b["d_td"])
    allest = sorted((est(p, next((c["kind"] for c in top if c["game"] == p["game"] and c["off"] == p["team"]), None)) for p in td), key=lambda e: -e["prob"])
    try:
        import outcomes as O
        nowz = now.strftime("%Y-%m-%dT%H:%MZ")
        byk = {(p["aid"], p["market"]): p for p in props if p["time"] > nowz}
        items = [{"src": "analyst_td", "title": "%s anytime TD (analyst)" % e["player"], "legs": [byk[(e["aid"], "Anytime TD")]], "est": e["prob"]}
                 for e in allest[:10] if (e["aid"], "Anytime TD") in byk]
        items += [{"src": "qb_play", "title": "%s anytime TD (QB play)" % q["player"], "legs": [byk[(q["atd"]["aid"], "Anytime TD")]], "est": q["atd"]["prob"]}
                  for q in qb_plays[:5] if (q["atd"]["aid"], "Anytime TD") in byk and q["atd"]["prob"] >= 0.2]
        try:
            import kalshi; kp = kalshi.atd_prices()
        except Exception: kp = {}
        for it in items: it["kalshi"] = kp.get(X.norm(it["legs"][0]["player"]))
        for e in allest: e["kalshi"] = kp.get(X.norm(e["player"]))
        O.log_recs("nfl", items)
        import backtest_atd; backtest_atd.maybe_refresh()
    except Exception as e: print("analyst recs ERROR", e)
    tpi, tpi_method = team_power_index(tr, yr)
    F.save("analyst_nfl.json", {"week": week, "season": yr, "updated": now.isoformat(timespec="seconds"), "slate_avg_itt": round(avg, 1),
                                "teams": tr, "tpi": tpi, "tpi_method": tpi_method, "mismatches": top, "n_strict": sum(c["strict"] for c in cands),
                                "candidates": cands[:20], "top_td": allest[:20], "injuries": inj,
                                "rz_ok": bool(rz), "dk_td_price": False,
                                "qb_plays": qb_plays, "cascades": casc, "cascades_active": cascades_active, "inj_cascades": injc, "boost_plays": boost_plays})
    print("analyst week", week, "mismatches", [(c["off"], c["kind"], c["def"], c["strict"]) for c in top])

def fair(p):
    if p <= 0 or p >= 1: return None
    return round(-100 * p / (1 - p)) if p > 0.5 else round(100 * (1 - p) / p)
