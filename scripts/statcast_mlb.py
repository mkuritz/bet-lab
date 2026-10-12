"""Bet Lab · MLB Statcast tab: Baseball Savant expected stats, percentiles, pitch arsenals, batter-vs-pitch-type,
park factors + MLB statsapi probable pitchers, joined to today's MLB props. Free CSV/JSON endpoints, ~7 requests."""
import json, os, re, sys, time, collections
sys.path.insert(0, os.path.dirname(__file__))
from xlib import Src, rows, js, fetch, f, norm, write
D = os.path.join(os.path.dirname(__file__), "..", "data")
S = Src(); yr = int(time.strftime("%Y"))
SV = "https://baseballsavant.mlb.com/leaderboard/"
def sv(u): return rows(SV + u)
def keyname(r):
    n = r.get("last_name, first_name") or r.get("player_name") or ""
    if "," in n: l, fi = n.split(",", 1); n = fi.strip() + " " + l.strip()
    return norm(n)
games = json.load(open(os.path.join(D, "games_mlb.json"))); props = json.load(open(os.path.join(D, "props_mlb.json")))
def sched():
    out = {}
    for d in sorted({g["time"][:10] for g in games} | {time.strftime("%Y-%m-%d")}):
        for dd in js("https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=%s&hydrate=probablePitcher,team" % d).get("dates", []):
            for x in dd["games"]:
                t = x["teams"]; out[(t["away"]["team"].get("abbreviation"), t["home"]["team"].get("abbreviation"))] = dict(venue=x["venue"]["name"], vid=str(x["venue"]["id"]), ap=(t["away"].get("probablePitcher") or {}).get("fullName"), hp=(t["home"].get("probablePitcher") or {}).get("fullName"))
    return out
sc = S.get("MLB statsapi probable pitchers", "https://statsapi.mlb.com/api/v1/schedule", "Who's starting, to build the pitcher-vs-lineup matchups", sched) or {}
xb = S.get("Savant expected stats: hitters", SV + "expected_statistics", "xBA/xSLG/xwOBA vs actual", lambda: {keyname(r): r for r in sv("expected_statistics?type=batter&year=%d&min=1&csv=true" % yr)}) or {}
xp = S.get("Savant expected stats: pitchers", SV + "expected_statistics", "xERA, xwOBA allowed", lambda: {keyname(r): r for r in sv("expected_statistics?type=pitcher&year=%d&min=1&csv=true" % yr)}) or {}
pb = S.get("Savant percentile rankings: hitters", SV + "percentile-rankings", "Exit velo, barrel %, hard-hit %, K %, chase %", lambda: {keyname(r): r for r in sv("percentile-rankings?type=batter&year=%d&csv=true" % yr)}) or {}
pp = S.get("Savant percentile rankings: pitchers", SV + "percentile-rankings", "Whiff %, K %, BB %, barrel % allowed", lambda: {keyname(r): r for r in sv("percentile-rankings?type=pitcher&year=%d&csv=true" % yr)}) or {}
ars = S.get("Savant pitch arsenals (usage %)", SV + "pitch-arsenals", "Each starter's pitch mix", lambda: {keyname(r): r for r in sv("pitch-arsenals?year=%d&min=1&type=n_&hand=&csv=true" % yr)}) or {}
def bvp():
    o = collections.defaultdict(dict)
    for r in sv("pitch-arsenal-stats?type=batter&pitchType=&year=%d&team=&min=1&csv=true" % yr): o[keyname(r)][r["pitch_type"]] = r
    return dict(o)
bp = S.get("Savant batter results by pitch type", SV + "pitch-arsenal-stats", "Batter xwOBA / whiff % / hard-hit % vs each pitch type", bvp) or {}
def pitch_stats():
    o = collections.defaultdict(dict)
    for r in sv("pitch-arsenal-stats?type=pitcher&pitchType=&year=%d&team=&min=1&csv=true" % yr): o[keyname(r)][r["pitch_type"]] = r
    return dict(o)
pst = S.get("Savant pitcher results by pitch type", SV + "pitch-arsenal-stats", "Whiff % and xwOBA allowed per pitch", pitch_stats) or {}
def parks():
    h = fetch(SV + "statcast-park-factors?type=year&year=%d&batSide=&stat=index_wOBA&condition=All&rolling=3" % yr).decode()
    return {r["venue_id"]: r for r in json.loads(re.search(r"var data = (\[.*?\]);", h, re.S).group(1))}
pk = S.get("Savant park factors (3-yr rolling)", SV + "statcast-park-factors", "Runs / HR / wOBA index for today's park (100 = average)", parks) or {}
S.list = [dict(name="Already used: ESPN (DraftKings MLB props, lines, game logs)", status="ok", what="Prop lines and hit rates (unchanged)", new=False)] + S.list
PT = {"FF": "4-Seam", "SI": "Sinker", "FC": "Cutter", "SL": "Slider", "ST": "Sweeper", "CH": "Changeup", "CU": "Curve", "FS": "Splitter", "KC": "Knuckle-curve", "SV": "Slurve", "KN": "Knuckler"}
def mix(n):
    a = ars.get(norm(n or "")) or {}
    m = {k[2:].upper(): f(v) for k, v in a.items() if k.startswith("n_") and f(v)}
    return dict(sorted(m.items(), key=lambda x: -x[1]))
