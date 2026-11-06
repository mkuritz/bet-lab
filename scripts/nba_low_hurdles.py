#!/usr/bin/env python3
"""NBA Hub Low Hurdles (display-only).

Builds data/nba_low_hurdles.json from published nba_hub.json props + plogs_nba.json.
Does not change picks, model weights, or projections.
"""
from __future__ import annotations

import json
import math
import os
from collections import Counter, defaultdict
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
ET = ZoneInfo("America/New_York")
SEASON_START = "2026-10-01"

# Reference mins were Points 7 / Rebounds 6 / Assists 6 / Threes 5.
# Early 2026-27 coverage (~6–8 logged games) is too thin for Points@7 /
# Assists@6, so all four sections use a consistent minimum of 5 games.
MIN_STREAK = {
    "Points": 5,
    "Rebounds": 5,
    "Assists": 5,
    "3-Point Field Goals": 5,
}
MARKETS = {
    "Points": {
        "key": "points",
        "label": "Points",
        "short": "Points",
        "section": "points",
    },
    "Rebounds": {
        "key": "totalRebounds",
        "label": "Rebounds",
        "short": "Rebounds",
        "section": "rebounds",
    },
    "Assists": {
        "key": "assists",
        "label": "Assists",
        "short": "Assists",
        "section": "assists",
    },
    "3-Point Field Goals": {
        "key": "threePointFieldGoalsMade-threePointFieldGoalsAttempted",
        "label": "Three-Pointers Made",
        "short": "3PM",
        "section": "threes",
    },
}


def floor_from_line(line: float) -> tuple[int, int]:
    """Return (display_floor, clear_min).

    Standard over: total must be strictly greater than a half-line.
    24.5 needs 25 → display 25+. Integer threshold 15 needs 15 → display 15+.
    """
    line = float(line)
    if line == int(line):
        n = int(line)
        return n, n
    n = math.floor(line) + 1
    return n, n


def season_games(plogs: dict, aid: str) -> list:
    games = plogs.get(str(aid)) or []
    cur = [g for g in games if g.get("d") and g["d"] >= SEASON_START]
    return sorted(cur, key=lambda g: g["d"], reverse=True)


def active_streak(games: list, stat_key: str, clear_min: int) -> tuple[int, list, list]:
    """Count consecutive most-recent completed games clearing clear_min.

    Skips 0-minute DNPs. Stops at first miss or missing stat. No last-season games.
    Returns (streak, justifying_totals newest→oldest, justifying_game_meta).
    """
    streak = 0
    totals = []
    meta = []
    for g in games:
        s = g.get("s") or {}
        mins = s.get("minutes")
        if mins is None or mins == 0:
            continue
        val = s.get(stat_key)
        if val is None:
            break
        if float(val) >= clear_min:
            streak += 1
            totals.append(float(val))
            meta.append(
                {
                    "date": g.get("d"),
                    "opp": g.get("o"),
                    "at": g.get("at"),
                    "total": float(val),
                }
            )
        else:
            break
    return streak, totals, meta


def opp_label(prop: dict, slate: dict) -> str:
    matchup = prop.get("matchup") or prop.get("opp") or ""
    if matchup:
        return str(matchup)
    gid = str(prop.get("game") or "")
    g = slate.get(gid)
    if not g:
        return ""
    team = prop.get("team")
    if team == g.get("home"):
        return "vs " + g.get("away", "")
    if team == g.get("away"):
        return "@" + g.get("home", "")
    return ""


