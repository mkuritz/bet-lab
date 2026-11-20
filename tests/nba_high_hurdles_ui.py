"""NBA Hub High Hurdles + Stars shot zones (preview) UI check: renders, plus money only, no held players, 5-zone maps,
names open the existing profile, no horizontal overflow on phone, no sportsbook names. Run: python3 tests/nba_high_hurdles_ui.py"""
import json, os, re, sys, threading, http.server, functools
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
D = json.load(open(os.path.join(ROOT, "data", "nba_high_hurdles_page.json")))
held = {x["player"] for x in D.get("excluded", [])}
assert D["players"], "no rows in page JSON"
assert all(r["book"] >= 100 for r in D["players"]), "minus-money row"
assert all(r["hurdle"] > r["line"] for r in D["players"])
assert not held & {r["player"] for r in D["players"]} and not held & {s["player"] for s in D["stars"]}, "held player featured"
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT))
srv.RequestHandlerClass.log_message = lambda *a: None
threading.Thread(target=srv.serve_forever, daemon=True).start(); B = "http://127.0.0.1:%d/nba-hub.html" % srv.server_address[1]
BOOKS = re.compile(r"draftkings|fanduel|betmgm|caesars|bet365|espn ?bet|fanatics|pointsbet|bovada|pinnacle|betrivers|hard rock", re.I)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome")
    for w, h in [(1440, 900), (390, 844)]:
        c = b.new_context(viewport={"width": w, "height": h}, is_mobile=w < 800, has_touch=w < 800)
        pg = c.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(B + "#high-hurdles"); pg.wait_for_selector(".hh-row", timeout=30000)
        assert pg.locator(".hh-row").count() == len(D["players"])
        txt = pg.inner_text("#nba-hh"); assert not BOOKS.search(txt), "sportsbook name in public text"
        pg.click("[data-hh-view=stars]"); pg.wait_for_selector(".sz-card")
        assert pg.locator(".sz-card").count() == len(D["stars"])
        assert pg.locator(".sz-card").first.locator("svg title").count() >= 5
        pg.click("[data-hh-color=opp]"); pg.wait_for_selector(".sz-card svg")
        assert pg.evaluate("document.documentElement.scrollWidth") <= w, "horizontal overflow"
        pg.click(".sz-card a.plink >> nth=0"); pg.wait_for_timeout(1200)
        assert pg.evaluate("getComputedStyle(document.querySelector('#nba-modal-ov')).display") != "none", "profile did not open"
        assert not errs, errs
        c.close()
    b.close()
srv.shutdown(); print("PASS NBA High Hurdles UI: %d rows, %d stars, desktop + phone" % (len(D["players"]), len(D["stars"])))
