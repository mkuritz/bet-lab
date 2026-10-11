"""Soccer context: competition-type splits (league / UEFA / UEFA knockout / big opponent), scorer-assister partnerships,
travel + midweek-UEFA fatigue + altitude + weather per match, and correlated same-game-parlay cards for lopsided matches.
Sources: ESPN match summaries (cached box files), ESPN standings, DK prices via ESPN, Open-Meteo. Estimates labelled."""
import os, glob, json, datetime as dt
import fetch_props as F
import weather as W

DOM = ("eng.1", "esp.1", "ita.1", "ger.1", "fra.1", "usa.1", "por.1", "ned.1", "tur.1", "ksa.1")
UEFA = ("uefa.champions", "uefa.europa", "uefa.europa.conf")
LGN = {"eng.1": "Premier League", "esp.1": "La Liga", "ita.1": "Serie A", "ger.1": "Bundesliga", "fra.1": "Ligue 1", "usa.1": "MLS",
       "por.1": "Primeira Liga", "ned.1": "Eredivisie", "tur.1": "Süper Lig", "ksa.1": "Saudi Pro League", "uefa.champions": "UCL", "uefa.europa": "UEL", "uefa.europa.conf": "UECL"}
KO = ("knockout", "round-of", "quarter", "semi", "final", "playoff")

def ml_prob(g):
    try:
        ps = {k: W_imp(g[k]) for k in ("mlh", "mla", "mld")}
        s = sum(ps.values()); return {k: v / s for k, v in ps.items()}
    except Exception: return None

def W_imp(a):
    a = float(a); return 100 / (a + 100) if a > 0 else -a / (-a + 100)

def top6(lg):
    d = F.get("https://site.api.espn.com/apis/v2/sports/soccer/%s/standings" % lg) or {}
    try: return {e["team"]["abbreviation"] for e in d["children"][0]["standings"]["entries"]
                 if next(s.get("value") for s in e["stats"] if s["name"] == "rank") <= 6}
    except Exception: return set()

