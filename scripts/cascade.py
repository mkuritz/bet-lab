"""Injury-redistribution splits (NFL) from nflverse weekly player stats, 2 seasons.
For each team's current QB1 (most pass attempts this season) and RB1 (most carries):
QB rushing with vs without RB1, RB rushing/TDs with vs without QB1 (only games where the other player was on that team's roster that season
is not knowable for free, so 'without' = team games where he logged no stats row while the subject played). Historical splits, not projections."""
import extras as X

def run(yr):
    rows = []
    for y in (yr - 1, yr):
        try: rows += [r for r in X.csv_rows(X.NV + "stats_player/stats_player_week_%d.csv" % y) if r["season_type"] == "REG"]
        except Exception as e: print("cascade", y, e)
    cur = [r for r in rows if r["season"] == str(yr)]
    lead = {}
    for r in cur:
        t = X.NV2ESPN.get(r["team"], r["team"])
        for pos, col in (("QB", "attempts"), ("RB", "carries")):
            if r["position"] == pos:
                d = lead.setdefault((t, pos), {}); d[r["player_id"]] = d.get(r["player_id"], [0, r["player_display_name"]]); d[r["player_id"]][0] += X.f(r[col])
    games = {}  # (season, week, team) -> {pid: row}
    for r in rows:
        games.setdefault((r["season"], r["week"], X.NV2ESPN.get(r["team"], r["team"])), {})[r["player_id"]] = r
    out = {}
    for (t, pos), d in lead.items():
        if pos != "QB": continue
        rbd = lead.get((t, "RB"))
        if not rbd: continue
        qb = max(d, key=lambda k: d[k][0]); rb = max(rbd, key=lambda k: rbd[k][0])
        def agg(subj, other, cols):
            w, wo = [], []
            for (s, wk, tm), ps in games.items():
                if subj not in ps: continue
                if X.NV2ESPN.get(ps[subj]["team"], ps[subj]["team"]) != t and s == str(yr): continue
                # only count games where 'other' was on the same team that season (he appears for this team in some week of that season)
                if not any(other in p2 for (s2, w2, t2), p2 in games.items() if s2 == s and t2 == tm): continue
                (w if other in ps else wo).append([X.f(ps[subj][c]) for c in cols])
            f = lambda L: {"g": len(L), **{c: round(sum(x[i] for x in L) / len(L), 2) for i, c in enumerate(cols)}} if L else {"g": 0}
            return {"with": f(w), "without": f(wo)}
        out[t] = {"qb": d[qb][1], "rb": rbd[rb][1],
                  "qb_vs_rb": agg(qb, rb, ["carries", "rushing_yards", "rushing_tds", "passing_tds"]),
                  "rb_vs_qb": agg(rb, qb, ["carries", "rushing_yards", "rushing_tds", "receiving_tds"])}
    return out
