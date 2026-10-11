"""Impact Flags engine (NFL). Inputs: ESPN injury report (statuses + blurbs, e.g. illness), nflverse snap counts
(who is a starter = 50%+ of offensive/defensive snaps this season; WR1/RB1/TE1 = top snap share at the position).
Output: concise flags with direction + affected props. Rules, not predictions."""
import re, datetime as dt
import fetch_props as F
import extras as X

OL = {"OT", "T", "G", "C", "OL", "OG"}
DL = {"DE", "DT", "NT", "DL", "EDGE", "OLB"}
LB = {"LB", "ILB", "MLB"}
DB = {"CB", "S", "FS", "SS", "DB"}
OUT = ("Out", "Doubtful", "Injured Reserve")
PASS_M = {"Passing Yards", "Pass Completions", "Passing Attempts", "Passing Touchdowns", "Passing Plus Rushing Yards",
          "Receiving Yards", "Receptions", "Longest Reception", "Longest Passing Completion"}
RUSH_M = {"Rushing Yards", "Carries", "Rushing Plus Receiving Yards", "Longest Rush"}

def reason(i):
    m = re.search(r"\(([^)]{2,40})\)", i.get("shortComment") or "")
    r = m.group(1) if m else ""
    return "" if "coach" in r.lower() else r