def matchup(b, m):
    rs = bp.get(b) or {}; w = tot = 0.0; wh = 0.0; used = 0
    for p, u in m.items():
        r = rs.get(p)
        if r and f(r["pa"], 0) >= 5 and f(r["est_woba"]) is not None:
            w += u * f(r["est_woba"]); wh += u * f(r["whiff_percent"], 0); tot += u; used += u
    return (round(w / tot, 3), round(wh / tot, 1), round(used)) if tot >= 40 else (None, None, round(used))
P = lambda r, k: (int(float(r[k])) if r and r.get(k) not in (None, "") else "—")
tables, gm = [], []
byteam = collections.defaultdict(lambda: collections.defaultdict(list))
for x in props: byteam[x["team"]][x["player"]].append("%s %s" % (x["market"], x["line"]))
for g in games:
    s = sc.get((g["away"], g["home"])) or {}
    park = pk.get(s.get("vid")) or {}
    pit = []
    for side, opp, sp in (("away", g["home"], s.get("ap")), ("home", g["away"], s.get("hp"))):
        if not sp: continue
        n = norm(sp); x = xp.get(n) or {}; pr = pp.get(n); m = mix(sp)
        mx = ", ".join("%s %d%%" % (PT.get(k, k), v) for k, v in list(m.items())[:4])
        best = sorted(((PT.get(k, k), f(r["whiff_percent"], 0)) for k, r in (pst.get(n) or {}).items() if f(r["pitches"], 0) >= 50), key=lambda z: -z[1])[:1]
        pit.append([sp, g[side], f(x.get("era")) or "—", f(x.get("xera")) or "—", f(x.get("est_woba")) or "—", P(pr, "k_percent"), P(pr, "whiff_percent"), P(pr, "chase_percent"), P(pr, "brl_percent"), mx or "—", ("%s (%.0f%% whiff)" % best[0]) if best else "—"])
        rows_ = []
        for b, mk in byteam[opp].items():
            bn = norm(b); xb_ = xb.get(bn); pr2 = pb.get(bn)
            if not xb_ and not pr2: continue
            mxw, mwh, cov = matchup(bn, m) if m else (None, None, 0)
            base = f((xb_ or {}).get("est_woba"))
            edge = round(mxw - base, 3) if mxw is not None and base is not None else None
            rows_.append([b, opp, sp, base if base is not None else "—", mxw if mxw is not None else "—", edge if edge is not None else "—", mwh if mwh is not None else "—", "%d%%" % cov, P(pr2, "exit_velocity"), P(pr2, "brl_percent"), P(pr2, "hard_hit_percent"), P(pr2, "k_percent"), "; ".join(sorted(set(mk))[:4]),
                          "good matchup" if edge is not None and edge >= .025 else ("tough matchup" if edge is not None and edge <= -.025 else "neutral")])
        rows_.sort(key=lambda r: -(r[5] if isinstance(r[5], float) else -9))
        gm += rows_
    ptxt = "%s · runs %s · HR %s · wOBA %s (100 = avg)" % (park.get("venue_name", s.get("venue", "?")), park.get("index_runs", "—"), park.get("index_hr", "—"), park.get("index_woba", "—"))
    tables.append(dict(title="%s @ %s · %s · park: %s" % (g["away"], g["home"], g.get("details", ""), ptxt), note="Probable starters with Statcast expected stats, percentile ranks (100 = best) and pitch mix. Use for strikeout / outs / hits-allowed props.", cols=["Starter", "Team", "ERA", "xERA", "xwOBA allowed", "K % pctile", "Whiff % pctile", "Chase % pctile", "Barrel % pctile (allowed)", "Pitch mix", "Best put-away pitch"], rows=pit))
tables.append(dict(title="Batter vs today's starter: pitch-type matchups (all games)", note="Matchup xwOBA = the batter's expected wOBA against each pitch type, weighted by how often today's starter throws it ('coverage' = share of the mix with enough sample). Edge = matchup xwOBA minus the batter's overall xwOBA: +.025 or more is a good matchup for hits / bases / H+R+RBI props; −.025 or worse leans unders. Percentiles: 100 = best.", cols=["Batter", "Team", "Facing", "xwOBA (season)", "Matchup xwOBA", "Edge", "Whiff % vs mix", "Coverage", "Exit velo pctile", "Barrel pctile", "Hard-hit pctile", "K % pctile", "Props on board", "Read"], rows=gm, flag=13))
summ = [["Games", len(games), "today's MLB slate"], ["Batter matchups", len(gm), "with Statcast data"], ["Good matchups", sum(1 for r in gm if r[13] == "good matchup"), "edge ≥ +.025 xwOBA"], ["Sources OK", "%d/%d" % (sum(s["status"] == "ok" for s in S.list), len(S.list)), "this refresh"]]
write(os.path.join(D, "statcast_mlb.json"), "Bet Lab · MLB Statcast", S, tables, summ)
print([(s["name"][:34], s["status"], s.get("rows")) for s in S.list], summ, [t["title"] for t in tables], gm[:4])
