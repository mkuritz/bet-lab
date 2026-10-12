"""Kalshi public market data (no key): NFL anytime-TD prices to log next to our estimates (market comparison over time).
Uses series KXNFLANYTD; returns {norm(player name): yes mid-price 0-1}. Empty if Kalshi has no open ATD markets (as of Oct 2026 the 2026 season had none listed)."""
import json, urllib.request
import extras as X
API = "https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=KXNFLANYTD&status=open&limit=1000"

def atd_prices():
    out, cur = {}, ""
    try:
        for _ in range(10):
            d = json.load(urllib.request.urlopen(API + ("&cursor=" + cur if cur else ""), timeout=20))
            for m in d.get("markets", []):
                nm = m.get("yes_sub_title") or m.get("subtitle") or ""
                b, a = m.get("yes_bid"), m.get("yes_ask")
                if nm and a: out[X.norm(nm)] = round(((b or a) + a) / 200, 3)
            cur = d.get("cursor")
            if not cur: break
    except Exception as e: print("kalshi", e)
    return out