def build(snaps, props, games):
    d = F.get("https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries") or {}
    sn = {}
    for r in snaps:
        if r["game_type"] != "REG": continue
        t = X.NV2ESPN.get(r["team"], r["team"]); k = (X.norm(r["player"]), t)
        o, df = X.f(r["offense_pct"]), X.f(r["defense_pct"])
        e = sn.setdefault(k, {"name": r["player"], "team": t, "pos": r["position"], "o": [], "d": []})
        if X.f(r["offense_snaps"]) > 0: e["o"].append(o)
        if X.f(r["defense_snaps"]) > 0: e["d"].append(df)
    av = lambda v: sum(v) / len(v) if v else 0
    now = dt.datetime.now(dt.timezone.utc)
    inj = {}  # (norm, team) -> info
    for t in d.get("injuries", []):
        for i in t.get("injuries", []):
            st = i.get("status", ""); a = i.get("athlete", {})
            if st not in OUT + ("Questionable",): continue
            team = (a.get("team") or {}).get("abbreviation", "")
            if st == "Injured Reserve":  # only fresh IR moves are news
                try:
                    if now - dt.datetime.fromisoformat(i["date"].replace("Z", "+00:00")) > dt.timedelta(days=10): continue
                except Exception: continue
            inj[(X.norm(a.get("displayName", "")), team)] = {"name": a.get("displayName"), "status": st, "why": reason(i),
                                                            "pos": (a.get("position") or {}).get("abbreviation", "")}
    upcoming = [g for g in games if dt.datetime.fromisoformat(g["time"].replace("Z", "+00:00")) > now - dt.timedelta(hours=4)]
    opp = {}
    for g in upcoming: opp[g["home"]] = g["away"]; opp[g["away"]] = g["home"]
    by_team = {}
    for k, e in sn.items(): by_team.setdefault(e["team"], []).append((k, e))
    def tag(x): return "%s (%s%s)" % (x["name"], x["status"], ", " + x["why"] if x["why"] else "")
    flags = []
    def add(team, kind, dirn, text, sev, aff):
        flags.append({"id": "%s-%s-%d" % (team, kind, len(flags)), "team": team, "opp": opp.get(team), "kind": kind,
                      "dir": dirn, "text": text, "sev": sev, "aff": aff})
    for team in opp:
        roster = by_team.get(team, [])
        hurt = lambda k: inj.get(k)
        # OL
        ol = [(k, e) for k, e in roster if e["pos"] in OL and av(e["o"]) >= 0.5 and hurt(k)]
        olo = [hurt(k) for k, e in ol if hurt(k)["status"] in OUT]; olq = [hurt(k) for k, e in ol if hurt(k)["status"] == "Questionable"]
        if olo or olq:
            sev = 3 if len(olo) >= 2 else 2 if olo else 1
            txt = "%s OL: %s" % (team, ", ".join(z for z in (("%d starter%s out" % (len(olo), "" if len(olo) == 1 else "s")) if olo else "", ("%d questionable" % len(olq)) if olq else "") if z))
            add(team, "OL", "hurts run game & pass protection", txt + " — " + "; ".join(tag(x) for x in olo + olq), sev,
                {"team": team, "markets": sorted(PASS_M | RUSH_M | {"Anytime TD"}), "pos": ["QB", "RB"]})
        # QB
        qbs = sorted(((k, e) for k, e in roster if e["pos"] == "QB" and e["o"]), key=lambda kv: -av(kv[1]["o"]))
        if qbs and hurt(qbs[0][0]):
            x = hurt(qbs[0][0]); nxt = next((e["name"] for k, e in qbs[1:] if not hurt(k)), None)
            add(team, "QB", "QB risk — hurts pass game", "%s QB1 %s%s" % (team, tag(x), ("; next up %s" % nxt) if nxt and x["status"] in OUT else ""),
                3 if x["status"] in OUT else 2, {"team": team, "markets": sorted(PASS_M | {"Anytime TD"}), "pos": ["QB", "WR", "TE"]})
        # WR1 / RB1 / TE1
        for pos, lab in (("WR", "WR1"), ("RB", "RB1"), ("TE", "TE1")):
            ps = sorted(((k, e) for k, e in roster if (e["pos"] == pos or (pos == "RB" and e["pos"] in ("HB", "FB"))) and len(e["o"]) >= 2), key=lambda kv: -av(kv[1]["o"]))
            if not ps or not hurt(ps[0][0]): continue
            x = hurt(ps[0][0])
            if x["status"] == "Questionable":
                add(team, lab, "role risk", "%s %s %s" % (team, lab, tag(x)), 1, {"names": [x["name"]]}); continue
            nxt = [e["name"] for k, e in ps[1:] if not hurt(k)][:2]
            add(team, lab, "helps next man up" if nxt else "hurts %s game" % ("run" if pos == "RB" else "pass"),
                "%s %s %s out%s" % (team, lab, tag(x), ("; next man up: " + ", ".join(nxt)) if nxt else ""), 2,
                {"names": nxt, "team": team, "pos": [pos]})
        # opponent defensive starters out -> helps this offense
        o = opp[team]
        dout = [(e, hurt(k)) for k, e in by_team.get(o, []) if av(e["d"]) >= 0.5 and hurt(k) and hurt(k)["status"] in OUT]
        front = [x for e, x in dout if e["pos"] in DL | LB]; back = [x for e, x in dout if e["pos"] in DB]
        if back: add(team, "DEF-DB", "helps %s pass game" % team, "%s secondary: %d starter%s out — %s" % (o, len(back), "" if len(back) == 1 else "s", "; ".join(tag(x) for x in back)),
                     2 if len(back) >= 2 else 1, {"team": team, "markets": sorted(PASS_M | {"Anytime TD"}), "pos": ["QB", "WR", "TE"]})
        if front: add(team, "DEF-FRONT", "helps %s run game & protection" % team, "%s front seven: %d starter%s out — %s" % (o, len(front), "" if len(front) == 1 else "s", "; ".join(tag(x) for x in front)),
                      2 if len(front) >= 2 else 1, {"team": team, "markets": sorted(RUSH_M | {"Anytime TD", "Sacks"}), "pos": ["RB", "QB"]})
    # player's own listing (offense or defense props): injury tracking on the prop itself
    for p in props:
        x = inj.get((X.norm(p["player"]), p["team"]))
        if x and p["team"] in opp and not any(f["kind"] == "SELF" and f["aff"]["names"] == [p["player"]] for f in flags):
            add(p["team"], "SELF", "player status risk", "%s %s" % (p["team"], tag(x)), 2 if x["status"] in OUT else 1, {"names": [p["player"]]})
    # attach to props
    for p in props:
        ids = []
        for f in flags:
            a = f["aff"]
            if a.get("names") and p["player"] in a["names"] and (not a.get("pos") or p["pos"] in a["pos"]): ids.append(f["id"]); continue
            if a.get("team") and p["team"] == a["team"] and p["pos"] in a.get("pos", []) and p["market"] in a.get("markets", []): ids.append(f["id"])
        if ids: p["fl"] = ids
        else: p.pop("fl", None)
    flags.sort(key=lambda f: -f["sev"])
    F.save("impact_nfl.json", {"updated": now.isoformat(timespec="seconds"), "flags": flags})
    return flags