def enrich(props, games):
    dbs = {os.path.basename(f)[:-9]: json.load(open(f)) for f in glob.glob(os.path.join(F.DATA, "soccer", "*_box.json"))}
    big = {lg: top6(lg) for lg in DOM}
    team_lg = {}
    for lg in DOM:
        for m in dbs.get(lg, {}).values():
            for t in m["t"].values(): team_lg[t] = lg
    want = {p["aid"] for p in props}
    sp, pairs, home_city, uefa_away = {}, {}, {}, {}
    for lg, db in dbs.items():
        for eid, m in db.items():
            h, a = m["t"].get("home"), m["t"].get("away")
            if m.get("v") and m["v"][0] and h and lg in DOM: home_city.setdefault(h, (m["d"], m["v"]))
            if m.get("v") and m["v"][0] and h and lg in DOM and m["d"] > home_city[h][0]: home_city[h] = (m["d"], m["v"])
            if lg in UEFA and a: uefa_away.setdefault(a, []).append((m["d"], h, LGN[lg]))
            ko = lg in UEFA and any(k in (m.get("ph") or "") for k in KO)
            for aid, row in m["p"].items():
                if aid not in want: continue
                team = row[0]; opp = a if team == h else h
                isbig = lg in UEFA or opp in big.get(team_lg.get(team, lg), set())
                v = dict(zip(("g", "a", "sh", "sot"), (row[4], row[5], row[6], row[7])))
                for tag in (["UEFA"] if lg in UEFA else ["League"]) + (["UEFA KO"] if ko else []) + (["Big opp"] if isbig else ["Non-big"]):
                    s = sp.setdefault(aid, {}).setdefault(tag, {"n": 0, "g": 0, "a": 0, "sh": 0, "sot": 0, "gm": 0})
                    s["n"] += 1; s["gm"] += 1 if v["g"] > 0 else 0
                    for k in v: s[k] += v[k]
            for _, sc, asst in m.get("ga", []):
                if not asst or sc not in m["p"] or asst not in m["p"] or m["p"][sc][0] != m["p"][asst][0]: continue
                k = (m["p"][sc][0], asst, sc)
                e = pairs.setdefault(k, {"n": 0, "an": m["p"][asst][3], "sn": m["p"][sc][3], "comps": set()})
                e["n"] += 1; e["comps"].add(LGN.get(lg, lg))
    # per prop: splits, callout, match type
    gmap = {g["id"]: g for g in games}
    for p in props:
        s = sp.get(p["aid"])
        g = gmap.get(p["game"], {})
        lg = p.get("lg", "")
        ko = lg in UEFA and any(k in (g.get("ph") or "") for k in KO)
        p["mt"] = {"type": "UEFA" if lg in UEFA else "League", "comp": LGN.get(lg, lg), "ko": ko,
                   "big": lg in UEFA or p.get("oa") in big.get(lg, set())}
        if not s: continue
        p["sp"] = {k: {"n": v["n"], "gpg": round(v["g"] / v["n"], 2), "apg": round(v["a"] / v["n"], 2), "sotpg": round(v["sot"] / v["n"], 2),
                       "g": v["g"], "a": v["a"], "gm": v["gm"]} for k, v in s.items()}
        L, B, U, K = (s.get(k) for k in ("League", "Big opp", "UEFA", "UEFA KO"))
        co = []
        if L and L["n"] >= 8 and L["g"] / L["n"] >= 0.3:
            for lab, X in (("vs big opponents", B), ("in UEFA knockout games", K), ("in UEFA", U)):
                if X and X["n"] >= 5 and X["g"] / X["n"] <= 0.5 * L["g"] / L["n"]:
                    co.append("Crushes %s (%d G in %d), quiet %s: %d G in %d" % (LGN.get(lg if lg in DOM else team_lg.get(p["team"], ""), "league"), L["g"], L["n"], lab, X["g"], X["n"])); break
        if B and B["n"] >= 5 and L and L["n"] >= 8 and B["g"] / B["n"] >= 1.3 * max(0.05, L["g"] / L["n"]) and B["g"] >= 3:
            co.append("Big-game player: %d G in %d vs big opponents (%.2f/app) vs %.2f/app overall league" % (B["g"], B["n"], B["g"] / B["n"], L["g"] / L["n"]))
        if co: p["co"] = co[:2]
    # per game context: travel, fatigue, altitude, weather
    for g in games:
        try:
            dt0 = dt.datetime.fromisoformat(g["time"].replace("Z", "+00:00")).date()
            v = g.get("venue") or [None, None, None]
            vg = W.geo(v[1], v[2] or "") if v[1] else None
            ctx = {"flags": []}
            hc = home_city.get(g["away"])
            if vg and hc:
                ag = W.geo(hc[1][0], hc[1][1] or "")
                ctx["travel_km"] = W.km(ag, vg)
                if ctx["travel_km"] and ctx["travel_km"] >= 1500: ctx["flags"].append("%s travel %d km" % (g["away"], ctx["travel_km"]))
            for t in (g["home"], g["away"]):
                for d, h, comp in uefa_away.get(t, []):
                    gap = (dt0 - dt.date.fromisoformat(d)).days
                    if 2 <= gap <= 4: ctx["flags"].append("%s played away in %s (@ %s) %d days earlier: fatigue risk" % (t, comp, h, gap))
            if vg and (vg.get("elev") or 0) >= 1500: ctx["flags"].append("Altitude %dm at %s" % (vg["elev"], vg["name"]))
            w = W.forecast(vg, g["time"]) if vg else None
            if w: ctx["wx"] = w; ctx["flags"] += w["flags"]
            ctx["city"] = v[1]
            g["ctx"] = ctx
        except Exception as e: print("soccer ctx game", g.get("id"), e)
    # game-script projection (MODEL ESTIMATE): team goals from this season's player goal tallies (own goals not counted)
    tg = {}
    for lg, db in dbs.items():
        for m in db.values():
            if m["d"] < ("2026-02-01" if lg == "usa.1" else "2026-07-01"): continue
            h, a = m["t"].get("home"), m["t"].get("away")
            if not h or not a: continue
            gl = {h: 0, a: 0}
            for row in m["p"].values():
                if row[0] in gl: gl[row[0]] += row[4]
            for t, o, ha in ((h, a, "h"), (a, h, "a")):
                e = tg.setdefault(t, {"h": [0, 0, 0], "a": [0, 0, 0]})[ha]
                e[0] += gl[t]; e[1] += gl[o]; e[2] += 1
    rate = lambda t, ha, i: (lambda e: e[i] / e[2] if e[2] >= 2 else None)(tg.get(t, {}).get(ha, [0, 0, 0]))
    for g in games:
        h, a = g["home"], g["away"]
        hf, aa, af, ha_ = rate(h, "h", 0), rate(a, "a", 1), rate(a, "a", 0), rate(h, "h", 1)
        if None in (hf, aa, af, ha_): continue
        lh, la = (hf + aa) / 2, (af + ha_) / 2
        adj = []
        if g["lg"] in UEFA: lh *= 0.95; la *= 0.95; adj.append("UEFA x0.95")
        w = (g.get("ctx") or {}).get("wx") or {}
        if any(f.startswith("Rain") for f in w.get("flags", [])): lh *= 0.95; la *= 0.95; adj.append("rain x0.95")
        if (w.get("wind") or 0) > 20: lh *= 0.95; la *= 0.95; adj.append("wind x0.95")
        tot = lh + la
        pr = ml_prob(g) if g.get("mld") is not None and g.get("mlh") is not None and g.get("mla") is not None else None
        tags = (["Shootout"] if tot >= 3.2 else ["Grinder"] if tot <= 2.2 else []) + (["Lopsided"] if pr and max(pr["mlh"], pr["mla"]) >= 0.65 else [])
        edge = round(tot - g["total"], 2) if g.get("total") is not None else None
        g["proj"] = {"h": round(lh, 2), "a": round(la, 2), "tot": round(tot, 2), "edge": edge, "tags": tags, "adj": adj,
                     "lean": None if edge is None or abs(edge) < 0.3 else ("over lean" if edge > 0 else "under lean"),
                     "basis": "avg(%s home GF %.2f, %s away GA %.2f) / avg(%s away GF %.2f, %s home GA %.2f)" % (h, hf, a, aa, a, af, h, ha_)}
    # hot scorers: goals in consecutive recent appearances (this season, all comps)
    # SGP cards
    cards = []
    byg = {}
    for p in props: byg.setdefault(p["game"], []).append(p)
    hr = lambda p: (p.get("x") or {}).get("l10") or [0, 0, 0]
    for g in games:
        pr = ml_prob(g) if g.get("mlh") is not None and g.get("mla") is not None and g.get("mld") is not None else None
        if not pr: continue
        side = "mlh" if pr["mlh"] >= pr["mla"] else "mla"
        if pr[side] < 0.6: continue
        fav = g["home"] if side == "mlh" else g["away"]; dog = g["away"] if fav == g["home"] else g["home"]
        ps = [p for p in byg.get(g["id"], []) if p["team"] == fav and p.get("ov") is not None]
        ag = sorted((p for p in ps if p["market"] == "Anytime Goal"), key=lambda p: -W_imp(p["ov"]))
        ast = {p["aid"]: p for p in ps if p["market"] == "Assists"}
        sot = {p["aid"]: p for p in ps if p["market"] == "Shots on Target"}
        legs, why = [], []
        good = lambda p: hr(p)[1] and hr(p)[0] / hr(p)[1] >= 0.3
        pr_list = sorted(((k, v) for k, v in pairs.items() if k[0] == fav and v["n"] >= 2 and k[2] in {p["aid"] for p in ag if good(p)} and k[1] in ast and good(ast[k[1]])), key=lambda kv: -kv[1]["n"])
        striker = ag[0] if ag else None
        if pr_list:
            (t, a_id, s_id), e = pr_list[0]
            striker = next(p for p in ag if p["aid"] == s_id)
            legs += [striker, ast[a_id]]
            why.append("%s assisted %s %d times in tracked matches (%s; league since 2025-26, UEFA since 2024-25)" % (e["an"], e["sn"], e["n"], ", ".join(sorted(e["comps"]))))
        elif striker:
            legs.append(striker)
            cr = max((p for p in ast.values() if p["aid"] != striker["aid"]), key=lambda p: (p.get("u") or {}).get("ga", {}).get("a", 0), default=None)
            if cr: legs.append(cr); why.append("%s leads %s prop players in assists this season (%d)" % (cr["player"], fav, (cr.get("u") or {}).get("ga", {}).get("a", 0)))
        if striker and striker["aid"] in sot: legs.append(sot[striker["aid"]])
        rate = lambda p: hr(p)[0] / hr(p)[1] if hr(p)[1] else 0
        legs = [p for p in legs if rate(p) >= 0.3]  # each leg must have hit 3+ of its last 10 (or 30%+)
        if len(legs) < 2: continue
        est = 1.0; dk = 1.0; ok = True
        for p in legs:
            h = hr(p)
            if not h[1]: ok = False
            est *= (h[0] / h[1]) if h[1] else 0
            dk *= 1 + (p["ov"] / 100 if p["ov"] > 0 else 100 / -p["ov"])
        clubs = g.get("clubs") or {}
        cards.append({"game": g["id"], "lg": g["lg"], "time": g["time"], "fav": fav, "dog": dog, "home": g["home"],
                      "club": clubs.get(fav, {}), "opp": clubs.get(dog, {}), "pwin": round(pr[side], 3), "ml": g[side], "mld": g.get("mld"),
                      "title": "%s blowout SGP" % (clubs.get(fav, {}).get("name") or fav),
                      "legs": [{"aid": p["aid"], "player": p["player"], "market": p["market"], "line": p["line"], "ov": p["ov"], "hit": hr(p)[:2]} for p in legs],
                      "why": why + ["DK makes %s a %d%% favorite (moneyline %s, vig removed)" % (fav, round(pr[side] * 100), g[side])] + (g.get("ctx") or {}).get("flags", [])[:2],
                      "est": round(est, 4) if ok else None, "dk_dec": round(dk, 2)})
    cards.sort(key=lambda c: -c["pwin"])
    F.save("soccer_sgp.json", {"updated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "cards": cards,
                               "pairs_top": sorted(([k[0], v["an"], v["sn"], v["n"]] for k, v in pairs.items() if v["n"] >= 4), key=lambda x: -x[3])[:60]})
    print("soccer ctx: sgp", len(cards), "pairs", len(pairs))