def main() -> None:
    hub = json.load(open(os.path.join(DATA, "nba_hub.json")))
    plogs = json.load(open(os.path.join(DATA, "plogs_nba.json")))
    props = hub.get("props") or []
    slate = {str(g["id"]): g for g in (hub.get("slate") or [])}

    sections = {meta["section"]: [] for meta in MARKETS.values()}
    coverage = {
        meta["section"]: Counter() for meta in MARKETS.values()
    }
    excluded = {
        meta["section"]: {
            "missing_line": 0,
            "missing_logs": 0,
            "short_streak": 0,
            "no_upcoming_game": 0,
        }
        for meta in MARKETS.values()
    }

    now = datetime.now(timezone.utc)
    for p in props:
        market = p.get("market")
        if market not in MARKETS:
            continue
        meta = MARKETS[market]
        sec = meta["section"]
        coverage[sec]["candidates"] += 1

        line = p.get("line")
        if line is None:
            excluded[sec]["missing_line"] += 1
            continue

        time_s = p.get("time")
        if not time_s:
            excluded[sec]["no_upcoming_game"] += 1
            continue
        try:
            tip = datetime.fromisoformat(str(time_s).replace("Z", "+00:00"))
        except ValueError:
            excluded[sec]["no_upcoming_game"] += 1
            continue
        if tip < now:
            # Only upcoming published games
            excluded[sec]["no_upcoming_game"] += 1
            continue

        aid = str(p.get("aid") or "")
        games = season_games(plogs, aid)
        if not games:
            excluded[sec]["missing_logs"] += 1
            continue

        floor, clear_min = floor_from_line(line)
        streak, totals, game_meta = active_streak(games, meta["key"], clear_min)
        min_n = MIN_STREAK[market]
        if streak < min_n:
            excluded[sec]["short_streak"] += 1
            coverage[sec][f"streak_{streak}"] += 1
            continue

        tip_et = tip.astimezone(ET)
        row = {
            "aid": aid,
            "player": p.get("player"),
            "team": p.get("team"),
            "opp": opp_label(p, slate),
            "game": str(p.get("game") or ""),
            "time": tip.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
            "time_et": tip_et.strftime("%a %b %d · %-I:%M %p ET"),
            "market": market,
            "market_label": meta["label"],
            "line": float(line),
            "floor": floor,
            "floor_label": f"{floor}+ {meta['label']}",
            "streak": streak,
            "min_required": min_n,
            "recent_totals": totals,
            "recent_games": game_meta,
        }
        sections[sec].append(row)
        coverage[sec]["qualify"] += 1

    for sec, rows in sections.items():
        rows.sort(key=lambda r: (-r["streak"], -r["floor"], r["player"] or ""))

    out = {
        "updated": hub.get("updated"),
        "built_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
        "season_start": SEASON_START,
        "definition": {
            "tonight_number": "Published NBA Hub prop line for that market on the upcoming game.",
            "clear": "Completed-game total must be strictly greater than a half-line (24.5→25), or ≥ an integer threshold (15→15). Display floor is that integer with a + suffix.",
            "active_streak": "Count of consecutive most-recent current-season completed games (minutes > 0) that cleared the same tonight number; stop at first miss. No skipped games. No prior season.",
            "minimum_streaks": MIN_STREAK,
            "minimum_note": "Reference floors were Points 7 / Rebounds 6 / Assists 6 / Threes 5. Early 2026-27 logs are short (~6–8 games), so all four sections use a consistent minimum of 5. Raise back when the season has enough games.",
            "display_only": True,
        },
        "order": ["points", "rebounds", "assists", "threes"],
        "titles": {
            "points": "Points",
            "rebounds": "Rebounds",
            "assists": "Assists",
            "threes": "Three-Pointers Made",
        },
        "sections": sections,
        "coverage": {
            sec: {
                "candidates": int(coverage[sec].get("candidates", 0)),
                "qualify": int(coverage[sec].get("qualify", 0)),
                "excluded": excluded[sec],
                "short_streak_breakdown": {
                    k: int(v)
                    for k, v in sorted(coverage[sec].items())
                    if str(k).startswith("streak_")
                },
            }
            for sec in sections
        },
        "total_highlighted": sum(len(v) for v in sections.values()),
    }

    path = os.path.join(DATA, "nba_low_hurdles.json")
    with open(path, "w") as f:
        json.dump(out, f, indent=2)
        f.write("\n")
    print(
        f"wrote {path} · highlighted {out['total_highlighted']} · "
        + ", ".join(f"{k}:{len(v)}" for k, v in sections.items())
    )


if __name__ == "__main__":
    main()
