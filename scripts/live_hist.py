"""Per-quarter player history for the Live tab's conditional stats (e.g. 'scored by halftime -> added another TD').
Source: nflverse play-by-play (same plays as ESPN summaries, already timestamped by quarter), last 2 seasons.
Output data/live_hist_nfl.json: {espn_aid: [[game_id, [[ry,recy,py,td,rec,car,ptd] x Q1..Q4(+OT)]], ...]}"""
import csv, gzip, io, os, json
from urllib.request import Request, urlopen
import fetch_props as F
import extras as X

def season_games(yr):
    with urlopen(Request(X.NV + "pbp/play_by_play_%d.csv.gz" % yr, headers=F.UA), timeout=180) as r:
        data = r.read()
    out = {}  # gsis -> {game: [[0]*7]*4}
    def cell(pid, g, q):
        gm = out.setdefault(pid, {}).setdefault(g, [[0] * 7 for _ in range(4)])
        return gm[min(q, 4) - 1]
    for r in csv.DictReader(io.TextIOWrapper(gzip.GzipFile(fileobj=io.BytesIO(data)), "utf-8")):
        if r.get("season_type") != "REG" or r.get("two_point_attempt") == "1": continue
        try: q = int(r["qtr"])
        except ValueError: continue
        g = r["game_id"]
        if r.get("rush_attempt") == "1" and r.get("rusher_player_id"):
            c = cell(r["rusher_player_id"], g, q); c[0] += X.f(r.get("rushing_yards")); c[5] += 1
        if r.get("pass_attempt") == "1" and r.get("passer_player_id") and r.get("sack") != "1":
            c = cell(r["passer_player_id"], g, q); c[2] += X.f(r.get("passing_yards"))
            if r.get("pass_touchdown") == "1": c[6] += 1
        if r.get("complete_pass") == "1" and r.get("receiver_player_id"):
            c = cell(r["receiver_player_id"], g, q); c[1] += X.f(r.get("receiving_yards")); c[4] += 1
        if r.get("touchdown") == "1" and r.get("td_player_id") and (r.get("rush_attempt") == "1" or r.get("complete_pass") == "1"):
            cell(r["td_player_id"], g, q)[3] += 1
    return out

def build(props):
    yr = X.season_year()
    cache = os.path.join(F.DATA, "pbp_hist_%d.json" % (yr - 1))
    if os.path.exists(cache): prev = json.load(open(cache))
    else:
        prev = season_games(yr - 1); json.dump(prev, open(cache, "w"), separators=(",", ":"))
    cur = season_games(yr)
    names = {}
    for y in (yr - 1, yr):
        try:
            for r in X.csv_rows(X.NV + "stats_player/stats_player_week_%d.csv" % y): names[r["player_id"]] = X.norm(r["player_display_name"])
        except Exception as e: print("live_hist names", y, e)
    want = {X.norm(p["player"]): p["aid"] for p in props if p["pos"] in ("QB", "RB", "WR", "TE", "FB")}
    out = {}
    for src in (prev, cur):
        for pid, gms in src.items():
            aid = want.get(names.get(pid, ""))
            if not aid: continue
            for g, qs in gms.items():
                out.setdefault(aid, []).append([g, [[round(v) for v in q] for q in qs]])
    for a in out: out[a].sort(key=lambda x: x[0], reverse=True)
    F.save("live_hist_nfl.json", out)
    print("live_hist players", len(out))
