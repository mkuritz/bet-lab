"""Current-injury cascades (NFL). Driven by the live ESPN injury report (+ nflverse practice report when the current week is posted).
Only impactful players (QB1, RB1, top-2 WR by targets, TE1, or >=15% target share / >=35% carry share / >=15% red-zone share)
listed Out / Doubtful / Questionable / IR whose team is on the board. Absorbers: 2-season with/without splits blended 50/50 with
proportional redistribution of the vacated targets/carries (proportional only when the 'without' sample < 3 games). Estimates, labelled."""
import math
import extras as X, fetch_props as F

STAT = ("Out", "Doubtful", "Questionable", "Injured Reserve")

def _rows(yr):
    rows = []
    for y in (yr - 1, yr):
        try: rows += [r for r in X.csv_rows(X.NV + "stats_player/stats_player_week_%d.csv" % y) if r["season_type"] == "REG"]
        except Exception as e: print("inj_cascade", y, e)
    for r in rows: r["_t"] = X.NV2ESPN.get(r["team"], r["team"])
    return rows

def _practice(yr, week):
    try: rr = X.csv_rows(X.NV + "injuries/injuries_%d.csv" % yr)
    except Exception: return {}
    out = {}
    for r in rr:
        if r["week"] != str(week): continue
        out[(X.norm(r["full_name"]), X.NV2ESPN.get(r["team"], r["team"]))] = (r["practice_status"], r["report_status"], r["report_primary_injury"])
    return out

def build(props, games, rz, rzt, week, yr=None):
    yr = yr or X.season_year()
    onboard = {g["home"] for g in games} | {g["away"] for g in games}
    import datetime as dt
    today = dt.date.today(); nxt = {}
    try:
        for g in X.csv_rows(X.NV + "schedules/games.csv"):
            if g["season"] == str(yr) and g["gameday"] and 0 <= (dt.date.fromisoformat(g["gameday"]) - today).days <= 8 and not g["home_score"]:
                for t, o in ((g["home_team"], g["away_team"]), (g["away_team"], g["home_team"])):
                    nxt[X.NV2ESPN.get(t, t)] = {"opp": X.NV2ESPN.get(o, o), "day": g["gameday"], "week": g["week"]}
    except Exception as e: print("inj_cascade sched", e)
    onboard |= set(nxt)
    wk = max([int(v["week"]) for v in nxt.values()] or [int(week or 0)])
    prac_next = _practice(yr, wk) if wk else {}  # this week's Wed-Fri report (nflverse); empty until posted
    rows = _rows(yr); cur = [r for r in rows if r["season"] == str(yr)]
    # usage this season
    U, T = {}, {}
    for r in cur:
        u = U.setdefault(r["player_id"], {"name": r["player_display_name"], "pos": r["position"], "team": r["_t"], "g": 0, "tg": 0, "ca": 0, "att": 0})
        u["g"] += 1; u["tg"] += X.f(r["targets"]); u["ca"] += X.f(r["carries"]); u["att"] += X.f(r["attempts"]); u["team"] = r["_t"]
        t = T.setdefault(r["_t"], {"tg": 0, "ca": 0}); t["tg"] += X.f(r["targets"]); t["ca"] += X.f(r["carries"])
    for pid, u in U.items():
        t = T[u["team"]]; u["tgs"] = u["tg"] / t["tg"] if t["tg"] else 0; u["cas"] = u["ca"] / t["ca"] if t["ca"] else 0
        r = rz.get(pid); u["rzs"] = (r["ru"] + r["tg"]) / rzt[u["team"]] if r and rzt.get(u["team"]) else 0
    def role(pid):
        u = U[pid]; mates = [(k, v) for k, v in U.items() if v["team"] == u["team"] and v["pos"] == u["pos"]]
        rank = lambda key: sorted(mates, key=lambda kv: -kv[1][key]).index((pid, u)) + 1
        if u["pos"] == "QB" and rank("att") == 1: return "QB1"
        if u["pos"] == "RB" and rank("ca") == 1: return "RB1"
        if u["pos"] == "WR" and rank("tg") <= 2: return "WR%d" % rank("tg")
        if u["pos"] == "TE" and rank("tg") == 1 and u["tgs"] >= 0.08: return "TE1"
        if u["tgs"] >= 0.15 or u["cas"] >= 0.35 or u["rzs"] >= 0.15: return u["pos"]
        return None
    byname = {(X.norm(u["name"]), u["team"]): pid for pid, u in U.items()}
    d = F.get("https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries") or {}
    games_by = {}
    for (s, w, t), _ in []: pass
    G = {}
    for r in rows: G.setdefault((r["season"], r["week"], r["_t"]), {})[r["player_id"]] = r
    tprops = {}
    for p in props: tprops.setdefault(p["team"], []).append(p)
    out = []
    for tm in d.get("injuries", []):
        for i in tm.get("injuries", []):
            st = i.get("status", ""); a = i.get("athlete", {}); team = (a.get("team") or {}).get("abbreviation", "")
            if st not in STAT or team not in onboard: continue
            pid = byname.get((X.norm(a.get("displayName", "")), team))
            if not pid or U[pid]["g"] < 1: continue
            rl = role(pid)
            if not rl: continue
            u = U[pid]
            # with/without splits for teammates (2 seasons, same team-season, injured player was on that team that season)
            seasons = {s for (s, w, t), ps in G.items() if t == team and pid in ps}
            gm = [(k, ps) for k, ps in G.items() if k[2] == team and k[0] in seasons]
            mates = [k for k, v in U.items() if v["team"] == team and k != pid and v["pos"] in ("QB", "RB", "WR", "TE")]
            vt, vc = u["tg"] / u["g"], u["ca"] / u["g"]
            restT = sum(U[m]["tg"] for m in mates) or 1; restC = sum(U[m]["ca"] for m in mates if U[m]["pos"] == "RB") or 1
            aff = []
            for m in mates:
                mu = U[m]
                W, WO = [], []
                for k, ps in gm:
                    if m not in ps: continue
                    (W if pid in ps else WO).append(ps[m])
                av = lambda L, c: sum(X.f(x[c]) for x in L) / len(L) if L else None
                cols = ("targets", "carries", "receiving_yards", "rushing_yards", "passing_yards", "attempts")
                sw = {c: av(W, c) for c in cols}; so = {c: av(WO, c) for c in cols}
                tdw = av([dict(x, _td=X.f(x["rushing_tds"]) + X.f(x["receiving_tds"])) for x in W], "_td") if W else None
                tdo = av([dict(x, _td=X.f(x["rushing_tds"]) + X.f(x["receiving_tds"])) for x in WO], "_td") if WO else None
                pt = vt * mu["tg"] / restT if mu["pos"] != "QB" else 0
                if mu["pos"] == "RB": pc = vc * mu["ca"] / restC
                elif mu["pos"] == "QB" and u["pos"] == "RB": pc = min(1.0, 0.05 * vc)  # QB: small scramble/design bump only
                else: pc = 0
                if WO and W:  # Bayesian weight on the split: n/(n+4), rest on the share-out
                    wt = len(WO) / (len(WO) + 4.0)
                    sT, sC = so["targets"] - sw["targets"], so["carries"] - sw["carries"]
                    if mu["pos"] == "QB" and u["pos"] == "RB": sC = min(sC, 1.0)
                    dT = (1 - wt) * pt + wt * sT; dC = (1 - wt) * pc + wt * sC; how = "split %d%% / share-out" % round(100 * wt)
                else: dT, dC, how = pt, pc, "share-out"
                dT = max(-vt, min(vt, dT)); dC = max(-vc, min(vc, dC))
                base = (mu["tg"] + mu["ca"]) / mu["g"]
                tdr = sum(X.f(x["rushing_tds"]) + X.f(x["receiving_tds"]) for x in W) / max(1, sum(X.f(x["targets"]) + X.f(x["carries"]) for x in W)) if W else 0.04
                tdr = tdr or 0.03
                lam0 = (tdw if tdw is not None else base * tdr) or 0.01
                lam1 = lam0 + (dT + dC) * tdr
                tdr = min(tdr, 0.06)  # per-opportunity TD rate cap (league RB ~0.03-0.04)
                lam1 = lam0 + (dT + dC) * tdr
                dP = max(-0.15, min(0.15, (1 - math.exp(-lam1)) - (1 - math.exp(-lam0))))
                pyd = (so["passing_yards"] - sw["passing_yards"]) if mu["pos"] == "QB" and len(WO) >= 3 and W else None
                if abs(dT) < 0.4 and abs(dC) < 0.8 and pyd is None: continue
                mp = [{"aid": p["aid"], "market": p["market"], "line": p["line"],
                       "dir": ("down" if pyd is not None and pyd < 0 else "up") if p["market"].startswith(("Passing", "Pass")) else
                              ("up" if (dT if "Rec" in p["market"] or "Targ" in p["market"] else dC if "Rush" in p["market"] or "Carr" in p["market"] else dT + dC) > 0 else "down")}
                      for p in tprops.get(team, []) if X.norm(p["player"]) == X.norm(mu["name"]) and p.get("grp") != "def"]
                aff.append({"player": mu["name"], "pos": mu["pos"], "d_tg": round(dT, 1), "d_ca": round(dC, 1), "d_td": round(dP, 3),
                            "d_pass_yds": round(pyd, 1) if pyd is not None else None, "how": how,
                            "with": {"g": len(W), "tg": sw["targets"] and round(sw["targets"], 1), "ca": sw["carries"] and round(sw["carries"], 1), "td": tdw and round(tdw, 2)},
                            "without": {"g": len(WO), "tg": so["targets"] and round(so["targets"], 1), "ca": so["carries"] and round(so["carries"], 1), "td": tdo and round(tdo, 2)},
                            "props": mp})
            aff.sort(key=lambda x: -(abs(x["d_tg"]) + abs(x["d_ca"]) + 20 * abs(x["d_td"]) + abs(x["d_pass_yds"] or 0) / 20))
            pr = prac_next.get((X.norm(a.get("displayName", "")), team))
            gd = "inactive" in (i.get("shortComment") or "").lower() or "game" in (i.get("shortComment") or "").lower()
            imp = vt + vc + 10 * u["rzs"] + (15 if rl == "QB1" else 0)
            out.append({"team": team, "player": u["name"], "pos": u["pos"], "role": rl, "status": st, "date": i.get("date"),
                        "note": (i.get("shortComment") or "")[:240], "practice": ("%s (%s; %s)" % pr) if pr else None, "src": "this week's practice report" if pr else ("last game-day status" if gd else "ESPN report"),
                        "usage": {"tg_g": round(vt, 1), "ca_g": round(vc, 1), "tg_share": round(100 * u["tgs"]), "ca_share": round(100 * u["cas"]), "rz_share": round(100 * u["rzs"]), "g": u["g"]},
                        "scenarios": ["plays", "sits"] if st == "Questionable" else ["sits"],
                        "impact": round(imp, 1), "next": nxt.get(team), "on_board": team in {g["home"] for g in games} | {g["away"] for g in games}, "affected": aff[:6]})
    out.sort(key=lambda c: -c["impact"])
    return out
